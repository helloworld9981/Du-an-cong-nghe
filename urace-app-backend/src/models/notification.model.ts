import { ObjectId } from "mongodb";

export enum NotificationType {
  REQUEST_TO_JOIN_GROUP = "RequestToJoinGroup",
  REQUEST_TO_JOIN_GROUP_ADMIN = "RequestToJoinGroupAdmin",
  APPROVED_REQUEST = "ApprovedRequest",
  INFO = "Info",
  SUCCESS = "Success",
  WARNING = "Warning",
  ERROR = "Error",
  SYSTEM = "System",
  CONTEST_PROGRESS_BEHIND = "ContestProgressBehind",
  CONTEST_PROGRESS_ON_TRACK = "ContestProgressOnTrack",
  CONTEST_PROGRESS_COMPLETED = "ContestProgressCompleted",
  ACTIVITY_REJECTED = "ActivityRejected",
  ACTIVITY_RESTORED = "ActivityRestored",
}

export interface Notification {
  _id?: ObjectId;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  data?: any; // Flexible data payload for navigation/actions
  createdAt: Date;
}
