import { GroupMember } from "../models/group-member.model";
import { BaseData } from "./base.data";

export class GroupMemberData extends BaseData<GroupMember> {
  constructor() {
    super("groupMembers");
  }

  async create(groupMember: GroupMember): Promise<GroupMember> {
    this.ensureConnected();
    const result = await this.collection!.insertOne(groupMember);
    return { ...groupMember, _id: result.insertedId };
  }

  async findByGroupId(groupId: string, page: number = 1, limit: number = 20, search: string = ''): Promise<{ members: GroupMember[], total: number }> {
    this.ensureConnected();
    const skip = (page - 1) * limit;

    if (!search.trim()) {
      // No search, return all members with pagination
      const members = await this.collection!
        .find({ groupId })
        .sort({ joinedAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();

      const total = await this.collection!.countDocuments({ groupId });

      return { members, total };
    }

    // With search, we need to lookup user information
    // Use aggregation to join with users collection and filter by search term
    // Escape special regex characters but preserve spaces
    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const searchRegex = new RegExp(escapedSearch, 'i'); // Case-insensitive search

    const pipeline: any[] = [
      { $match: { groupId } },
      {
        $lookup: {
          from: 'Users',
          let: { userId: { $toObjectId: '$userId' } },
          pipeline: [
            { $match: { $expr: { $eq: ['$_id', '$$userId'] } } }
          ],
          as: 'userInfo'
        }
      },
      { $unwind: { path: '$userInfo', preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          'userInfo.fullName': {
            $concat: [
              { $ifNull: ['$userInfo.stravaProfile.firstname', ''] },
              ' ',
              { $ifNull: ['$userInfo.stravaProfile.lastname', ''] }
            ]
          }
        }
      },
      {
        $match: {
          $or: [
            { 'userInfo.username': searchRegex },
            { 'userInfo.email': searchRegex },
            { 'userInfo.stravaProfile.firstname': searchRegex },
            { 'userInfo.stravaProfile.lastname': searchRegex },
            { 'userInfo.fullName': searchRegex }
          ]
        }
      },
      {
        $project: {
          _id: 1,
          groupId: 1,
          userId: 1,
          role: 1,
          joinedAt: 1
        }
      }
    ];

    // Get total count for pagination
    const countPipeline = [...pipeline, { $count: 'total' }];
    const countResult = await this.collection!.aggregate(countPipeline).toArray();
    const total = countResult.length > 0 ? countResult[0].total : 0;

    // Get paginated results
    const resultsPipeline = [
      ...pipeline,
      { $sort: { joinedAt: -1 } },
      { $skip: skip },
      { $limit: limit }
    ];

    const members = await this.collection!.aggregate(resultsPipeline).toArray() as GroupMember[];

    return { members, total };
  }

  async findByUserId(userId: string): Promise<GroupMember[]> {
    this.ensureConnected();
    return await this.collection!.find({ userId }).toArray();
  }

  async findByGroupAndUser(groupId: string, userId: string): Promise<GroupMember | null> {
    this.ensureConnected();
    return await this.collection!.findOne({ groupId, userId });
  }

  async updateRole(groupId: string, userId: string, role: 'admin' | 'member'): Promise<boolean> {
    this.ensureConnected();
    const result = await this.collection!.updateOne({ groupId, userId }, { $set: { role } });
    return result.modifiedCount > 0;
  }

  async delete(groupId: string, userId: string): Promise<boolean> {
    this.ensureConnected();
    const result = await this.collection!.deleteOne({ groupId, userId });
    return result.deletedCount > 0;
  }

  async countByGroupId(groupId: string): Promise<number> {
    this.ensureConnected();
    return await this.collection!.countDocuments({ groupId });
  }

  async deleteAllByGroupId(groupId: string): Promise<number> {
    this.ensureConnected();
    const result = await this.collection!.deleteMany({ groupId });
    return result.deletedCount;
  }
}

export const groupMemberData = new GroupMemberData();