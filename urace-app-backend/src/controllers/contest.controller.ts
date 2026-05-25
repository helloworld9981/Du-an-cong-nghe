import { Request, Response } from "express";
import { ObjectId } from "mongodb";
import { ContestService } from "../services/contest.service";
import { AuthRequest } from "../middleware/auth.middleware";
import { Contest } from "../models/contest.model";
import { Team } from "../models/team.model";
import { contestData } from "../data/contest.data";
import { groupAuthService } from "../services/group-authorization.service";
import { workoutActivityData } from "../data/workout-activity.data";

const contestService = new ContestService();

export const createContest = async (
  req: AuthRequest,
  res: Response
): Promise<any> => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "User authentication required" });
    }

    const userId = req.user._id.toString();
    const groupId = req.body.groupId;

    // Check if user can create contests in this group (must be admin)
    const canCreate = await groupAuthService.canCreateContest(groupId, userId);
    if (!canCreate) {
      return res.status(403).json({
        message: "Access denied. Only group admins can create contests.",
      });
    }

    const contestData: Omit<Contest, "_id" | "createdAt" | "updatedAt"> = {
      ...req.body,
      createdBy: req.user._id,
    };
    const contest = await contestService.createContest(contestData);
    res.status(201).json(contest);
  } catch (error) {
    console.error("Create contest error:", error);
    res
      .status(500)
      .json({ message: "Internal server error during contest creation" });
  }
};

export const getContest = async (
  req: AuthRequest,
  res: Response
): Promise<any> => {
  try {
    const contestId = new ObjectId(req.params.id);
    const contest = await contestService.getContest(contestId);

    if (!contest) {
      return res.status(404).json({ message: "Contest not found" });
    }

    res.json(contest);
  } catch (error) {
    console.error("Get contest error:", error);
    res
      .status(500)
      .json({ message: "Internal server error while fetching contest" });
  }
};

export const updateContest = async (
  req: AuthRequest,
  res: Response
): Promise<any> => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "User authentication required" });
    }

    const contestId = new ObjectId(req.params.id);
    const userId = req.user._id.toString();
    const updateData: Partial<Contest> = req.body;

    // Check if user can manage this contest (must be group admin)
    const canManage = await groupAuthService.canManageContest(
      contestId.toString(),
      userId
    );
    if (!canManage) {
      return res.status(403).json({
        message: "Access denied. Only group admins can update contests.",
      });
    }

    const updatedContest = await contestService.updateContest(
      contestId,
      updateData
    );

    if (!updatedContest) {
      return res
        .status(404)
        .json({ message: "Contest not found or update failed" });
    }

    res.json(updatedContest);
  } catch (error) {
    console.error("Update contest error:", error);
    res
      .status(500)
      .json({ message: "Internal server error during contest update" });
  }
};

export const deleteContest = async (
  req: AuthRequest,
  res: Response
): Promise<any> => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "User authentication required" });
    }

    const contestId = new ObjectId(req.params.id);
    const userId = req.user._id.toString();

    // Check if user can manage this contest (must be group admin)
    const canManage = await groupAuthService.canManageContest(
      contestId.toString(),
      userId
    );
    if (!canManage) {
      return res.status(403).json({
        message: "Access denied. Only group admins can delete contests.",
      });
    }

    const success = await contestService.deleteContest(contestId);

    if (!success) {
      return res
        .status(404)
        .json({ message: "Contest not found or delete failed" });
    }

    res.status(204).send();
  } catch (error) {
    console.error("Delete contest error:", error);
    res
      .status(500)
      .json({ message: "Internal server error during contest deletion" });
  }
};

export const createTeam = async (
  req: AuthRequest,
  res: Response
): Promise<any> => {
  try {
    const contestId = new ObjectId(req.params.contestId);
    const teamData: Omit<
      Team,
      "_id" | "contestId" | "createdAt" | "updatedAt"
    > = req.body;

    const team = await contestService.createTeam(contestId, teamData);
    res.status(201).json(team);
  } catch (error) {
    console.error("Create team error:", error);
    res
      .status(500)
      .json({ message: "Internal server error during team creation" });
  }
};

