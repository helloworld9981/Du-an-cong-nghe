import { ObjectId } from "mongodb";
import { teamMemberActivityData } from "../data/team-member-activity.data";
import { teamData } from "../data/team.data";
import { redisService } from "./redis.service";

export interface TeamStatsResult {
  teamId: string;
  teamName: string;
  totalDistance: number;
  averagePace: number;
  totalTracklog: number;
  fastestPace: number;
  maxDistance: number;
  totalActivities: number;
  memberCount: number;
  rank?: number;
  badge?: "gold" | "silver" | "bronze";
}

export interface TeamLeaderboardResponse {
  contestId: string;
  metric: string;
  cachedAt: string;
  teams: TeamStatsResult[];
}

export interface IndividualTeamStatsResponse {
  teamId: string;
  teamName: string;
  contestId: string;
  stats: {
    totalDistance: number;
    averagePace: number;
    totalTracklog: number;
    fastestPace: number;
    maxDistance: number;
    totalActivities: number;
    memberCount: number;
  };
  ranking: {
    totalDistance: number;
    averagePace: number;
    totalTracklog: number;
  };
  cachedAt: string;
}

export type LeaderboardMetric =
  | "totalDistance"
  | "averagePace"
  | "totalTracklog";

export class TeamStatsAggregationService {
  private readonly CACHE_TTL = {
    LEADERBOARD: 10 * 60, // 10 minutes
    INDIVIDUAL_STATS: 15 * 60, // 15 minutes
  };

  /**
   * Get team leaderboard for a contest with aggregated statistics
   */
  async getContestTeamLeaderboard(
    contestId: ObjectId,
    metric: LeaderboardMetric = "totalDistance",
    limit: number = 50,
  ): Promise<TeamLeaderboardResponse> {
    // TODO: Implement caching later
    // const cacheKey = `contest:${contestId}:leaderboard:${metric}`;

    try {
      // TODO: Try to get from cache first
      // const cachedResult = await this.getCachedResult(cacheKey);
      // if (cachedResult) {
      //   return cachedResult;
      // }

      // Calculate fresh results
      const teams = await this.calculateTeamStats(contestId, metric, limit);

      const result: TeamLeaderboardResponse = {
        contestId: contestId.toString(),
        metric,
        cachedAt: new Date().toISOString(),
        teams,
      };

      // TODO: Cache the result
      // await this.setCachedResult(cacheKey, result, this.CACHE_TTL.LEADERBOARD);

      return result;
    } catch (error) {
      console.error("Error calculating team leaderboard:", error);
      return this.getFallbackLeaderboard(contestId, metric);
    }
  }

  /**
   * Get individual team statistics for a specific team in a contest
   */
  async getIndividualTeamStats(
    contestId: ObjectId,
    teamId: ObjectId,
  ): Promise<IndividualTeamStatsResponse> {
    // TODO: Implement caching later
    // const cacheKey = `contest:${contestId}:team:${teamId}:stats`;

    try {
      // TODO: Try to get from cache first
      // const cachedResult = await this.getCachedResult(cacheKey);
      // if (cachedResult) {
      //   return cachedResult;
      // }

      // Calculate fresh results
      const [teamStats, teamRankings] = await Promise.all([
        this.calculateSingleTeamStats(contestId, teamId),
        this.calculateTeamRankings(contestId, teamId),
      ]);

      const result: IndividualTeamStatsResponse = {
        teamId: teamId.toString(),
        teamName: teamStats.teamName,
        contestId: contestId.toString(),
        stats: {
          totalDistance: teamStats.totalDistance,
          averagePace: teamStats.averagePace,
          totalTracklog: teamStats.totalTracklog,
          fastestPace: teamStats.fastestPace,
          maxDistance: teamStats.maxDistance,
          totalActivities: teamStats.totalActivities,
          memberCount: teamStats.memberCount,
        },
        ranking: teamRankings,
        cachedAt: new Date().toISOString(),
      };

      // TODO: Cache the result
      // await this.setCachedResult(cacheKey, result, this.CACHE_TTL.INDIVIDUAL_STATS);

      return result;
    } catch (error) {
      console.error("Error calculating individual team stats:", error);
      return this.getFallbackIndividualStats(contestId, teamId);
    }
  }

