import { Response } from "express";
import { ObjectId } from "mongodb";
import { GroupService } from "../services/group.service";
import { AuthRequest } from "../middleware/auth.middleware";
import { Group } from "../models/group.model";
import { notificationService } from "../services/notification.service";
import { NotificationType } from "../models/notification.model";

const groupService = new GroupService();

export const createGroup = async (
  req: AuthRequest,
  res: Response,
): Promise<any> => {
  try {
    const groupData: Omit<Group, "_id" | "createdAt" | "updatedAt"> = req.body;
    const userId = req.user!._id.toString();
    const group = await groupService.createGroup(groupData, userId);
    res.status(201).json(group);
  } catch (error) {
    console.error("Create group error:", error);
    res
      .status(500)
      .json({ message: "Internal server error during group creation" });
  }
};

export const getGroup = async (
  req: AuthRequest,
  res: Response,
): Promise<any> => {
  try {
    const groupId = new ObjectId(req.params.id);
    const userId = req.user!._id.toString();
    const group = await groupService.getGroup(groupId);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // For private groups, check if user is a member
    if (group.private) {
      const isMember = await groupService.getUserRole(
        groupId.toString(),
        userId,
      );
      if (!isMember) {
        // Return basic info only for private groups when user is not a member
        const basicInfo = {
          _id: group._id,
          name: group.name,
          description: group.description,
          private: group.private,
          memberCount: group.memberCount || 0,
          createdAt: group.createdAt,
          // Don't include createdBy or detailed info
        };
        return res.json(basicInfo);
      }
    }

    // User can view full details (public group or member of private group)
    res.json(group);
  } catch (error) {
    console.error("Get group error:", error);
    res
      .status(500)
      .json({ message: "Internal server error while fetching group" });
  }
};

export const updateGroup = async (
  req: AuthRequest,
  res: Response,
): Promise<any> => {
  try {
    const groupId = new ObjectId(req.params.id);
    const userId = req.user!._id.toString();
    const updateData: Partial<Group> = req.body;

    // Check if user can manage this group
    const canManage = await groupService.canManageGroup(
      groupId.toString(),
      userId,
    );
    if (!canManage) {
      return res
        .status(403)
        .json({ message: "Access denied. Only admins can update groups." });
    }

    const updatedGroup = await groupService.updateGroup(groupId, updateData);

    if (!updatedGroup) {
      return res
        .status(404)
        .json({ message: "Group not found or update failed" });
    }

    res.json(updatedGroup);
  } catch (error) {
    console.error("Update group error:", error);
    res
      .status(500)
      .json({ message: "Internal server error during group update" });
  }
};

export const deleteGroup = async (
  req: AuthRequest,
  res: Response,
): Promise<any> => {
  try {
    const groupId = new ObjectId(req.params.id);
    const userId = req.user!._id.toString();

    // Check if user can manage this group
    const canManage = await groupService.canManageGroup(
      groupId.toString(),
      userId,
    );
    if (!canManage) {
      return res
        .status(403)
        .json({ message: "Access denied. Only admins can delete groups." });
    }

    const success = await groupService.deleteGroup(groupId);

    if (!success) {
      return res
        .status(404)
        .json({ message: "Group not found or delete failed" });
    }

    res.status(204).send();
  } catch (error) {
    console.error("Delete group error:", error);
    res
      .status(500)
      .json({ message: "Internal server error during group deletion" });
  }
};

// rời nhóm
export const leaveGroup = async (
  req: AuthRequest,
  res: Response,
): Promise<any> => {
  try {
    const groupId = req.params.id;
    const userId = req.user!._id.toString();

    // Check group tồn tại
    const group = await groupService.getGroup(new ObjectId(groupId));
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Check user có phải member không
    const role = await groupService.getUserRole(groupId, userId);
    if (!role) {
      return res.status(400).json({
        message: "You are not a member of this group",
      });
    }

    // Không cho admin tự rời nếu là người duy nhất (optional rule)
    if (role === "admin" && group.memberCount === 1) {
      return res.status(400).json({
        message: "Admin cannot leave the group when being the only member",
      });
    }

    const success = await groupService.leaveGroup(groupId, userId);

    if (!success) {
      return res
        .status(404)
        .json({ message: "Failed to leave group" });
    }

    res.status(200).json({
      message: "Left group successfully",
    });
  } catch (error) {
    console.error("Leave group error:", error);
    res.status(500).json({
      message: "Internal server error while leaving group",
    });
  }
};

