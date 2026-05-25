import { ObjectId } from "mongodb";
import { individualContestActivityData } from "../data/individual-contest-activity.data";
import { teamMemberActivityData } from "../data/team-member-activity.data";
import { contestData } from "../data/contest.data";
import { groupAuthService } from "./group-authorization.service";
import { notificationService } from "./notification.service";
import { NotificationType } from "../models/notification.model";
import { userData } from "../data/user.data";
import config from "../config/env.config";

export type ActivityType = "individual" | "team";

export interface ModerationResult {
  success: boolean;
  message: string;
  error?: string;
}

export interface RejectedActivitiesResult {
  individual: any[];
  team: any[];
}

export class ActivityModerationService {
  private async ensureConnection() {
    const mongoUrl = config.MONGODB_URI;
    const dbName = config.DB_NAME;

    if (!individualContestActivityData.isConnected()) {
      await individualContestActivityData.connect(mongoUrl, dbName);
    }
    if (!teamMemberActivityData.isConnected()) {
      await teamMemberActivityData.connect(mongoUrl, dbName);
    }
    if (!contestData.isConnected()) {
      await contestData.connect(mongoUrl, dbName);
    }
    // userData connection is handled by app.ts startup
  }

  /**
   * Check if contest is currently active (within start and end dates)
   */
  private async isContestActive(contestId: string): Promise<{
    isActive: boolean;
    status: "not_found" | "not_started" | "active" | "ended";
    message: string;
    contest?: any;
  }> {
    await this.ensureConnection();

    const contest = await contestData.findById(new ObjectId(contestId));
    if (!contest) {
      return {
        isActive: false,
        status: "not_found",
        message: "Cuộc thi không tồn tại",
      };
    }

    const now = new Date();

    if (now < contest.startAt) {
      return {
        isActive: false,
        status: "not_started",
        message: "Cuộc thi chưa bắt đầu, không thể thao tác với hoạt động",
        contest,
      };
    }

    if (now > contest.endAt) {
      return {
        isActive: false,
        status: "ended",
        message: "Cuộc thi đã kết thúc, không thể thay đổi kết quả",
        contest,
      };
    }

    return { isActive: true, status: "active", message: "", contest };
  }

  /**
   * Check if user can moderate activities in a contest (must be group admin)
   */
  async canModerateActivities(
    contestId: string,
    userId: string,
  ): Promise<boolean> {
    await this.ensureConnection();

    const contest = await contestData.findById(new ObjectId(contestId));
    if (!contest) return false;

    return await groupAuthService.isGroupAdmin(
      contest.groupId.toString(),
      userId,
    );
  }

  /**
   * Reject an individual contest activity
   */
  async rejectIndividualActivity(
    activityId: string,
    adminUserId: string,
    reason: string,
  ): Promise<ModerationResult> {
    try {
      await this.ensureConnection();

      // 1. Get activity
      let activity = await individualContestActivityData.findById(activityId);
      if (!activity) {
        // Try finding by workoutActivityId just in case
        activity =
          await individualContestActivityData.findByOriginalWorkoutId(
            activityId,
          );
      }
      if (!activity) {
        return {
          success: false,
          message: "Hoạt động không tồn tại",
          error: "ACTIVITY_NOT_FOUND",
        };
      }

      // 2. Check if already rejected
      if (activity.status === "rejected") {
        return {
          success: false,
          message: "Hoạt động này đã bị từ chối trước đó",
          error: "ALREADY_REJECTED",
        };
      }

      // 3. Check contest is active
      const contestCheck = await this.isContestActive(
        activity.contestId.toString(),
      );
      if (!contestCheck.isActive) {
        return {
          success: false,
          message: contestCheck.message,
          error: `CONTEST_${contestCheck.status.toUpperCase()}`,
        };
      }

      // 4. Check admin permission
      const canModerate = await this.canModerateActivities(
        activity.contestId.toString(),
        adminUserId,
      );
      if (!canModerate) {
        return {
          success: false,
          message: "Bạn không có quyền thực hiện thao tác này",
          error: "UNAUTHORIZED",
        };
      }

      if (!activity._id) {
        return {
          success: false,
          message: "Lỗi dữ liệu: Không tìm thấy ID hoạt động",
          error: "INVALID_DATA",
        };
      }

      // 5. Reject the activity
      // Use the actual _id found from the database (in case we found it via workoutActivityId)
      const success = await individualContestActivityData.rejectActivity(
        activity._id,
        adminUserId,
        reason,
      );

      if (!success) {
        return {
          success: false,
          message: "Không thể từ chối hoạt động",
          error: "UPDATE_FAILED",
        };
      }

      // 6. Send notification to user
      await this.sendRejectionNotification(
        activity.userId.toString(),
        contestCheck.contest?.name || "Cuộc thi",
        activity.distance,
        activity.startDate,
        reason,
      );

      return {
        success: true,
        message:
          "Đã từ chối hoạt động thành công. Tiến độ và BXH sẽ được cập nhật.",
      };
    } catch (error: any) {
      console.error("Error rejecting individual activity:", error);
      return { success: false, message: "Lỗi hệ thống", error: error.message };
    }
  }