export const addMemberToTeam = async (
  req: AuthRequest,
  res: Response
): Promise<any> => {
  try {
    const teamId = new ObjectId(req.params.teamId);
    const userId = new ObjectId(req.body.userId);

    const success = await contestService.addMemberToTeam(teamId, userId);

    if (!success) {
      return res.status(400).json({ message: "Failed to add member to team" });
    }

    res.status(200).json({ message: "Member added successfully" });
  } catch (error) {
    console.error("Add member error:", error);
    res
      .status(500)
      .json({ message: "Internal server error while adding team member" });
  }
};

export const addMultipleMembersToTeam = async (
  req: AuthRequest,
  res: Response
): Promise<any> => {
  try {
    const teamId = new ObjectId(req.params.teamId);
    const { userIds } = req.body;

    // Validate input
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res
        .status(400)
        .json({ message: "userIds must be a non-empty array" });
    }

    // Convert string IDs to ObjectIds
    const objectIdUserIds = userIds.map((id) => {
      try {
        return new ObjectId(id);
      } catch (error) {
        throw new Error(`Invalid user ID format: ${id}`);
      }
    });

    const result = await contestService.addMultipleMembersToTeam(
      teamId,
      objectIdUserIds
    );

    res.status(200).json({
      message: `Added ${result.successful.length} members successfully`,
      successful: result.successful,
      failed: result.failed,
      summary: {
        total: userIds.length,
        successful: result.successful.length,
        failed: result.failed.length,
      },
    });
  } catch (error) {
    console.error("Add multiple members error:", error);
    if (error instanceof Error && error.message.includes("Invalid user ID")) {
      res.status(400).json({ message: error.message });
    } else {
      res
        .status(500)
        .json({ message: "Internal server error while adding team members" });
    }
  }
};

export const removeMemberFromTeam = async (
  req: AuthRequest,
  res: Response
): Promise<any> => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "User authentication required" });
    }

    const teamId = new ObjectId(req.params.teamId);
    const userId = new ObjectId(req.params.userId);
    const requestingUserId = req.user._id.toString();

    // Get team to find the contest it belongs to
    const { teamData } = await import("../data/team.data");
    const team = await teamData.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    // Check if user can manage this contest (must be group admin)
    const canManage = await groupAuthService.canManageContest(
      team.contestId.toString(),
      requestingUserId
    );
    if (!canManage) {
      return res.status(403).json({
        message: "Access denied. Only group admins can remove team members.",
      });
    }

    const success = await contestService.removeMemberFromTeam(teamId, userId);

    if (!success) {
      return res
        .status(400)
        .json({ message: "Failed to remove member from team" });
    }

    res.status(200).json({ message: "Member removed successfully" });
  } catch (error) {
    console.error("Remove member error:", error);
    res
      .status(500)
      .json({ message: "Internal server error while removing team member" });
  }
};

export const getTeamsForContest = async (
  req: AuthRequest,
  res: Response
): Promise<any> => {
  try {
    const contestId = new ObjectId(req.params.id);
    const teams = await contestService.getTeamsForContest(contestId);

    res.json(teams);
  } catch (error) {
    console.error("Get teams for contest error:", error);
    res.status(500).json({
      message: "Internal server error while fetching teams for contest",
    });
  }
};

