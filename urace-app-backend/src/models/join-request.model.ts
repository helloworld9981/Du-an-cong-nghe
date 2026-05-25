import { ObjectId } from "mongodb";

export interface JoinRequest {
  _id?: ObjectId;
  groupId: string;
  userId: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: Date;
  processedAt?: Date;
  processedBy?: string;
}