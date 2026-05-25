import { ObjectId } from "mongodb";

export interface GroupMember {
  _id?: ObjectId;
  groupId: string;
  userId: string;
  role: 'admin' | 'member';
  joinedAt: Date;
}