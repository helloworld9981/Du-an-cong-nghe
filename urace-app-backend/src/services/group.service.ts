import { ObjectId } from "mongodb";
import { Group } from "../models/group.model";
import { GroupMember } from "../models/group-member.model";
import { JoinRequest } from "../models/join-request.model";
import { groupData } from "../data/group.data";
import { groupMemberData } from "../data/group-member.data";
import { joinRequestData } from "../data/join-request.data";
import { groupAuthService } from "./group-authorization.service";
import { redisService } from "./redis.service";
import { userData } from "../data/user.data";
import config from '../config/env.config';
import { createLogger } from '../utils/logger';

const logger = createLogger('GroupService');

export class GroupService {
  private async ensureConnection() {
    const mongoUrl = config.MONGODB_URI;
    const dbName = config.DB_NAME;
    
    if (!groupData.isConnected()) {
      await groupData.connect(mongoUrl, dbName);
    }
    if (!groupMemberData.isConnected()) {
      await groupMemberData.connect(mongoUrl, dbName);
    }
    if (!joinRequestData.isConnected()) {
      await joinRequestData.connect(mongoUrl, dbName);
    }
  }

  async createGroup(
    group: Omit<Group, "_id" | "createdAt" | "updatedAt">,
    creatorUserId: string
  ): Promise<Group> {
    await this.ensureConnection();
    const newGroupId = await groupData.create(group);
    
    // Auto-assign creator as admin
    const creatorMembership: GroupMember = {
      groupId: newGroupId.toString(),
      userId: creatorUserId,
      role: 'admin',
      joinedAt: new Date()
    };
    await groupMemberData.create(creatorMembership);
    
    const createdGroup = await groupData.findById(newGroupId);
    if (!createdGroup) {
      throw new Error("Failed to create group");
    }
    return createdGroup;
  }

  async getGroup(groupId: ObjectId): Promise<Group | null> {
    return await groupData.findById(groupId);
  }

  async updateGroup(
    groupId: ObjectId,
    update: Partial<Group>
  ): Promise<Group | null> {
    const success = await groupData.update(groupId, update);
    if (!success) {
      return null;
    }
    return await groupData.findById(groupId);
  }

  async deleteGroup(groupId: ObjectId): Promise<boolean> {
    await this.ensureConnection();
    // Delete all members and join requests when deleting group
    await groupMemberData.deleteAllByGroupId(groupId.toString());
    // Note: Should also delete join requests, but JoinRequestData doesn't have deleteAllByGroupId yet
    return await groupData.delete(groupId);
  }

  async getAllGroups(): Promise<Group[]> {
    return await groupData.getAll();
  }

  // Member Management Methods
  async getGroupMembers(groupId: string, page: number = 1, limit: number = 20, search: string = ''): Promise<{ members: any[], total: number, page: number, limit: number }> {
    await this.ensureConnection();

    // Get members with pagination and search
    const { members, total } = await groupMemberData.findByGroupId(groupId, page, limit, search);

    // Populate user details for each member
    const membersWithDetails = await Promise.all(
      members.map(async (member) => {
        try {
          const user = await userData.findById(member.userId);
          if (user) {
            return {
              _id: user._id,
              userId: member.userId,
              username: user.username,
              email: user.email,
              role: member.role,
              joinedAt: member.joinedAt,
              stravaProfile: user.stravaProfile ? {
                firstname: user.stravaProfile.firstname,
                lastname: user.stravaProfile.lastname,
                username: user.stravaProfile.username
              } : null
            };
          }
          // Fallback if user not found
          return {
            _id: member.userId,
            userId: member.userId,
            username: member.userId,
            email: null,
            role: member.role,
            joinedAt: member.joinedAt,
            stravaProfile: null
          };
        } catch (error: any) {
          logger.error('Error fetching user details for group member', 'getGroupMembers', {
            service: 'GroupService.getGroupMembers',
            groupId,
            userId: member.userId,
            error: error.message
          });
          // Fallback if error occurs
          return {
            _id: member.userId,
            userId: member.userId,
            username: member.userId,
            email: null,
            role: member.role,
            joinedAt: member.joinedAt,
            stravaProfile: null
          };
        }
      })
    );

    return {
      members: membersWithDetails,
      total,
      page,
      limit
    };
  }