  /**
   * Calculate team statistics using MongoDB aggregation pipeline
   */
  private async calculateTeamStats(
    contestId: ObjectId,
    metric: LeaderboardMetric,
    limit: number,
  ): Promise<TeamStatsResult[]> {
    // Access the Teams collection to start with all teams in the contest
    if (!teamData.isConnected()) {
      throw new Error("Team database connection not established");
    }

    const sortField = this.getSortField(metric);
    const sortOrder = metric === "averagePace" ? 1 : -1; // Ascending for pace (faster is better), descending for others

    // Start aggregation from Teams collection to ensure all teams are included
    const pipeline = [
      // Match teams for this contest
      { $match: { contestId: new ObjectId(contestId) } },

      // Lookup team activities from TeamMemberActivities
      {
        $lookup: {
          from: "TeamMemberActivities",
          let: { teamId: "$_id", contestId: "$contestId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$teamId", "$$teamId"] },
                    { $eq: ["$contestId", "$$contestId"] },
                    // Only include valid activities (not rejected)
                    {
                      $or: [
                        { $eq: ["$status", "valid"] },
                        { $eq: [{ $type: "$status" }, "missing"] },
                      ],
                    },
                  ],
                },
              },
            },
          ],
          as: "activities",
        },
      },

      // Calculate statistics from activities
      {
        $addFields: {
          totalDistance: {
            $sum: {
              $map: {
                input: "$activities",
                as: "activity",
                in: "$$activity.distance",
              },
            },
          },
          totalActivities: { $size: "$activities" },
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
          totalDistanceForPace: {
            $sum: {
              $map: {
                input: "$activities",
                as: "activity",
                in: "$$activity.distance",
              },
            },
          },
          fastestPace: {
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
          maxDistance: {
            $max: {
              $map: {
                input: "$activities",
                as: "activity",
                in: "$$activity.distance",
              },
            },
          },
          participantTracklogCounts: {
            $map: {
              input: {
                $setUnion: {
                  $map: {
                    input: "$activities",
                    as: "activity",
                    in: "$$activity.userId",
                  },
                },
              },
              as: "userId",
              in: {
                $size: {
                  $setUnion: {
                    $map: {
                      input: {
                        $filter: {
                          input: "$activities",
                          as: "activity",
                          cond: { $eq: ["$$activity.userId", "$$userId"] },
                        },
                      },
                      as: "userActivity",
                      in: {
                        $dateToString: {
                          format: "%Y-%m-%d",
                          date: "$$userActivity.startDate",
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },

      // Calculate derived fields with proper defaults
      {
        $addFields: {
          averagePace: {
            $cond: [
              { $gt: ["$totalDistanceForPace", 0] },
              { $divide: ["$averagePaceWeighted", "$totalDistanceForPace"] },
              0,
            ],
          },
          totalTracklog: {
            $sum: {
              $ifNull: ["$participantTracklogCounts", []],
            },
          },
          fastestPace: { $ifNull: ["$fastestPace", 0] },
          maxDistance: { $ifNull: ["$maxDistance", 0] },
          totalDistance: { $ifNull: ["$totalDistance", 0] },
          totalActivities: { $ifNull: ["$totalActivities", 0] },
        },
      },

      // Project final fields
      {
        $project: {
          teamId: { $toString: "$_id" },
          teamName: "$name",
          totalDistance: { $round: ["$totalDistance", 2] },
          averagePace: { $round: ["$averagePace", 2] },
          totalTracklog: 1,
          fastestPace: { $round: ["$fastestPace", 2] },
          maxDistance: { $round: ["$maxDistance", 2] },
          totalActivities: 1,
          memberCount: "$numberOfMember",
          // Keep the sort field for sorting
          [sortField]: 1,
          // Create a special sort field for averagePace that treats 0 as worst (999)
          averagePaceSortField: {
            $cond: [
              { $eq: ["$averagePace", 0] },
              999, // Put teams with no activities at the end
              "$averagePace",
            ],
          },
        },
      },

      // Sort by chosen metric (use special sort field for averagePace to handle 0 values)
      {
        $sort: {
          [metric === "averagePace" ? "averagePaceSortField" : sortField]:
            sortOrder,
        },
      },

      // Limit results
      { $limit: limit },
    ];

    // Get the Teams collection
    const collection = (teamData as any).collection;
    if (!collection) {
      throw new Error("Teams collection not available");
    }
    const results = await collection.aggregate(pipeline).toArray();

    // Add rankings and badges
    return results.map(
      (result: any, index: number): TeamStatsResult => ({
        teamId: result.teamId,
        teamName: result.teamName,
        totalDistance: result.totalDistance,
        averagePace: result.averagePace,
        totalTracklog: result.totalTracklog,
        fastestPace: result.fastestPace,
        maxDistance: result.maxDistance,
        totalActivities: result.totalActivities,
        memberCount: result.memberCount,
        rank: index + 1,
        badge: this.getBadge(index),
      }),
    );
  }

  /**
   * Calculate statistics for a single team
   */
  private async calculateSingleTeamStats(
    contestId: ObjectId,
    teamId: ObjectId,
  ): Promise<TeamStatsResult> {
    // Get team info first to ensure team exists
    const team = await teamData.findById(teamId);
    if (!team) {
      throw new Error("Team not found");
    }

    // Verify team belongs to this contest
    if (team.contestId.toString() !== contestId.toString()) {
      throw new Error("Team does not belong to the specified contest");
    }

    if (!teamMemberActivityData.isConnected()) {
      throw new Error("TeamMemberActivity database connection not established");
    }

    const pipeline = [
      // Match activities for this team and contest (exclude rejected)
      {
        $match: {
          contestId: new ObjectId(contestId),
          teamId: new ObjectId(teamId),
          // Only include valid activities (status is 'valid' or doesn't exist for backward compatibility)
          $or: [{ status: "valid" }, { status: { $exists: false } }],
        },
      },

      // Group and calculate stats
      {
        $group: {
          _id: null,
          totalDistance: { $sum: "$distance" },
          totalActivities: { $sum: 1 },
          averagePaceWeighted: {
            $sum: {
              $cond: [
                { $gt: ["$distance", 0] },
                { $multiply: ["$pace", "$distance"] },
                0,
              ],
            },
          },
          totalDistanceForPace: { $sum: "$distance" },
          fastestPace: {
            $min: {
              $cond: [
                { $and: [{ $gt: ["$pace", 0] }, { $lt: ["$pace", 999] }] },
                "$pace",
                null,
              ],
            },
          },
          maxDistance: { $max: "$distance" },
          participantTracklogMap: {
            $addToSet: {
              userId: "$userId",
              date: {
                $dateToString: {
                  format: "%Y-%m-%d",
                  date: "$startDate",
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
              { $gt: ["$totalDistanceForPace", 0] },
              { $divide: ["$averagePaceWeighted", "$totalDistanceForPace"] },
              0,
            ],
          },
          totalTracklog: {
            $sum: {
              $map: {
                input: {
                  $setUnion: {
                    $map: {
                      input: "$participantTracklogMap",
                      as: "item",
                      in: "$$item.userId",
                    },
                  },
                },
                as: "userId",
                in: {
                  $size: {
                    $setUnion: {
                      $map: {
                        input: {
                          $filter: {
                            input: "$participantTracklogMap",
                            as: "item",
                            cond: { $eq: ["$$item.userId", "$$userId"] },
                          },
                        },
                        as: "userItem",
                        in: "$$userItem.date",
                      },
                    },
                  },
                },
              },
            },
          },
          fastestPace: { $ifNull: ["$fastestPace", 0] },
        },
      },
    ];

    const collection = (teamMemberActivityData as any).collection;
    if (!collection) {
      throw new Error("TeamMemberActivity collection not available");
    }
    const results = await collection.aggregate(pipeline).toArray();

    // If no activities, return zero stats but still include team info
    const stats = results[0] || {
      totalDistance: 0,
      averagePace: 0,
      totalTracklog: 0,
      fastestPace: 0,
      maxDistance: 0,
      totalActivities: 0,
    };

    return {
      teamId: teamId.toString(),
      teamName: team.name,
      totalDistance: Math.round(stats.totalDistance * 100) / 100,
      averagePace: Math.round(stats.averagePace * 100) / 100,
      totalTracklog: stats.totalTracklog,
      fastestPace: Math.round(stats.fastestPace * 100) / 100,
      maxDistance: Math.round(stats.maxDistance * 100) / 100,
      totalActivities: stats.totalActivities,
      memberCount: team.numberOfMember || 0,
    };
  }

  /**
   * Calculate team rankings across different metrics
   */
  private async calculateTeamRankings(
    contestId: ObjectId,
    teamId: ObjectId,
  ): Promise<{
    totalDistance: number;
    averagePace: number;
    totalTracklog: number;
  }> {
    const [distanceRank, paceRank, tracklogRank] = await Promise.all([
      this.getTeamRankForMetric(contestId, teamId, "totalDistance"),
      this.getTeamRankForMetric(contestId, teamId, "averagePace"),
      this.getTeamRankForMetric(contestId, teamId, "totalTracklog"),
    ]);

    return {
      totalDistance: distanceRank,
      averagePace: paceRank,
      totalTracklog: tracklogRank,
    };
  }

  /**
   * Get team rank for a specific metric
   */
  private async getTeamRankForMetric(
    contestId: ObjectId,
    teamId: ObjectId,
    metric: LeaderboardMetric,
  ): Promise<number> {
    const teams = await this.calculateTeamStats(contestId, metric, 1000); // Get all teams
    const teamIndex = teams.findIndex(
      (team) => team.teamId === teamId.toString(),
    );
    return teamIndex >= 0 ? teamIndex + 1 : 999;
  }

  /**
   * Invalidate cache when team activities change
   * TODO: Implement this when caching is added
   */
  async invalidateContestCache(
    contestId: ObjectId,
    teamId?: ObjectId,
  ): Promise<void> {
    // TODO: Implement cache invalidation later
    // try {
    //   const patterns = [
    //     `contest:${contestId}:leaderboard:*`,
    //     `contest:${contestId}:team:*:stats`
    //   ];
    //   if (teamId) {
    //     patterns.push(`contest:${contestId}:team:${teamId}:stats`);
    //   }
    //   for (const pattern of patterns) {
    //     await this.deleteCachePattern(pattern);
    //   }
    //   // Update last activity timestamp
    //   await redisService.set(`contest:${contestId}:last_activity`, Date.now().toString());
    // } catch (error) {
    //   console.error('Error invalidating contest cache:', error);
    //   // Don't throw - cache invalidation failure shouldn't break the main flow
    // }
  }

  // Helper methods

  private getSortField(metric: LeaderboardMetric): string {
    switch (metric) {
      case "totalDistance":
        return "totalDistance";
      case "averagePace":
        return "averagePace";
      case "totalTracklog":
        return "totalTracklog";
      default:
        return "totalDistance";
    }
  }

  private getBadge(rank: number): "gold" | "silver" | "bronze" | undefined {
    if (rank === 0) return "gold";
    if (rank === 1) return "silver";
    if (rank === 2) return "bronze";
    return undefined;
  }

  // TODO: Implement these cache methods when caching is added
  private async getCachedResult(key: string): Promise<any> {
    // TODO: Use appropriate redis service methods
    return null;
  }

  private async setCachedResult(
    key: string,
    data: any,
    ttl: number,
  ): Promise<void> {
    // TODO: Use appropriate redis service methods
  }

  private async deleteCachePattern(pattern: string): Promise<void> {
    // TODO: Use appropriate redis service methods
  }

  private async getFallbackLeaderboard(
    contestId: ObjectId,
    metric: string,
  ): Promise<TeamLeaderboardResponse> {
    try {
      // Try to get basic team list as fallback
      const teams = await teamData.findByContestId(contestId);

      return {
        contestId: contestId.toString(),
        metric,
        cachedAt: new Date().toISOString(),
        teams: teams.map((team, index) => ({
          teamId: team._id?.toString() || "",
          teamName: team.name,
          totalDistance: 0,
          averagePace: 0,
          totalTracklog: 0,
          fastestPace: 0,
          maxDistance: 0,
          totalActivities: 0,
          memberCount: team.numberOfMember || 0,
          rank: index + 1,
        })),
      };
    } catch (error) {
      console.error("Fallback leaderboard error:", error);
      return {
        contestId: contestId.toString(),
        metric,
        cachedAt: new Date().toISOString(),
        teams: [],
      };
    }
  }

  private async getFallbackIndividualStats(
    contestId: ObjectId,
    teamId: ObjectId,
  ): Promise<IndividualTeamStatsResponse> {
    try {
      const team = await teamData.findById(teamId);

      return {
        teamId: teamId.toString(),
        teamName: team?.name || "Unknown Team",
        contestId: contestId.toString(),
        stats: {
          totalDistance: 0,
          averagePace: 0,
          totalTracklog: 0,
          fastestPace: 0,
          maxDistance: 0,
          totalActivities: 0,
          memberCount: team?.numberOfMember || 0,
        },
        ranking: {
          totalDistance: 999,
          averagePace: 999,
          totalTracklog: 999,
        },
        cachedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Fallback individual stats error:", error);
      throw error;
    }
  }
}

export const teamStatsAggregationService = new TeamStatsAggregationService();
