import { ObjectId } from "mongodb";

export type MilestoneType = number;
export type ProgressStatus = "behind" | "on_track" | "completed";

export interface ContestProgressReminder {
  _id?: ObjectId;
  contestId: ObjectId;
  userId: ObjectId;
  milestone: number;
  status: ProgressStatus;
  progressPercent: number;
  distanceAtTime: number;
  targetDistance: number;
  isCompletionNotification: boolean;
  notifiedAt: Date;
  createdAt?: Date;
}