export const getUserTeams = async (
  req: AuthRequest,
  res: Response
): Promise<any> => {
  try {
    // Get the user ID from the route params or authenticated user
    let userId: ObjectId;

    if (req.params.userId) {
      userId = new ObjectId(req.params.userId);
    } else if (req.user?._id) {
      userId =
        typeof req.user._id === "string"
          ? new ObjectId(req.user._id)
          : (req.user._id as ObjectId);
    } else if (req.user?.userId) {
      userId =
        typeof req.user.userId === "string"
          ? new ObjectId(req.user.userId)
          : (req.user.userId as ObjectId);
    } else {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Get the teams using the Redis-backed getUserTeams method
    const teams = await contestService.getUserTeams(userId);

    res.json(teams);
  } catch (error) {
    console.error("Get user teams error:", error);
    res
      .status(500)
      .json({ message: "Internal server error while fetching user teams" });
  }
};

export const getContestsForGroup = async (
  req: AuthRequest,
  res: Response
): Promise<any> => {
  try {
    const groupId = req.params.id;
    const contests = await contestData.findByGroupId(groupId);
    res.json(contests);
  } catch (error) {
    console.error("Get contests for group error:", error);
    res.status(500).json({
      message: "Internal server error while fetching contests for group",
    });
  }
};

export const getIndividualContestLeaderboard = async (
  req: AuthRequest,
  res: Response
): Promise<any> => {
  try {
    const contestId = new ObjectId(req.params.id);
    const leaderboard = await contestService.getIndividualContestLeaderboard(
      contestId
    );
    res.json(leaderboard);
  } catch (error) {
    console.error("Get individual contest leaderboard error:", error);
    if (
      error instanceof Error &&
      error.message.includes("not an individual contest")
    ) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({
        message:
          "Internal server error while fetching individual contest leaderboard",
      });
    }
  }
};

export const getIndividualContestActivities = async (
  req: AuthRequest,
  res: Response
): Promise<any> => {
  try {
    const contestId = new ObjectId(req.params.id);
    const userId = new ObjectId(req.params.userId);

    const activities = await contestService.getIndividualContestActivities(
      contestId,
      userId
    );
    res.json(activities);
  } catch (error) {
    console.error("Get individual contest activities error:", error);
    res.status(500).json({
      message:
        "Internal server error while fetching individual contest activities",
    });
  }
};

export const addParticipantToContest = async (
  req: AuthRequest,
  res: Response
): Promise<any> => {
  try {
    const contestId = new ObjectId(req.params.contestId);
    const participantId = new ObjectId(req.body.participantId);

    const success = await contestService.addParticipantToContest(
      contestId,
      participantId
    );

    if (!success) {
      return res
        .status(400)
        .json({ message: "Failed to add participant to contest" });
    }

    res.status(200).json({ message: "Participant added successfully" });
  } catch (error) {
    console.error("Add participant to contest error:", error);
    if (
      error instanceof Error &&
      (error.message.includes("Contest not found") ||
        error.message.includes("already added") ||
        error.message.includes("after contest has started") ||
        error.message.includes("individual contests"))
    ) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({
        message: "Internal server error while adding participant to contest",
      });
    }
  }
};

export const addMultipleParticipantsToContest = async (
  req: AuthRequest,
  res: Response
): Promise<any> => {
  try {
    const contestId = new ObjectId(req.params.contestId);
    const { participantIds } = req.body;

    // Validate input
    if (!Array.isArray(participantIds) || participantIds.length === 0) {
      return res
        .status(400)
        .json({ message: "participantIds must be a non-empty array" });
    }

    // Convert string IDs to ObjectIds
    const objectIdParticipantIds = participantIds.map((id) => {
      try {
        return new ObjectId(id);
      } catch (error) {
        throw new Error(`Invalid participant ID format: ${id}`);
      }
    });

    const result = await contestService.addMultipleParticipantsToContest(
      contestId,
      objectIdParticipantIds
    );

    res.status(200).json({
      message: `Added ${result.successful.length} participants successfully`,
      successful: result.successful,
      failed: result.failed,
      summary: {
        total: participantIds.length,
        successful: result.successful.length,
        failed: result.failed.length,
      },
    });
  } catch (error) {
    console.error("Add multiple participants error:", error);
    if (
      error instanceof Error &&
      error.message.includes("Invalid participant ID")
    ) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({
        message:
          "Internal server error while adding multiple participants to contest",
      });
    }
  }
};

