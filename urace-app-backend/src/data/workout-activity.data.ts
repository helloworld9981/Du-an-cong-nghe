import { ObjectId } from "mongodb";
import { WorkoutActivity } from "../models/workout-activity.model";
import { BaseData } from "./base.data";

class WorkoutActivityData extends BaseData<WorkoutActivity> {
  constructor() {
    super("WorkoutActivities");
  }

  async create(
    activity: Omit<WorkoutActivity, "_id" | "createdAt" | "updatedAt">
  ): Promise<ObjectId> {
    this.ensureConnected();
    const result = await this.collection!.insertOne({
      ...activity,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return result.insertedId;
  }

  async findById(id: ObjectId): Promise<WorkoutActivity | null> {
    this.ensureConnected();
    return this.collection!.findOne({ _id: id });
  }

  async findByUserId(userId: ObjectId): Promise<WorkoutActivity[]> {
    this.ensureConnected();
    return this.collection!.find({ userId }).toArray();
  }

  async update(id: ObjectId, update: Partial<WorkoutActivity>): Promise<boolean> {
    this.ensureConnected();
    const result = await this.collection!.updateOne(
      { _id: id },
      { $set: { ...update, updatedAt: new Date() } }
    );
    return result.modifiedCount === 1;
  }

  async delete(id: ObjectId): Promise<boolean> {
    this.ensureConnected();
    const result = await this.collection!.deleteOne({ _id: id });
    return result.deletedCount === 1;
  }

  async findByUserIdAndDateRange(
    userId: ObjectId,
    startDate: Date,
    endDate: Date
  ): Promise<WorkoutActivity[]> {
    this.ensureConnected();
    return this.collection!.find({
      userId,
      startDate: {
        $gte: startDate,
        $lte: endDate
      }
    }).toArray();
  }

  async findByStravaActivityId(stravaActivityId: number): Promise<WorkoutActivity | null> {
    this.ensureConnected();
    return this.collection!.findOne({ stravaActivityId });
  }

  async updateByStravaActivityId(stravaActivityId: number, update: Partial<WorkoutActivity>): Promise<boolean> {
    this.ensureConnected();
    const result = await this.collection!.updateOne(
      { stravaActivityId },
      { $set: { ...update, updatedAt: new Date() } }
    );
    return result.modifiedCount === 1;
  }

  async deleteByStravaActivityId(stravaActivityId: number): Promise<boolean> {
    this.ensureConnected();
    const result = await this.collection!.deleteOne({ stravaActivityId });
    return result.deletedCount === 1;
  }

  async existsByStravaActivityId(stravaActivityId: number): Promise<boolean> {
    this.ensureConnected();
    const count = await this.collection!.countDocuments({ stravaActivityId });
    return count > 0;
  }
  //Health Connect
  async findHealthConnectActivityByDate(
  userId: ObjectId,
  syncDate: string
): Promise<WorkoutActivity | null> {
  this.ensureConnected();

  return this.collection!.findOne({
  userId,
  recordType: "HealthConnect",
} as any);
}

async updateById(
  id: ObjectId,
  update: Partial<WorkoutActivity>
): Promise<boolean> {
  return this.update(id, update);
}

  // Alias for the existing method for consistency with service
  async findByUserAndDateRange(
    userId: ObjectId,
    startDate: Date,
    endDate: Date
  ): Promise<WorkoutActivity[]> {
    return this.findByUserIdAndDateRange(userId, startDate, endDate);
  }
}

export const workoutActivityData = new WorkoutActivityData();