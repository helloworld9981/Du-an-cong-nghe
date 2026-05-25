import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import {
  activityModerationService,
  ActivityType,
} from "../services/activity-moderation.service";

/**
 * Reject an activity (mark as fraudulent)
 * POST /api/contests/:contestId/activities/:activityId/reject
 */
export async function rejectActivity(
  req: AuthRequest,
  res: Response,
): Promise<any> {
  try {
    const { contestId, activityId } = req.params;
    const { reason, type } = req.body as { reason: string; type: ActivityType };
    const adminUserId = req.user?.userId;

    // Validate input
    if (!adminUserId) {
      return res.status(401).json({
        success: false,
        error: "UNAUTHORIZED",
        message: "Vui lòng đăng nhập",
      });
    }

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "MISSING_REASON",
        message: "Vui lòng cung cấp lý do từ chối",
      });
    }

    // Call service based on type
    let result;
    const adminUserIdStr = adminUserId.toString();
    if (type === "individual") {
      result = await activityModerationService.rejectIndividualActivity(
        activityId,
        adminUserIdStr,
        reason.trim(),
      );
    } else {
      result = await activityModerationService.rejectTeamActivity(
        activityId,
        adminUserIdStr,
        reason.trim(),
      );
    }

    if (!result.success) {
      const statusCode =
        result.error === "UNAUTHORIZED"
          ? 403
          : result.error === "ACTIVITY_NOT_FOUND"
            ? 404
            : 400;
      return res.status(statusCode).json({
        success: false,
        error: result.error,
        message: result.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    console.error("Error in rejectActivity:", error);
    return res.status(500).json({
      success: false,
      error: "INTERNAL_ERROR",
      message: "Lỗi hệ thống",
    });
  }
}

/**
 * Restore a rejected activity
 * POST /api/contests/:contestId/activities/:activityId/restore
 */
export async function restoreActivity(
  req: AuthRequest,
  res: Response,
): Promise<any> {
  try {
    const { contestId, activityId } = req.params;
    const { type } = req.body as { type: ActivityType };
    const adminUserId = req.user?.userId;

    // Validate input
    if (!adminUserId) {
      return res.status(401).json({
        success: false,
        error: "UNAUTHORIZED",
        message: "Vui lòng đăng nhập",
      });
    }

    if (!type || !["individual", "team"].includes(type)) {
      return res.status(400).json({
        success: false,
        error: "INVALID_TYPE",
        message:
          "Loại hoạt động không hợp lệ. Phải là 'individual' hoặc 'team'",
      });
    }

    const result = await activityModerationService.restoreActivity(
      activityId,
      type,
      adminUserId.toString(),
    );

    if (!result.success) {
      const statusCode =
        result.error === "UNAUTHORIZED"
          ? 403
          : result.error === "ACTIVITY_NOT_FOUND"
            ? 404
            : 400;
      return res.status(statusCode).json({
        success: false,
        error: result.error,
        message: result.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    console.error("Error in restoreActivity:", error);
    return res.status(500).json({
      success: false,
      error: "INTERNAL_ERROR",
      message: "Lỗi hệ thống",
    });
  }
}

/**
 * Get all rejected activities for a contest
 * GET /api/contests/:contestId/rejected-activities
 */
export async function getRejectedActivities(
  req: AuthRequest,
  res: Response,
): Promise<any> {
  try {
    const { contestId } = req.params;
    const adminUserId = req.user?.userId;

    if (!adminUserId) {
      return res.status(401).json({
        success: false,
        error: "UNAUTHORIZED",
        message: "Vui lòng đăng nhập",
      });
    }

    const result = await activityModerationService.getRejectedActivities(
      contestId,
      adminUserId.toString(),
    );

    if (!result.success) {
      const statusCode = result.error === "UNAUTHORIZED" ? 403 : 400;
      return res.status(statusCode).json({
        success: false,
        error: result.error,
        message: result.message,
      });
    }

    return res.status(200).json({
      success: true,
      data: result.data,
    });
  } catch (error: any) {
    console.error("Error in getRejectedActivities:", error);
    return res.status(500).json({
      success: false,
      error: "INTERNAL_ERROR",
      message: "Lỗi hệ thống",
    });
  }
}
