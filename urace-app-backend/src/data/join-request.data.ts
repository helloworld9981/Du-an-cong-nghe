import { JoinRequest } from "../models/join-request.model";
import { BaseData } from "./base.data";

export class JoinRequestData extends BaseData<JoinRequest> {
  constructor() {
    super("joinRequests");
  }

  async create(joinRequest: JoinRequest): Promise<JoinRequest> {
    this.ensureConnected();
    const result = await this.collection!.insertOne(joinRequest);
    return { ...joinRequest, _id: result.insertedId };
  }

  async findByGroupId(groupId: string, status?: 'pending' | 'approved' | 'rejected'): Promise<JoinRequest[]> {
    this.ensureConnected();
    const filter: any = { groupId };
    if (status) {
      filter.status = status;
    }
    return await this.collection!
      .find(filter)
      .sort({ requestedAt: -1 })
      .toArray();
  }

  async findByUserId(userId: string): Promise<JoinRequest[]> {
    this.ensureConnected();
    return await this.collection!
      .find({ userId })
      .sort({ requestedAt: -1 })
      .toArray();
  }

  async findByGroupAndUser(groupId: string, userId: string): Promise<JoinRequest | null> {
    this.ensureConnected();
    return await this.collection!.findOne({ groupId, userId });
  }

  async updateStatus(
    groupId: string, 
    userId: string, 
    status: 'approved' | 'rejected',
    processedBy: string
  ): Promise<boolean> {
    this.ensureConnected();
    const result = await this.collection!.updateOne(
      { groupId, userId, status: 'pending' },
      { 
        $set: { 
          status, 
          processedAt: new Date(),
          processedBy 
        } 
      }
    );
    return result.modifiedCount > 0;
  }

  async delete(groupId: string, userId: string): Promise<boolean> {
    this.ensureConnected();
    const result = await this.collection!.deleteOne({ groupId, userId });
    return result.deletedCount > 0;
  }
}

export const joinRequestData = new JoinRequestData();