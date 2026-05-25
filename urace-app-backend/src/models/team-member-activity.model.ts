import { ObjectId } from "mongodb";
import { RecordTypes } from "./workout-activity.model";

export interface TeamMemberActivity {
  _id?: ObjectId;
  userId: ObjectId;
  teamId: ObjectId;
  contestId: ObjectId;
  stravaUserId: number;

  // Workout data
  distance: number;
  movingTime: number;
  workoutType: string;
  pace: number | null;
  startDate: Date;

  // Original workout reference
  workoutActivityId: ObjectId;

  // Strava reference
  stravaActivityId?: number;

  // Metadata
  createdAt?: Date;
  updatedAt?: Date;

  // Rejection fields (for fraud detection)
  status?: "valid" | "rejected"; // Default: 'valid' or undefined (treated as valid)
  rejectedAt?: Date;
  rejectedBy?: ObjectId; // Admin userId who rejected
  rejectionReason?: string;
  recordType?: RecordTypes;
}