export const removeParticipantFromContest = async (
  req: AuthRequest,
  res: Response
): Promise<any> => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "User authentication required" });
    }

    const contestId = new ObjectId(req.params.contestId);
    const participantId = new ObjectId(req.params.participantId);
    const requestingUserId = req.user._id.toString();

    // Check if user can manage this contest (must be group admin)
    const canManage = await groupAuthService.canManageContest(
      contestId.toString(),
      requestingUserId
    );
    if (!canManage) {
      return res.status(403).json({
        message:
          "Access denied. Only group admins can remove participants from contests.",
      });
    }

    const success = await contestService.removeParticipantFromContest(
      contestId,
      participantId
    );

    if (!success) {
      return res
        .status(400)
        .json({ message: "Failed to remove participant from contest" });
    }

    res.status(200).json({ message: "Participant removed successfully" });
  } catch (error) {
    console.error("Remove participant from contest error:", error);
    if (
      error instanceof Error &&
      (error.message.includes("Contest not found") ||
        error.message.includes("after contest has started") ||
        error.message.includes("individual contests"))
    ) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({
        message:
          "Internal server error while removing participant from contest",
      });
    }
  }
};

export const getContestParticipants = async (
  req: AuthRequest,
  res: Response
): Promise<any> => {
  try {
    const contestId = new ObjectId(req.params.id);
    const participants = await contestService.getContestParticipants(contestId);
    res.json(participants);
  } catch (error) {
    console.error("Get contest participants error:", error);
    if (
      error instanceof Error &&
      error.message.includes("not an individual contest")
    ) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({
        message: "Internal server error while fetching contest participants",
      });
    }
  }
};

export const getAvailableContestParticipants = async (
  req: AuthRequest,
  res: Response
): Promise<any> => {
  try {
    const contestId = new ObjectId(req.params.contestId);
    const availableMembers =
      await contestService.getAvailableGroupMembersForContest(contestId);
    res.json(availableMembers);
  } catch (error) {
    console.error("Get available contest participants error:", error);
    if (
      error instanceof Error &&
      error.message.includes("not an individual contest")
    ) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({
        message:
          "Internal server error while fetching available contest participants",
      });
    }
  }
};

export const getContestTeamLeaderboard = async (
  req: AuthRequest,
  res: Response
): Promise<any> => {
  try {
    const contestId = new ObjectId(req.params.id);
    const metric = (req.query.metric as string) || "totalDistance";
    const limit = parseInt(req.query.limit as string) || 50;

    // Validate metric
    if (!["totalDistance", "averagePace", "totalTracklog"].includes(metric)) {
      return res.status(400).json({
        message:
          "Invalid metric. Use totalDistance, averagePace, or totalTracklog",
      });
    }

    // Validate limit
    if (limit < 1 || limit > 1000) {
      return res
        .status(400)
        .json({ message: "Limit must be between 1 and 1000" });
    }

    const { teamStatsAggregationService } = await import(
      "../services/team-stats-aggregation.service"
    );
    const leaderboard =
      await teamStatsAggregationService.getContestTeamLeaderboard(
        contestId,
        metric as any,
        limit
      );

    res.json(leaderboard);
  } catch (error) {
    console.error("Get contest team leaderboard error:", error);
    res.status(500).json({
      message: "Internal server error while fetching contest team leaderboard",
    });
  }
};

export const getTeamStats = async (
  req: AuthRequest,
  res: Response
): Promise<any> => {
  try {
    const teamId = new ObjectId(req.params.teamId);

    // Get the team to find its contest
    const { teamData } = await import("../data/team.data");
    const team = await teamData.findById(teamId);

    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    const { teamStatsAggregationService } = await import(
      "../services/team-stats-aggregation.service"
    );
    const teamStats = await teamStatsAggregationService.getIndividualTeamStats(
      team.contestId,
      teamId
    );

    res.json(teamStats);
  } catch (error) {
    console.error("Get team stats error:", error);
    res
      .status(500)
      .json({ message: "Internal server error while fetching team stats" });
  }
};

