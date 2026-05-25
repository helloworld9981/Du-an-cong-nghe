import { ObjectId } from "mongodb";
import { TeamMemberActivity } from "../models/team-member-activity.model";
import { WorkoutActivity } from "../models/workout-activity.model";
import { teamMemberActivityData } from "../data/team-member-activity.data";
import { teamData } from "../data/team.data";
import { contestData } from "../data/contest.data";

export class TeamMemberActivityService {
  /**
   * Create a team member activity record by copying workout data
   */
  async createFromWorkout(
    workoutActivity: WorkoutActivity,
    teamId: ObjectId,
    contestId: ObjectId,
  ): Promise<TeamMemberActivity | null> {
    // Check if this workout is already registered for this specific team and contest
    const existingActivity =
      await teamMemberActivityData.findByWorkoutAndTeamAndContest(
        workoutActivity._id as ObjectId,
        teamId,
        contestId,
      );

    if (existingActivity) {
      throw Error("Activity already exists for this specific team and contest");
    }

    // Create team member activity
    const newActivity: Omit<
      TeamMemberActivity,
      "_id" | "createdAt" | "updatedAt"
    > = {
      userId: workoutActivity.userId,
      teamId,
      contestId,
      stravaUserId: workoutActivity.stravaUserId ?? 0,
      distance: workoutActivity.distance,
      movingTime: workoutActivity.movingTime,
      workoutType: workoutActivity.workoutType,
      pace: workoutActivity.pace,
      startDate: workoutActivity.startDate,
      workoutActivityId: workoutActivity._id as ObjectId,
      stravaActivityId: workoutActivity.stravaActivityId,
      recordType: workoutActivity.recordType,
    };

    const activityId = await teamMemberActivityData.create(newActivity);
    const createdActivity = await teamMemberActivityData.findById(activityId);

    return createdActivity;
  }

  /**
   * Get all activities for a team
   */
  async getTeamActivities(teamId: ObjectId): Promise<TeamMemberActivity[]> {
    return teamMemberActivityData.findByTeamId(teamId);
  }

  /**
   * Get all activities for a contest
   */
  async getContestActivities(
    contestId: ObjectId,
  ): Promise<TeamMemberActivity[]> {
    return teamMemberActivityData.findByContestId(contestId);
  }

  /**
   * Get user activities for a team
   */
  async getUserTeamActivities(
    userId: ObjectId,
    teamId: ObjectId,
  ): Promise<TeamMemberActivity[]> {
    return teamMemberActivityData.findByTeamAndUser(teamId, userId);
  }

  /**
   * Delete an activity
   */
  async deleteActivity(activityId: ObjectId): Promise<boolean> {
    const activity = await teamMemberActivityData.findById(activityId);
    if (!activity) {
      return false;
    }

    const success = await teamMemberActivityData.delete(activityId);

    return success;
  }

  /**
   * Delete all activities for a contest
   */
  async deleteByContestId(contestId: ObjectId): Promise<number> {
    return teamMemberActivityData.deleteByContestId(contestId);
  }
}

export const teamMemberActivityService = new TeamMemberActivityService();
