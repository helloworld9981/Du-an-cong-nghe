import { ObjectId } from "mongodb";
import {
  ContestProgressReminder,
  MilestoneType,
} from "../models/contest-progress-reminder.model";
import { BaseData } from "./base.data";

class ContestProgressReminderData extends BaseData<ContestProgressReminder> {
  constructor() {
    super("ContestProgressReminders");
  }

  async hasReminderBeenSent(
    contestId: ObjectId,
    userId: ObjectId,
    milestone: MilestoneType,
  ): Promise<boolean> {
    this.ensureConnected();
    const reminder = await this.collection!.findOne({
      contestId,
      userId,
      milestone,
    });
    return reminder !== null;
  }

  async hasCompletionNotificationBeenSent(
    contestId: ObjectId,
    userId: ObjectId,
  ): Promise<boolean> {
    this.ensureConnected();
    const reminder = await this.collection!.findOne({
      contestId,
      userId,
      isCompletionNotification: true,
    });
    return reminder !== null;
  }

  async create(
    reminder: Omit<ContestProgressReminder, "_id" | "createdAt">,
  ): Promise<ObjectId> {
    this.ensureConnected();
    const result = await this.collection!.insertOne({
      ...reminder,
      createdAt: new Date(),
    } as ContestProgressReminder);
    return result.insertedId;
  }

  async findByContestId(
    contestId: ObjectId,
  ): Promise<ContestProgressReminder[]> {
    this.ensureConnected();
    return this.collection!.find({ contestId }).toArray();
  }

  async findByContestAndUser(
    contestId: ObjectId,
    userId: ObjectId,
  ): Promise<ContestProgressReminder[]> {
    this.ensureConnected();
    return this.collection!.find({ contestId, userId }).toArray();
  }

  async deleteByContestId(contestId: ObjectId): Promise<number> {
    this.ensureConnected();
    const result = await this.collection!.deleteMany({ contestId });
    return result.deletedCount || 0;
  }

  async findById(id: ObjectId): Promise<ContestProgressReminder | null> {
    this.ensureConnected();
    return this.collection!.findOne({ _id: id });
  }
}

export const contestProgressReminderData = new ContestProgressReminderData();