export const getAllContests = async (
  req: AuthRequest,
  res: Response
): Promise<any> => {
  try {
    // Get user ID from authenticated request
    let userId: string;

    if (req.user?._id) {
      userId =
        typeof req.user._id === "string"
          ? req.user._id
          : req.user._id.toString();
    } else if (req.user?.userId) {
      userId =
        typeof req.user.userId === "string"
          ? req.user.userId
          : req.user.userId.toString();
    } else {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Get user's groups
    const { groupMemberData } = await import("../data/group-member.data");
    const userGroups = await groupMemberData.findByUserId(userId);
    const userGroupIds = userGroups.map((membership) => membership.groupId);

    // Get all contests and filter by user's groups
    const allContests = await contestData.getAll();
    const userContests = allContests.filter((contest) =>
      userGroupIds.includes(contest.groupId.toString())
    );

    res.json(userContests);
  } catch (error) {
    console.error("Get all contests error:", error);
    res
      .status(500)
      .json({ message: "Internal server error while fetching all contests" });
  }
};

export const getContestTeamStats = async (
  req: AuthRequest,
  res: Response
): Promise<any> => {
  try {
    const contestId = new ObjectId(req.params.contestId);
    const teamId = new ObjectId(req.params.teamId);

    // Verify contest exists
    const contest = await contestData.findById(contestId);
    if (!contest) {
      return res.status(404).json({ message: "Contest not found" });
    }

    // Verify team exists and belongs to this contest
    const { teamData } = await import("../data/team.data");
    const team = await teamData.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    if (team.contestId.toString() !== contestId.toString()) {
      return res
        .status(400)
        .json({ message: "Team does not belong to the specified contest" });
    }

    const { teamStatsAggregationService } = await import(
      "../services/team-stats-aggregation.service"
    );
    const teamStats = await teamStatsAggregationService.getIndividualTeamStats(
      contestId,
      teamId
    );

    res.json(teamStats);
  } catch (error) {
    console.error("Get contest team stats error:", error);
    res.status(500).json({
      message: "Internal server error while fetching contest team stats",
    });
  }
};

export const syncActivityData = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    // Validate request body
    const { activities } = req.body;
    if (!Array.isArray(activities) || activities.length === 0) {
      return res.status(400).json({
        message:
          "activities must be a non-empty array of {userId, workoutActivityId} objects",
      });
    }

    // Validate each activity item
    for (const activity of activities) {
      if (!activity.userId || !activity.workoutActivityId) {
        return res.status(400).json({
          message:
            "Each activity must have userId and workoutActivityId fields",
        });
      }

      // Validate ObjectId format
      try {
        new ObjectId(activity.userId);
        new ObjectId(activity.workoutActivityId);
      } catch (error) {
        return res.status(400).json({
          message:
            "Invalid userId or workoutActivityId format. Must be valid ObjectId strings.",
        });
      }
    }

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    // Process each activity
    for (const activity of activities) {
      try {
        const userId = new ObjectId(activity.userId);
        const workoutActivityId = new ObjectId(activity.workoutActivityId);

        // Get the workout activity
        const workoutActivity = await workoutActivityData.findById(
          workoutActivityId
        );
        if (!workoutActivity) {
          results.push({
            userId: activity.userId,
            workoutActivityId: activity.workoutActivityId,
            success: false,
            error: "Workout activity not found",
          });
          errorCount++;
          continue;
        }

        // Process team member activities
        await contestService.processTeamMemberActivities(
          userId,
          workoutActivity
        );

        // Process individual contest activities
        await contestService.processIndividualContestActivities(
          userId,
          workoutActivity
        );

        results.push({
          userId: activity.userId,
          workoutActivityId: activity.workoutActivityId,
          success: true,
          message: "Activity data synced successfully",
        });
        successCount++;
      } catch (error) {
        console.error(
          `Error processing activity ${activity.workoutActivityId} for user ${activity.userId}:`,
          error
        );
        results.push({
          userId: activity.userId,
          workoutActivityId: activity.workoutActivityId,
          success: false,
          error:
            error instanceof Error ? error.message : "Unknown error occurred",
        });
        errorCount++;
      }
    }

    res.json({
      message: "Batch activity sync completed",
      summary: {
        total: activities.length,
        successful: successCount,
        failed: errorCount,
      },
      results,
    });
  } catch (error) {
    console.error("Sync activity data error:", error);
    res
      .status(500)
      .json({ message: "Internal server error while syncing activity data" });
  }
};

