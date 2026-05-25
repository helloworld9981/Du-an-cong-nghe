import { ObjectId } from "mongodb";

export interface Group {
  _id?: ObjectId;
  name: string;
  description: string;
  private: boolean;
  createdBy: string;
  memberCount: number;
  createdAt?: Date;
  updatedAt?: Date;
}