export const getAllGroups = async (
  req: AuthRequest,
  res: Response,
): Promise<any> => {
  try {
    const userId = req.user!._id.toString();
    const allGroups = await groupService.getAllGroups();

    // Import contest data to get contest information
    const { contestData } = await import("../data/contest.data");
    const now = new Date();

    // Separate groups into user's groups and other groups with contest previews
    const myGroups = [];
    const otherGroups = [];

    for (const group of allGroups) {
      const groupId = group._id?.toString();
      if (groupId) {
        // Get all contests for this group
        const groupContests = await contestData.findByGroupId(groupId);

        // Filter contests by status
        const activeContests = groupContests.filter(
          (contest) =>
            now >= new Date(contest.startAt) && now <= new Date(contest.endAt),
        );
        const upcomingContests = groupContests.filter(
          (contest) => now < new Date(contest.startAt),
        );

        // Create contest preview data (limit to 3 most relevant)
        const contestPreviews = {
          active: activeContests.slice(0, 3).map((contest) => ({
            _id: contest._id,
            name: contest.name,
            contestType: contest.contestType || "Team",
            activityType: contest.activityType || "All",
            endAt: contest.endAt,
            daysLeft: Math.ceil(
              (new Date(contest.endAt).getTime() - now.getTime()) /
                (1000 * 60 * 60 * 24),
            ),
          })),
          upcoming: upcomingContests.slice(0, 2).map((contest) => ({
            _id: contest._id,
            name: contest.name,
            contestType: contest.contestType || "Team",
            activityType: contest.activityType || "All",
            startAt: contest.startAt,
            daysToStart: Math.ceil(
              (new Date(contest.startAt).getTime() - now.getTime()) /
                (1000 * 60 * 60 * 24),
            ),
          })),
        };

        // Calculate activity level based on contests
        let activityLevel = "Quiet";
        const totalActiveContests = activeContests.length;
        if (totalActiveContests >= 2) activityLevel = "Hot";
        else if (totalActiveContests >= 1 || upcomingContests.length >= 2)
          activityLevel = "Active";

        // Create enhanced group object
        const enhancedGroup = {
          ...group,
          contestPreviews,
          stats: {
            activeContestCount: activeContests.length,
            upcomingContestCount: upcomingContests.length,
            totalContestCount: groupContests.length,
            activityLevel,
          },
        };

        // Determine if user is member and categorize
        const userRole = await groupService.getUserRole(groupId, userId);
        if (userRole) {
          myGroups.push(enhancedGroup);
        } else {
          otherGroups.push(enhancedGroup);
        }
      }
    }

    res.json({
      myGroups,
      otherGroups,
    });
  } catch (error) {
    console.error("Get all groups error:", error);
    res
      .status(500)
      .json({ message: "Internal server error while fetching groups" });
  }
};

// Member Management Endpoints
export const getGroupMembers = async (
  req: AuthRequest,
  res: Response,
): Promise<any> => {
  try {
    const groupId = req.params.id;
    const userId = req.user!._id.toString();
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = (req.query.search as string) || "";

    // Check if user can view group details
    const group = await groupService.getGroup(new ObjectId(groupId));
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const canView = await groupService.canViewGroupDetails(group, userId);
    if (!canView) {
      return res
        .status(403)
        .json({ message: "Access denied to view group members" });
    }

    const result = await groupService.getGroupMembers(
      groupId,
      page,
      limit,
      search,
    );
    res.json(result);
  } catch (error) {
    console.error("Get group members error:", error);
    res
      .status(500)
      .json({ message: "Internal server error while fetching group members" });
  }
};