export const getTeamMemberLeaderboard = async (
  req: AuthRequest,
  res: Response
): Promise<any> => {
  try {
    const contestId = new ObjectId(req.params.id);
    const teamId = req.query.teamId
      ? new ObjectId(req.query.teamId as string)
      : undefined;
    const limit = parseInt(req.query.limit as string) || 100;

    // Validate limit
    if (limit < 1 || limit > 1000) {
      return res
        .status(400)
        .json({ message: "Limit must be between 1 and 1000" });
    }

    // Verify contest exists and is a team contest
    const contest = await contestData.findById(contestId);
    if (!contest) {
      return res.status(404).json({ message: "Contest not found" });
    }

    if (contest.contestType !== "Team") {
      return res
        .status(400)
        .json({ message: "This endpoint is only for team contests" });
    }

    const { teamMemberLeaderboardService } = await import(
      "../services/team-member-leaderboard.service"
    );
    const leaderboard =
      await teamMemberLeaderboardService.getTeamMemberLeaderboard(
        contestId,
        teamId,
        limit
      );

    res.json(leaderboard);
  } catch (error) {
    console.error("Get team member leaderboard error:", error);
    res.status(500).json({
      message: "Internal server error while fetching team member leaderboard",
    });
  }
};

export const getTeamMemberActivities = async (
  req: AuthRequest,
  res: Response
): Promise<any> => {
  try {
    const contestId = new ObjectId(req.params.contestId);
    const userId = new ObjectId(req.params.userId);

    // Verify contest exists
    const contest = await contestData.findById(contestId);
    if (!contest) {
      return res.status(404).json({ message: "Contest not found" });
    }

    if (contest.contestType !== "Team") {
      return res
        .status(400)
        .json({ message: "This endpoint is only for team contests" });
    }

    const { teamMemberLeaderboardService } = await import(
      "../services/team-member-leaderboard.service"
    );
    const activities =
      await teamMemberLeaderboardService.getTeamMemberActivities(
        contestId,
        userId
      );

    res.json(activities);
  } catch (error) {
    console.error("Get team member activities error:", error);
    res.status(500).json({
      message: "Internal server error while fetching team member activities",
    });
  }
};

export const getTeamContestActivities = async (
  req: AuthRequest,
  res: Response
): Promise<any> => {
  try {
    const contestId = new ObjectId(req.params.contestId);
    const teamId = new ObjectId(req.params.teamId);
    const userIdStr = req.query.userId as string;
    const userId = userIdStr ? new ObjectId(userIdStr) : undefined;

    const activities = await contestService.getTeamContestActivities(
      contestId,
      teamId,
      userId
    );
    res.json(activities);
  } catch (error) {
    console.error("Get team contest activities error:", error);
    if (
      error instanceof Error &&
      (error.message.includes("not found") ||
        error.message.includes("not a team contest") ||
        error.message.includes("does not belong"))
    ) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({
        message: "Internal server error while fetching team contest activities",
      });
    }
  }
};
