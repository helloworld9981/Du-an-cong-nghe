import { ObjectId } from "mongodb";
import { Team, TeamMember } from "../models/team.model";
import { BaseData } from "./base.data";

class TeamData extends BaseData<Team> {
  constructor() {
    super("Teams");
  }

  async create(
    team: Omit<Team, "_id" | "createdAt" | "updatedAt">
  ): Promise<ObjectId> {
    this.ensureConnected();
    const result = await this.collection!.insertOne({
      ...team,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return result.insertedId;
  }

  async findById(id: ObjectId): Promise<Team | null> {
    this.ensureConnected();
    return this.collection!.findOne({ _id: id });
  }

  async findByContestId(contestId: ObjectId): Promise<Team[]> {
    this.ensureConnected();
    return this.collection!.find({ contestId }).toArray();
  }

  async findByMemberId(userId: ObjectId): Promise<Team[]> {
    this.ensureConnected();
    return this.collection!.find({ 
      "members.userId": userId 
    }).toArray();
  }

  async addMember(teamId: ObjectId, member: TeamMember): Promise<boolean> {
    this.ensureConnected();
    const result = await this.collection!.updateOne(
      { _id: teamId },
      {
        $push: { members: member },
        $inc: { numberOfMember: 1 },
        $set: { updatedAt: new Date() },
      }
    );
    return result.modifiedCount === 1;
  }

  async removeMember(teamId: ObjectId, userId: ObjectId): Promise<boolean> {
    this.ensureConnected();
    const result = await this.collection!.updateOne(
      { _id: teamId },
      {
        $pull: { members: { userId } },
        $inc: { numberOfMember: -1 },
        $set: { updatedAt: new Date() },
      }
    );
    return result.modifiedCount === 1;
  }

  async update(id: ObjectId, update: Partial<Team>): Promise<boolean> {
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

  async deleteByContestId(contestId: ObjectId): Promise<number> {
    this.ensureConnected();
    const result = await this.collection!.deleteMany({ contestId });
    return result.deletedCount || 0;
  }
}

export const teamData = new TeamData();