export const addGroupMember = async (
  req: AuthRequest,
  res: Response,
): Promise<any> => {
  try {
    const groupId = req.params.id;
    const { userId: targetUserId, role = "member" } = req.body;
    const adminUserId = req.user!._id.toString();

    // Check if user can manage members
    const canManage = await groupService.canManageMembers(groupId, adminUserId);
    if (!canManage) {
      return res
        .status(403)
        .json({ message: "Access denied. Only admins can add members." });
    }

    const newMember = await groupService.addMember(groupId, targetUserId, role);
    res.status(201).json(newMember);
  } catch (error) {
    console.error("Add group member error:", error);
    if (
      error instanceof Error &&
      error.message === "User is already a member of this group"
    ) {
      return res.status(400).json({ message: error.message });
    }
    res
      .status(500)
      .json({ message: "Internal server error while adding group member" });
  }
};

export const removeGroupMember = async (
  req: AuthRequest,
  res: Response,
): Promise<any> => {
  try {
    const groupId = req.params.id;
    const targetUserId = req.params.userId;
    const adminUserId = req.user!._id.toString();

    // Check if user can manage members
    const canManage = await groupService.canManageMembers(groupId, adminUserId);
    if (!canManage) {
      return res
        .status(403)
        .json({ message: "Access denied. Only admins can remove members." });
    }

    const success = await groupService.removeMember(groupId, targetUserId);
    if (!success) {
      return res
        .status(404)
        .json({ message: "Member not found or removal failed" });
    }

    res.status(204).send();
  } catch (error) {
    console.error("Remove group member error:", error);
    res
      .status(500)
      .json({ message: "Internal server error while removing group member" });
  }
};

export const updateMemberRole = async (
  req: AuthRequest,
  res: Response,
): Promise<any> => {
  try {
    const groupId = req.params.id;
    const targetUserId = req.params.userId;
    const { role } = req.body;
    const adminUserId = req.user!._id.toString();

    // Check if user can manage members
    const canManage = await groupService.canManageMembers(groupId, adminUserId);
    if (!canManage) {
      return res.status(403).json({
        message: "Access denied. Only admins can update member roles.",
      });
    }

    if (!["admin", "member"].includes(role)) {
      return res
        .status(400)
        .json({ message: 'Invalid role. Must be "admin" or "member".' });
    }

    const success = await groupService.updateMemberRole(
      groupId,
      targetUserId,
      role,
    );
    if (!success) {
      return res
        .status(404)
        .json({ message: "Member not found or role update failed" });
    }

    res.json({ message: "Member role updated successfully" });
  } catch (error) {
    console.error("Update member role error:", error);
    res
      .status(500)
      .json({ message: "Internal server error while updating member role" });
  }
};

// Join Request Endpoints
export const requestToJoinGroup = async (
  req: AuthRequest,
  res: Response,
): Promise<any> => {
  try {
    const groupId = req.params.id;
    const userId = req.user!._id.toString();

    // Check if group exists
    const group = await groupService.getGroup(new ObjectId(groupId));
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Check if user is already a member
    const currentRole = await groupService.getUserRole(groupId, userId);
    if (currentRole) {
      return res
        .status(400)
        .json({ message: "User is already a member of this group" });
    }

    // Check if user already has a pending join request
    const hasRequest = await groupService.hasJoinRequest(groupId, userId);
    if (hasRequest) {
      return res.status(400).json({
        message: "You already have a pending join request for this group",
      });
    }

    const success = await groupService.requestToJoin(groupId, userId);
    if (!success) {
      return res.status(400).json({ message: "Failed to create join request" });
    }

    await notificationService.sendNotification(
      userId,
      "Request Sent",
      "Request sent. Please wait for a group moderator to review your profile.",
      NotificationType.REQUEST_TO_JOIN_GROUP,
      { groupId, groupName: group.name },
    );

    await notificationService.sendNotification(
      group.createdBy.toString(),
      "New join request",
      `User ${req.user!.displayName?.toString()} has requested to join group ${group.name}`,
      NotificationType.REQUEST_TO_JOIN_GROUP_ADMIN,
      { groupId, groupName: group.name },
    );

    res.status(201).json({ message: "Join request sent successfully" });
  } catch (error) {
    console.error("Request to join group error:", error);
    res.status(500).json({
      message: "Internal server error while requesting to join group",
    });
  }
};

