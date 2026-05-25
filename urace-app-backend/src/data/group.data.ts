import { ObjectId } from "mongodb";
import { Group } from "../models/group.model";
import { BaseData } from "./base.data";

class GroupData extends BaseData<Group> {
  constructor() {
    super("Groups");
  }

  async create(
    group: Omit<Group, "_id" | "createdAt" | "updatedAt">
  ): Promise<ObjectId> {
    this.ensureConnected();
    const result = await this.collection!.insertOne({
      ...group,
      memberCount: 1, // Creator is automatically the first member
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return result.insertedId;
  }

  async findById(id: ObjectId): Promise<Group | null> {
    this.ensureConnected();
    return this.collection!.findOne({ _id: id });
  }

  async update(id: ObjectId, update: Partial<Group>): Promise<boolean> {
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

  async getAll(): Promise<Group[]> {
    this.ensureConnected();
    return this.collection!.find({}).toArray();
  }

  async incrementMemberCount(id: ObjectId): Promise<boolean> {
    this.ensureConnected();
    const result = await this.collection!.updateOne(
      { _id: id },
      { $inc: { memberCount: 1 }, $set: { updatedAt: new Date() } }
    );
    return result.modifiedCount === 1;
  }

  async decrementMemberCount(id: ObjectId): Promise<boolean> {
    this.ensureConnected();
    const result = await this.collection!.updateOne(
      { _id: id },
      { $inc: { memberCount: -1 }, $set: { updatedAt: new Date() } }
    );
    return result.modifiedCount === 1;
  }
}

export const groupData = new GroupData();