  /**
   * Reject a team member activity
   */
  async rejectTeamActivity(
    activityId: string,
    adminUserId: string,
    reason: string,
  ): Promise<ModerationResult> {
    try {
      await this.ensureConnection();

      // 1. Get activity
      let activity = await teamMemberActivityData.findById(activityId);
      if (!activity) {
        // Try finding by workoutActivityId just in case
        activity =
          await teamMemberActivityData.findByOriginalWorkoutId(activityId);
      }
      if (!activity) {
        return {
          success: false,
          message: "Hoạt động không tồn tại",
          error: "ACTIVITY_NOT_FOUND",
        };
      }

      // 2. Check if already rejected
      if (activity.status === "rejected") {
        return {
          success: false,
          message: "Hoạt động này đã bị từ chối trước đó",
          error: "ALREADY_REJECTED",
        };
      }

      // 3. Check contest is active
      const contestCheck = await this.isContestActive(
        activity.contestId.toString(),
      );
      if (!contestCheck.isActive) {
        return {
          success: false,
          message: contestCheck.message,
          error: `CONTEST_${contestCheck.status.toUpperCase()}`,
        };
      }

      // 4. Check admin permission
      const canModerate = await this.canModerateActivities(
        activity.contestId.toString(),
        adminUserId,
      );
      if (!canModerate) {
        return {
          success: false,
          message: "Bạn không có quyền thực hiện thao tác này",
          error: "UNAUTHORIZED",
        };
      }

      if (!activity._id) {
        return {
          success: false,
          message: "Lỗi dữ liệu: Không tìm thấy ID hoạt động",
          error: "INVALID_DATA",
        };
      }

      // 5. Reject the activity
      // Use the actual _id found from the database (in case we found it via workoutActivityId)
      const success = await teamMemberActivityData.rejectActivity(
        activity._id,
        adminUserId,
        reason,
      );

      if (!success) {
        return {
          success: false,
          message: "Không thể từ chối hoạt động",
          error: "UPDATE_FAILED",
        };
      }

      // 6. Send notification to user
      await this.sendRejectionNotification(
        activity.userId.toString(),
        contestCheck.contest?.name || "Cuộc thi",
        activity.distance,
        activity.startDate,
        reason,
      );

      return {
        success: true,
        message:
          "Đã từ chối hoạt động thành công. Tiến độ và BXH sẽ được cập nhật.",
      };
    } catch (error: any) {
      console.error("Error rejecting team activity:", error);
      return { success: false, message: "Lỗi hệ thống", error: error.message };
    }
  }

  /**
   * Restore a rejected activity (individual or team)
   */
  async restoreActivity(
    activityId: string,
    type: ActivityType,
    adminUserId: string,
  ): Promise<ModerationResult> {
    try {
      await this.ensureConnection();

      // 1. Get activity based on type
      let activity: any;
      if (type === "individual") {
        activity = await individualContestActivityData.findById(activityId);
        if (!activity) {
          activity =
            await individualContestActivityData.findByOriginalWorkoutId(
              activityId,
            );
        }
      } else {
        activity = await teamMemberActivityData.findById(activityId);
        if (!activity) {
          activity =
            await teamMemberActivityData.findByOriginalWorkoutId(activityId);
        }
      }
      if (!activity) {
        return {
          success: false,
          message: "Hoạt động không tồn tại",
          error: "ACTIVITY_NOT_FOUND",
        };
      }

      // 2. Check if not rejected
      if (activity.status !== "rejected") {
        return {
          success: false,
          message: "Hoạt động này không ở trạng thái bị từ chối",
          error: "NOT_REJECTED",
        };
      }

      // 3. Check contest is active
      const contestCheck = await this.isContestActive(
        activity.contestId.toString(),
      );
      if (!contestCheck.isActive) {
        return {
          success: false,
          message: contestCheck.message,
          error: `CONTEST_${contestCheck.status.toUpperCase()}`,
        };
      }

      // 4. Check admin permission
      const canModerate = await this.canModerateActivities(
        activity.contestId.toString(),
        adminUserId,
      );
      if (!canModerate) {
        return {
          success: false,
          message: "Bạn không có quyền thực hiện thao tác này",
          error: "UNAUTHORIZED",
        };
      }

      if (!activity._id) {
        return {
          success: false,
          message: "Lỗi dữ liệu: Không tìm thấy ID hoạt động",
          error: "INVALID_DATA",
        };
      }

      // 5. Restore the activity
      // Use the actual _id found from the database
      let success: boolean;
      if (type === "individual") {
        success = await individualContestActivityData.restoreActivity(
          activity._id,
        );
      } else {
        success = await teamMemberActivityData.restoreActivity(activity._id);
      }
      if (!success) {
        return {
          success: false,
          message: "Không thể khôi phục hoạt động",
          error: "UPDATE_FAILED",
        };
      }

      // 6. Send notification to user
      await this.sendRestoreNotification(
        activity.userId.toString(),
        contestCheck.contest?.name || "Cuộc thi",
        activity.distance,
        activity.startDate,
      );

      return {
        success: true,
        message:
          "Đã khôi phục hoạt động thành công. Tiến độ và BXH sẽ được cập nhật.",
      };
    } catch (error: any) {
      console.error("Error restoring activity:", error);
      return { success: false, message: "Lỗi hệ thống", error: error.message };
    }
  }

