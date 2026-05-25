import { ObjectId } from "mongodb";
import { teamMemberActivityData } from "../data/team-member-activity.data";
import { teamData } from "../data/team.data";
import { userData } from "../data/user.data";

export interface TeamMemberStats {
  userId: string;
  userName: string;
  userAvatar?: string;
  stravaUserId?: number;
  teamId: string;
  teamName: string;
  totalDistance: number;
  averagePace: number;
  bestPace: number;
  totalActivities: number;
  totalTracklog: number;
  rank?: number;
}

export interface TeamMemberLeaderboardResponse {
  contestId: string;
  teamFilter?: string;
  cachedAt: string;
  members: TeamMemberStats[];
}

export interface TeamMemberActivity {
  activityId: string;
  distance: number;
  pace: number;
  movingTime: number;
  workoutType: string;
  startDate: string;
  stravaActivityId?: number;
}

export interface TeamMemberActivitiesResponse {
  contestId: string;
  userId: string;
  userName: string;
  teamName: string;
  activities: TeamMemberActivity[];
}

class TeamMemberLeaderboardService {
  /**
   * Calculate team member statistics for a contest using MongoDB aggregation
   * @param contestId The contest ID
   * @param teamId Optional team ID to filter by specific team
   * @param limit Maximum number of results to return
   */
  async calculateTeamMemberStats(
    contestId: ObjectId,
    teamId?: ObjectId,
    limit: number = 100,
  ): Promise<TeamMemberStats[]> {
    try {
      const collection = (teamMemberActivityData as any).collection;

      // Build match conditions - exclude rejected activities
      const matchConditions: any = {
        contestId: new ObjectId(contestId),
        // Only include valid activities (status is 'valid' or doesn't exist for backward compatibility)
        $or: [{ status: "valid" }, { status: { $exists: false } }],
      };

      if (teamId) {
        matchConditions.teamId = new ObjectId(teamId);
      }

      // MongoDB aggregation pipeline
      const pipeline = [
        // Match activities for this contest (and optionally team)
        { $match: matchConditions },

        // Group by user and team
        {
          $group: {
            _id: {
              userId: "$userId",
              teamId: "$teamId",
              stravaUserId: "$stravaUserId",
            },
            totalDistance: { $sum: "$distance" },
            totalMovingTime: { $sum: "$movingTime" },
            activities: { $push: "$$ROOT" },
            totalActivities: { $sum: 1 },
          },
        },

        // Calculate statistics
        {
          $addFields: {
            // Distance-weighted average pace
            averagePaceWeighted: {
              $sum: {
                $map: {
                  input: "$activities",
                  as: "activity",
                  in: {
                    $cond: [
                      { $gt: ["$$activity.distance", 0] },
                      { $multiply: ["$$activity.pace", "$$activity.distance"] },
                      0,
                    ],
                  },
                },
              },
            },

            // Best (minimum valid) pace
            bestPace: {
              $min: {
                $map: {
                  input: {
                    $filter: {
                      input: "$activities",
                      as: "activity",
                      cond: {
                        $and: [
                          { $gt: ["$$activity.pace", 0] },
                          { $lt: ["$$activity.pace", 999] },
                        ],
                      },
                    },
                  },
                  as: "activity",
                  in: "$$activity.pace",
                },
              },
            },

            // Unique activity dates (tracklog)
            uniqueDates: {
              $setUnion: {
                $map: {
                  input: "$activities",
                  as: "activity",
                  in: {
                    $dateToString: {
                      format: "%Y-%m-%d",
                      date: "$$activity.startDate",
                    },
                  },
                },
              },
            },
          },
        },

        // Calculate derived fields
        {
          $addFields: {
            averagePace: {
              $cond: [
                { $gt: ["$totalDistance", 0] },
                { $divide: ["$averagePaceWeighted", "$totalDistance"] },
                0,
              ],
            },
            totalTracklog: { $size: "$uniqueDates" },
            bestPace: { $ifNull: ["$bestPace", 0] },
          },
        },

        // Lookup team information
        {
          $lookup: {
            from: "Teams",
            localField: "_id.teamId",
            foreignField: "_id",
            as: "team",
          },
        },

        // Lookup user information
        {
          $lookup: {
            from: "Users",
            localField: "_id.userId",
            foreignField: "_id",
            as: "user",
          },
        },

        // Unwind lookups
        {
          $unwind: {
            path: "$team",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $unwind: {
            path: "$user",
            preserveNullAndEmptyArrays: true,
          },
        },

        // Project final fields
        {
          $project: {
            userId: { $toString: "$_id.userId" },
            userName: {
              $cond: [
                {
                  $and: [
                    { $ne: ["$user.stravaProfile.firstname", null] },
                    { $ne: ["$user.stravaProfile.lastname", null] },
                  ],
                },
                {
                  $concat: [
                    "$user.stravaProfile.firstname",
                    " ",
                    "$user.stravaProfile.lastname",
                  ],
                },
                { $ifNull: ["$user.username", "Unknown User"] },
              ],
            },
            userAvatar: "$user.stravaProfile.profilePictureUrl",
            stravaUserId: "$_id.stravaUserId",
            teamId: { $toString: "$_id.teamId" },
            teamName: "$team.name",
            totalDistance: { $round: ["$totalDistance", 2] },
            averagePace: { $round: ["$averagePace", 2] },
            bestPace: { $round: ["$bestPace", 2] },
            totalActivities: 1,
            totalTracklog: 1,
          },
        },

        // Sort by total distance (descending)
        { $sort: { totalDistance: -1 } },

        // Limit results
        { $limit: limit },
      ];

      const results = await collection.aggregate(pipeline).toArray();

      // Add rankings
      return results.map(
        (result: any, index: number): TeamMemberStats => ({
          userId: result.userId,
          userName: result.userName || "Unknown User",
          userAvatar: result.userAvatar,
          stravaUserId: result.stravaUserId,
          teamId: result.teamId,
          teamName: result.teamName || "Unknown Team",
          totalDistance: result.totalDistance,
          averagePace: result.averagePace,
          bestPace: result.bestPace,
          totalActivities: result.totalActivities,
          totalTracklog: result.totalTracklog,
          rank: index + 1,
        }),
      );
    } catch (error) {
      console.error("Error calculating team member stats:", error);
      throw error;
    }
  }

  /**
   * Get team member leaderboard for a contest
   */
  async getTeamMemberLeaderboard(
    contestId: ObjectId,
    teamId?: ObjectId,
    limit: number = 100,
  ): Promise<TeamMemberLeaderboardResponse> {
    try {
      const members = await this.calculateTeamMemberStats(
        contestId,
        teamId,
        limit,
      );

      return {
        contestId: contestId.toString(),
        teamFilter: teamId?.toString(),
        cachedAt: new Date().toISOString(),
        members,
      };
    } catch (error) {
      console.error("Error getting team member leaderboard:", error);
      throw error;
    }
  }

  /**
   * Get all activities for a specific team member in a contest
   */
  async getTeamMemberActivities(
    contestId: ObjectId,
    userId: ObjectId,
  ): Promise<TeamMemberActivitiesResponse> {
    try {
      // Get activities for this user in this contest
      const activities = await teamMemberActivityData.findByContestAndUser(
        contestId,
        userId,
      );

      // Get user information
      const user = await userData.findById(userId.toString());
      let userName = "Unknown User";
      if (user) {
        if (user.stravaProfile?.firstname && user.stravaProfile?.lastname) {
          userName = `${user.stravaProfile.firstname} ${user.stravaProfile.lastname}`;
        } else {
          userName = user.username || "Unknown User";
        }
      }

      // Get team information (assuming user is in one team per contest)
      let teamName = "Unknown Team";
      if (activities.length > 0 && activities[0].teamId) {
        const team = await teamData.findById(activities[0].teamId);
        teamName = team?.name || "Unknown Team";
      }

      // Sort activities by date (descending)
      const sortedActivities = activities
        .sort((a, b) => {
          const dateA = new Date(a.startDate).getTime();
          const dateB = new Date(b.startDate).getTime();
          return dateB - dateA; // Descending order
        })
        .map((activity) => ({
          activityId: activity._id?.toString() || "",
          distance: Math.round((activity.distance || 0) * 100) / 100,
          pace: Math.round((activity.pace || 0) * 100) / 100,
          movingTime: activity.movingTime || 0,
          workoutType: activity.workoutType || "Unknown",
          startDate: activity.startDate.toISOString(),
          stravaActivityId: activity.stravaActivityId,
        }));

      return {
        contestId: contestId.toString(),
        userId: userId.toString(),
        userName,
        teamName,
        activities: sortedActivities,
      };
    } catch (error) {
      console.error("Error getting team member activities:", error);
      throw error;
    }
  }
}

export const teamMemberLeaderboardService = new TeamMemberLeaderboardService();
