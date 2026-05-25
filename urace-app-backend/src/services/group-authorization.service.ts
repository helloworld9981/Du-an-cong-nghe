import { ObjectId } from "mongodb";
import { groupMemberData } from "../data/group-member.data";
import { groupData } from "../data/group.data";
import { Group } from "../models/group.model";
import config from '../config/env.config';

export class GroupAuthorizationService {
  private async ensureConnection() {
    if (!groupMemberData.isConnected()) {
      const mongoUrl = config.MONGODB_URI;
      const dbName = config.DB_NAME;
      await groupMemberData.connect(mongoUrl, dbName);
    }
  }

  async isGroupAdmin(groupId: string, userId: string): Promise<boolean> {
    await this.ensureConnection();
    const membership = await groupMemberData.findByGroupAndUser(groupId, userId);
    return membership?.role === 'admin';
  }

  async isGroupMember(groupId: string, userId: string): Promise<boolean> {
    await this.ensureConnection();
    const membership = await groupMemberData.findByGroupAndUser(groupId, userId);
    return membership !== null;
  }

  async canViewGroupDetails(group: Group, userId: string): Promise<boolean> {
    // Public groups can be viewed by anyone
    if (!group.private) {
      return true;
    }
    
    // Private groups can only be viewed by members
    return await this.isGroupMember(group._id!.toString(), userId);
  }

  async canManageGroup(groupId: string, userId: string): Promise<boolean> {
    // Only admins can update/delete groups
    return await this.isGroupAdmin(groupId, userId);
  }

  async canManageMembers(groupId: string, userId: string): Promise<boolean> {
    // Only admins can add/remove/promote members
    return await this.isGroupAdmin(groupId, userId);
  }

  async canCreateContest(groupId: string, userId: string): Promise<boolean> {
    // Only admins can create contests
    return await this.isGroupAdmin(groupId, userId);
  }

  async canManageContest(contestId: string, userId: string): Promise<boolean> {
    // Check if user is admin of the contest's group
    await this.ensureConnection();
    const contest = await this.getContestById(contestId);
    if (!contest) return false;
    
    return await this.isGroupAdmin(contest.groupId.toString(), userId);
  }

  private async getContestById(contestId: string): Promise<any> {
    try {
      const { contestData } = await import('../data/contest.data');
      return await contestData.findById(new ObjectId(contestId));
    } catch (error) {
      console.error('Error fetching contest:', error);
      return null;
    }
  }

  async getUserRole(groupId: string, userId: string): Promise<'admin' | 'member' | null> {
    await this.ensureConnection();
    const membership = await groupMemberData.findByGroupAndUser(groupId, userId);
    return membership?.role || null;
  }

  async getVisibleGroups(allGroups: Group[], userId: string): Promise<Group[]> {
    const visibleGroups: Group[] = [];
    
    for (const group of allGroups) {
      if (await this.canViewGroupDetails(group, userId)) {
        visibleGroups.push(group);
      }
    }
    
    return visibleGroups;
  }
}

export const groupAuthService = new GroupAuthorizationService();