export const getPendingJoinRequests = async (
  req: AuthRequest,
  res: Response,
): Promise<any> => {
  try {
    const groupId = req.params.id;
    const userId = req.user!._id.toString();

    // Check if user can manage members (only admins can see join requests)
    const canManage = await groupService.canManageMembers(groupId, userId);
    if (!canManage) {
      return res.status(403).json({
        message: "Access denied. Only admins can view join requests.",
      });
    }

    const userIds = await groupService.getPendingJoinRequests(groupId);
    res.json(userIds);
  } catch (error) {
    console.error("Get pending join requests error:", error);
    res
      .status(500)
      .json({ message: "Internal server error while fetching join requests" });
  }
};

export const approveJoinRequest = async (
  req: AuthRequest,
  res: Response,
): Promise<any> => {
  try {
    const groupId = req.params.id;
    const targetUserId = req.params.userId;
    const adminUserId = req.user!._id.toString();

    // Check if user can manage members
    const canManage = await groupService.canManageMembers(groupId, adminUserId);
    if (!canManage) {
      return res.status(403).json({
        message: "Access denied. Only admins can approve join requests.",
      });
    }

    const group = await groupService.getGroup(new ObjectId(groupId));
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const success = await groupService.approveJoinRequest(
      groupId,
      targetUserId,
      adminUserId,
    );
    if (!success) {
      return res
        .status(404)
        .json({ message: "Join request not found or approval failed" });
    }

    res.json({ message: "Join request approved successfully" });

    // send notification
    await notificationService.sendNotification(
      targetUserId,
      "Welcom to the group!",
      `Your request to join ${group.name} has been approved. Start exploring now!`,
      NotificationType.APPROVED_REQUEST,
      { groupId, groupName: group.name },
    );
  } catch (error) {
    console.error("Approve join request error:", error);
    res
      .status(500)
      .json({ message: "Internal server error while approving join request" });
  }
};

export const rejectJoinRequest = async (
  req: AuthRequest,
  res: Response,
): Promise<any> => {
  try {
    const groupId = req.params.id;
    const targetUserId = req.params.userId;
    const adminUserId = req.user!._id.toString();

    // Check if user can manage members
    const canManage = await groupService.canManageMembers(groupId, adminUserId);
    if (!canManage) {
      return res.status(403).json({
        message: "Access denied. Only admins can reject join requests.",
      });
    }

    const group = await groupService.getGroup(new ObjectId(groupId));
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const success = await groupService.rejectJoinRequest(
      groupId,
      targetUserId,
      adminUserId,
    );
    if (!success) {
      return res
        .status(404)
        .json({ message: "Join request not found or rejection failed" });
    }

    res.json({ message: "Join request rejected successfully" });
  } catch (error) {
    console.error("Reject join request error:", error);
    res
      .status(500)
      .json({ message: "Internal server error while rejecting join request" });
  }
};

export const getUserRole = async (
  req: AuthRequest,
  res: Response,
): Promise<any> => {
  try {
    const groupId = req.params.id;
    const userId = req.user!._id.toString();

    const role = await groupService.getUserRole(groupId, userId);
    res.json({ role });
  } catch (error) {
    console.error("Get user role error:", error);
    res
      .status(500)
      .json({ message: "Internal server error while fetching user role" });
  }
};

export const getUserJoinRequestStatus = async (
  req: AuthRequest,
  res: Response,
): Promise<any> => {
  try {
    const groupId = req.params.id;
    const userId = req.user!._id.toString();

    const hasRequest = await groupService.hasJoinRequest(groupId, userId);
    res.json({ hasJoinRequest: hasRequest });
  } catch (error) {
    console.error("Get user join request status error:", error);
    res.status(500).json({
      message: "Internal server error while fetching join request status",
    });
  }
};

export const revokeJoinRequest = async (
  req: AuthRequest,
  res: Response,
): Promise<any> => {
  try {
    const groupId = req.params.id;
    const userId = req.user!._id.toString();

    // Check if user has a pending join request
    const hasRequest = await groupService.hasJoinRequest(groupId, userId);
    if (!hasRequest) {
      return res.status(404).json({ message: "No join request found" });
    }

    const success = await groupService.revokeJoinRequest(groupId, userId);
    if (!success) {
      return res.status(404).json({ message: "Failed to revoke join request" });
    }

    res.json({ message: "Join request revoked successfully" });
  } catch (error) {
    console.error("Revoke join request error:", error);
    res
      .status(500)
      .json({ message: "Internal server error while revoking join request" });
  }


  
};