  async isMemberInGroup(groupId: string, userId: string) : Promise<boolean> {
    await this.ensureConnection();
    const existingMember = await groupMemberData.findByGroupAndUser(groupId, userId);
    return !!existingMember;
  } 

  async addMember(groupId: string, userId: string, role: 'admin' | 'member' = 'member'): Promise<GroupMember> {
    await this.ensureConnection();

    const isAlreadyInGroup = await this.isMemberInGroup(groupId, userId);
    if (isAlreadyInGroup) {
      throw new Error("User is already a member of this group");
    }

    const membership: GroupMember = {
      groupId,
      userId,
      role,
      joinedAt: new Date()
    };
    
    const newMember = await groupMemberData.create(membership);
    await groupData.incrementMemberCount(new ObjectId(groupId));
    
    return newMember;
  }

  async removeMember(groupId: string, userId: string): Promise<boolean> {
    await this.ensureConnection();
    const success = await groupMemberData.delete(groupId, userId);
    if (success) {
      await groupData.decrementMemberCount(new ObjectId(groupId));
    }
    return success;
  }

  async updateMemberRole(groupId: string, userId: string, role: 'admin' | 'member'): Promise<boolean> {
    await this.ensureConnection();
    return await groupMemberData.updateRole(groupId, userId, role);
  }

  async getUserRole(groupId: string, userId: string): Promise<'admin' | 'member' | null> {
    return await groupAuthService.getUserRole(groupId, userId);
  }

  // Join Request Methods (Redis-based)
  async requestToJoin(groupId: string, userId: string): Promise<boolean> {
    // Connect to Redis if not already connected
    if (!redisService['isConnected']) {
      await redisService.connect();
    }
    
    return await redisService.addJoinRequest(groupId, userId);
  }

  async getPendingJoinRequests(groupId: string): Promise<string[]> {
    // Connect to Redis if not already connected
    if (!redisService['isConnected']) {
      await redisService.connect();
    }
    
    return await redisService.getJoinRequests(groupId);
  }

  async approveJoinRequest(groupId: string, userId: string, approvedBy: string): Promise<boolean> {
    // Connect to Redis if not already connected
    if (!redisService['isConnected']) {
      await redisService.connect();
    }
    
    // Remove from pending requests and add as member
    const removed = await redisService.removeJoinRequest(groupId, userId);
    if (removed) {
      await this.addMember(groupId, userId, 'member');
    }
    return removed;
  }

  async rejectJoinRequest(groupId: string, userId: string, rejectedBy: string): Promise<boolean> {
    // Connect to Redis if not already connected
    if (!redisService['isConnected']) {
      await redisService.connect();
    }
    
    // Simply remove from pending requests
    return await redisService.removeJoinRequest(groupId, userId);
  }

  async hasJoinRequest(groupId: string, userId: string): Promise<boolean> {
    // Connect to Redis if not already connected
    if (!redisService['isConnected']) {
      await redisService.connect();
    }
    
    return await redisService.hasJoinRequest(groupId, userId);
  }

  async revokeJoinRequest(groupId: string, userId: string): Promise<boolean> {
    // Connect to Redis if not already connected  
    if (!redisService['isConnected']) {
      await redisService.connect();
    }
    
    return await redisService.removeJoinRequest(groupId, userId);
  }

  // Authorization wrapper methods
  async canViewGroupDetails(group: Group, userId: string): Promise<boolean> {
    return await groupAuthService.canViewGroupDetails(group, userId);
  }

  async canManageGroup(groupId: string, userId: string): Promise<boolean> {
    return await groupAuthService.canManageGroup(groupId, userId);
  }

  async canManageMembers(groupId: string, userId: string): Promise<boolean> {
    return await groupAuthService.canManageMembers(groupId, userId);
  }

  // xóa 1 ng dùng ra khỏi group
  async leaveGroup(groupId: string, userId: string): Promise<boolean> {
  await this.ensureConnection();

  //kiểm tra user có trong group không
  const isMember = await this.isMemberInGroup(groupId, userId);
  if (!isMember) {
    throw new Error("User is not a member of this group");
  }

  // xóa quan hệ user - group
  const success = await groupMemberData.delete(groupId, userId);

  // giảm tổng số ng trong group
  if (success) {
    await groupData.decrementMemberCount(new ObjectId(groupId));
  }

  return success;
}
}
