import { ObjectId } from "mongodb";
import { TeamMemberActivity } from "../models/team-member-activity.model";
import { BaseData } from "./base.data";

class TeamMemberActivityData extends BaseData<TeamMemberActivity> {
  constructor() {
    super("TeamMemberActivities");
  }

  async create(
    activity: Omit<TeamMemberActivity, "_id" | "createdAt" | "updatedAt">,
  ): Promise<ObjectId> {
    this.ensureConnected();
    const result = await this.collection!.insertOne({
      ...activity,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return result.insertedId;
  }

  async findById(id: string | ObjectId): Promise<TeamMemberActivity | null> {
    this.ensureConnected();
    return this.collection!.findOne({ _id: new ObjectId(id) });
  }

  async findByUserId(userId: ObjectId): Promise<TeamMemberActivity[]> {
    this.ensureConnected();
    return this.collection!.find({ userId }).toArray();
  }

  async findByTeamId(teamId: ObjectId): Promise<TeamMemberActivity[]> {
    this.ensureConnected();
    return this.collection!.find({ teamId }).toArray();
  }

  async findByContestId(contestId: ObjectId): Promise<TeamMemberActivity[]> {
    this.ensureConnected();
    return this.collection!.find({ contestId }).toArray();
  }

  async findByTeamAndUser(
    teamId: ObjectId,
    userId: ObjectId,
  ): Promise<TeamMemberActivity[]> {
    this.ensureConnected();
    return this.collection!.find({ teamId, userId }).toArray();
  }

  async findByContestAndUser(
    contestId: ObjectId,
    userId: ObjectId,
  ): Promise<TeamMemberActivity[]> {
    this.ensureConnected();
    return this.collection!.find({ contestId, userId }).toArray();
  }

  async findByOriginalWorkoutId(
    workoutActivityId: string | ObjectId,
  ): Promise<TeamMemberActivity | null> {
    this.ensureConnected();
    return this.collection!.findOne({
      workoutActivityId: new ObjectId(workoutActivityId),
    });
  }

  async findByWorkoutAndTeamAndContest(
    workoutActivityId: ObjectId,
    teamId: ObjectId,
    contestId: ObjectId,
  ): Promise<TeamMemberActivity | null> {
    this.ensureConnected();
    return this.collection!.findOne({
      workoutActivityId,
      teamId,
      contestId,
    });
  }

  async update(
    id: ObjectId,
    update: Partial<TeamMemberActivity>,
  ): Promise<boolean> {
    this.ensureConnected();
    const result = await this.collection!.updateOne(
      { _id: id },
      { $set: { ...update, updatedAt: new Date() } },
    );
    return result.modifiedCount === 1;
  }

  async delete(id: ObjectId): Promise<boolean> {
    this.ensureConnected();
    const result = await this.collection!.deleteOne({ _id: id });
    return result.deletedCount === 1;
  }

  async deleteByTeamId(teamId: ObjectId): Promise<number> {
    this.ensureConnected();
    const result = await this.collection!.deleteMany({ teamId });
    return result.deletedCount || 0;
  }

  async deleteByContestId(contestId: ObjectId): Promise<number> {
    this.ensureConnected();
    const result = await this.collection!.deleteMany({ contestId });
    return result.deletedCount || 0;
  }

  async deleteByUserAndTeam(
    userId: ObjectId,
    teamId: ObjectId,
  ): Promise<number> {
    this.ensureConnected();
    const result = await this.collection!.deleteMany({ userId, teamId });
    return result.deletedCount || 0;
  }

  async deleteByWorkoutActivityId(
    workoutActivityId: ObjectId,
  ): Promise<number> {
    this.ensureConnected();
    const result = await this.collection!.deleteMany({ workoutActivityId });
    return result.deletedCount || 0;
  }

  // Helper: Check if activity is valid (not rejected)
  private isValidActivity(activity: TeamMemberActivity): boolean {
    return activity.status !== "rejected";
  }

  // Reject an activity (mark as rejected for fraud)
  async rejectActivity(
    activityId: string | ObjectId,
    adminId: string | ObjectId,
    reason: string,
  ): Promise<boolean> {
    this.ensureConnected();
    const result = await this.collection!.updateOne(
      { _id: new ObjectId(activityId) },
      {
        $set: {
          status: "rejected",
          rejectedAt: new Date(),
          rejectedBy: new ObjectId(adminId),
          rejectionReason: reason,
          updatedAt: new Date(),
        },
      },
    );
    return result.modifiedCount === 1;
  }

  // Restore a rejected activity (mark as valid again)
  async restoreActivity(activityId: string | ObjectId): Promise<boolean> {
    this.ensureConnected();
    const result = await this.collection!.updateOne(
      { _id: new ObjectId(activityId) },
      {
        $set: {
          status: "valid",
          updatedAt: new Date(),
        },
        $unset: {
          rejectedAt: "",
          rejectedBy: "",
          rejectionReason: "",
        },
      },
    );
    return result.modifiedCount === 1;
  }

  // Find only valid (non-rejected) activities for a team
  async findValidByTeamId(teamId: ObjectId): Promise<TeamMemberActivity[]> {
    this.ensureConnected();
    return this.collection!.find({
      teamId,
      $or: [
        { status: "valid" },
        { status: { $exists: false } }, // Backward compatible with old data
      ],
    }).toArray();
  }

  // Find only valid (non-rejected) activities for a contest
  async findValidByContestId(
    contestId: ObjectId,
  ): Promise<TeamMemberActivity[]> {
    this.ensureConnected();
    return this.collection!.find({
      contestId,
      $or: [{ status: "valid" }, { status: { $exists: false } }],
    }).toArray();
  }

  // Find rejected activities for a contest
  async findRejectedByContestId(
    contestId: ObjectId,
  ): Promise<TeamMemberActivity[]> {
    this.ensureConnected();
    return this.collection!.find({
      contestId,
      status: "rejected",
    }).toArray();
  }

  // Find rejected activities for a team
  async findRejectedByTeamId(teamId: ObjectId): Promise<TeamMemberActivity[]> {
    this.ensureConnected();
    return this.collection!.find({
      teamId,
      status: "rejected",
    }).toArray();
  }

  // Aggregate methods for team statistics (only valid activities)
  async getTeamStats(teamId: ObjectId): Promise<{
    totalDistance: number;
    totalTracklog: number;
    averagePace: number;
    fastestPace: number;
    maxDistance: number;
  }> {
    this.ensureConnected();

    // Find only VALID activities for this team
    const activities = await this.findValidByTeamId(teamId);

    if (activities.length === 0) {
      return {
        totalDistance: 0,
        totalTracklog: 0,
        averagePace: 0,
        fastestPace: 0,
        maxDistance: 0,
      };
    }

    // Calculate stats
    const totalDistance = activities.reduce(
      (sum, activity) => sum + activity.distance,
      0,
    );
    const totalTracklog = new Set(
      activities.map((a) => a.startDate.toISOString().split("T")[0]),
    ).size;

    // Calculate weighted average pace (weighted by distance) - only for activities with pace data
    const activitiesWithPace = activities.filter((a) => a.pace !== null);
    const weightedPaceSum = activitiesWithPace.reduce(
      (sum, activity) => sum + activity.pace! * activity.distance,
      0,
    );
    const totalDistanceWithPace = activitiesWithPace.reduce(
      (sum, a) => sum + a.distance,
      0,
    );
    const averagePace =
      totalDistanceWithPace > 0 ? weightedPaceSum / totalDistanceWithPace : 0;

    // Get fastest pace and max distance - filter out invalid paces
    const validPaces = activities
      .map((a) => a.pace)
      .filter(
        (pace) => pace !== null && pace! > 0 && isFinite(pace!),
      ) as number[];
    const fastestPace = validPaces.length > 0 ? Math.min(...validPaces) : 0;
    const maxDistance = Math.max(...activities.map((a) => a.distance || 0));

    return {
      totalDistance: Math.round(totalDistance * 100) / 100, // Round to 2 decimal places
      totalTracklog,
      averagePace: Math.round(averagePace * 100) / 100, // Round to 2 decimal places
      fastestPace: Math.round(fastestPace * 100) / 100, // Round to 2 decimal places
      maxDistance: Math.round(maxDistance * 100) / 100, // Round to 2 decimal places
    };
  }
}

export const teamMemberActivityData = new TeamMemberActivityData();