  /**
   * Get all rejected activities for a contest
   */
  async getRejectedActivities(
    contestId: string,
    adminUserId: string,
  ): Promise<{
    success: boolean;
    data?: RejectedActivitiesResult;
    message?: string;
    error?: string;
  }> {
    try {
      await this.ensureConnection();

      // Check admin permission
      const canModerate = await this.canModerateActivities(
        contestId,
        adminUserId,
      );
      if (!canModerate) {
        return {
          success: false,
          message: "Bạn không có quyền xem thông tin này",
          error: "UNAUTHORIZED",
        };
      }

      const contestObjectId = new ObjectId(contestId);

      // Get rejected activities
      const [individualRejected, teamRejected] = await Promise.all([
        individualContestActivityData.findRejectedByContestId(contestObjectId),
        teamMemberActivityData.findRejectedByContestId(contestObjectId),
      ]);

      // Enrich with user info
      const enrichedIndividual = await Promise.all(
        individualRejected.map(async (activity) => {
          const user = await userData.findById(activity.userId.toString());
          return {
            ...activity,
            user: user
              ? {
                  _id: user._id,
                  displayName:
                    user.displayName ||
                    user.stravaProfile?.firstname ||
                    user.username,
                  email: user.email,
                }
              : null,
          };
        }),
      );

      const enrichedTeam = await Promise.all(
        teamRejected.map(async (activity) => {
          const user = await userData.findById(activity.userId.toString());
          return {
            ...activity,
            user: user
              ? {
                  _id: user._id,
                  displayName:
                    user.displayName ||
                    user.stravaProfile?.firstname ||
                    user.username,
                  email: user.email,
                }
              : null,
          };
        }),
      );

      return {
        success: true,
        data: {
          individual: enrichedIndividual,
          team: enrichedTeam,
        },
      };
    } catch (error: any) {
      console.error("Error getting rejected activities:", error);
      return { success: false, message: "Lỗi hệ thống", error: error.message };
    }
  }

  /**
   * Send notification when activity is rejected
   */
  private async sendRejectionNotification(
    userId: string,
    contestName: string,
    distance: number,
    startDate: Date,
    reason: string,
  ): Promise<void> {
    try {
      const formattedDate = startDate.toLocaleDateString("vi-VN");
      const formattedDistance = (distance / 1000).toFixed(2);

      await notificationService.sendNotification(
        userId,
        "Hoạt động bị từ chối",
        `Hoạt động ${formattedDistance}km ngày ${formattedDate} trong cuộc thi "${contestName}" đã bị từ chối. Lý do: ${reason}`,
        NotificationType.ACTIVITY_REJECTED,
        { contestName, distance, startDate, reason },
      );
    } catch (error) {
      console.error("Error sending rejection notification:", error);
    }
  }

  /**
   * Send notification when activity is restored
   */
  private async sendRestoreNotification(
    userId: string,
    contestName: string,
    distance: number,
    startDate: Date,
  ): Promise<void> {
    try {
      const formattedDate = startDate.toLocaleDateString("vi-VN");
      const formattedDistance = (distance / 1000).toFixed(2);

      await notificationService.sendNotification(
        userId,
        "Hoạt động được khôi phục",
        `Hoạt động ${formattedDistance}km ngày ${formattedDate} trong cuộc thi "${contestName}" đã được khôi phục và sẽ được tính vào thành tích.`,
        NotificationType.ACTIVITY_RESTORED,
        { contestName, distance, startDate },
      );
    } catch (error) {
      console.error("Error sending restore notification:", error);
    }
  }
}

export const activityModerationService = new ActivityModerationService();
