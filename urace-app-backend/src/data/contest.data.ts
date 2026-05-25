import { ObjectId } from "mongodb";
import { Contest, ContestType } from "../models/contest.model";
import { BaseData } from "./base.data";

class ContestData extends BaseData<Contest> {
  constructor() {
    super("Contests");
  }

  async create(
    contest: Omit<Contest, "_id" | "createdAt" | "updatedAt">
  ): Promise<ObjectId> {
    this.ensureConnected();
    const contestData = {
      ...contest,
      groupId: typeof contest.groupId === 'string' ? new ObjectId(contest.groupId) : contest.groupId,
      startAt: contest.startAt instanceof Date ? contest.startAt : new Date(contest.startAt),
      endAt: contest.endAt instanceof Date ? contest.endAt : new Date(contest.endAt),
      contestType: contest.contestType || 'Team',
      participantIds: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const result = await this.collection!.insertOne(contestData);
    return result.insertedId;
  }

  async findById(id: ObjectId): Promise<Contest | null> {
    this.ensureConnected();
    return this.collection!.findOne({ _id: id });
  }

  async update(id: ObjectId, update: Partial<Contest>): Promise<boolean> {
    this.ensureConnected();
    
    // Check if contest has started
    const contest = await this.findById(id);
    if (!contest) {
      throw new Error("Contest not found");
    }
    
    // Convert date fields if they exist in the update
    const updateData = { ...update };
    if (updateData.startAt) {
      updateData.startAt = updateData.startAt instanceof Date ? updateData.startAt : new Date(updateData.startAt);
    }
    if (updateData.endAt) {
      updateData.endAt = updateData.endAt instanceof Date ? updateData.endAt : new Date(updateData.endAt);
    }
    
    const result = await this.collection!.updateOne(
      { _id: id },
      { $set: { ...updateData, updatedAt: new Date() } }
    );
    return result.modifiedCount === 1;
  }

  async delete(id: ObjectId): Promise<boolean> {
    this.ensureConnected();
    const result = await this.collection!.deleteOne({ _id: id });
    return result.deletedCount === 1;
  }

  async findByGroupId(groupId: string): Promise<Contest[]> {
    this.ensureConnected();
    return this.collection!.find({ groupId: new ObjectId(groupId) }).toArray();
  }

  async getAll(): Promise<Contest[]> {
    this.ensureConnected();
    return this.collection!.find({}).toArray();
  }

  async findByContestTypeAndParticipant(contestType: ContestType, participantId: ObjectId): Promise<Contest[]> {
    this.ensureConnected();
    return this.collection!.find({
      contestType: contestType,
      participantIds: participantId
    }).toArray();
  }

  async addParticipant(contestId: ObjectId, participantId: ObjectId): Promise<boolean> {
    this.ensureConnected();
    
    
    // Ensure proper ObjectId conversion
    const contestObjectId = typeof contestId === 'string' ? new ObjectId(contestId) : contestId;
    const participantObjectId = typeof participantId === 'string' ? new ObjectId(participantId) : participantId;
    
    
    // Check if contest has started
    const contest = await this.findById(contestObjectId);
    if (!contest) {
      throw new Error("Contest not found");
    }
    
    
    if (new Date() >= contest.startAt) {
      throw new Error("Cannot add participants after contest has started");
    }

    if (contest.contestType !== 'Individual') {
      throw new Error("Can only add participants to individual contests");
    }

    // Initialize participantIds array if it doesn't exist
    const participantIds = contest.participantIds || [];
    
    // Check if participant is already added
    if (participantIds.some(id => id.toString() === participantObjectId.toString())) {
      throw new Error("Participant already added to contest");
    }

    
    const result = await this.collection!.updateOne(
      { _id: contestObjectId },
      { 
        $push: { participantIds: participantObjectId },
        $inc: { numberOfParticipants: 1 },
        $set: { updatedAt: new Date() }
      }
    );
    
    return result.modifiedCount === 1;
  }

  async removeParticipant(contestId: ObjectId, participantId: ObjectId): Promise<boolean> {
    this.ensureConnected();
    
    // Check if contest has started
    const contest = await this.findById(contestId);
    if (!contest) {
      throw new Error("Contest not found");
    }
    
    if (new Date() >= contest.startAt) {
      throw new Error("Cannot remove participants after contest has started");
    }

    if (contest.contestType !== 'Individual') {
      throw new Error("Can only remove participants from individual contests");
    }

    const result = await this.collection!.updateOne(
      { _id: contestId },
      { 
        $pull: { participantIds: participantId },
        $inc: { numberOfParticipants: -1 },
        $set: { updatedAt: new Date() }
      }
    );
    return result.modifiedCount === 1;
  }
}

export const contestData = new ContestData();
