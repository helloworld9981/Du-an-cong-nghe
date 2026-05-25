import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { userData } from "../data/user.data";
import { workoutActivityService } from "../services/workout-activity.service";
import { StravaSyncService } from "../services/strava-sync.service";
import { ObjectId } from "mongodb";
import { User } from "../models/user.model";
import { RecordTypes } from "../models/workout-activity.model";
import { workoutActivityData } from "../data/workout-activity.data";
import { contestService } from "../services/contest.service";

// Helper function to get user's display name
const getUserDisplayName = (user: User): string => {
  if (user.displayName) {
    return user.displayName;
  }

  if (user.stravaProfile?.firstname || user.stravaProfile?.lastname) {
    const firstName = user.stravaProfile.firstname || "";
    const lastName = user.stravaProfile.lastname || "";
    return `${firstName} ${lastName}`.trim();
  }

  return user.username;
};

export const getUserProfile = async (
  req: AuthRequest,
  res: Response,
): Promise<any> => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Return the user's profile information (excluding sensitive data)
    const userProfile = {
      _id: req.user._id,
      username: req.user.username,
      displayName: getUserDisplayName(req.user),
      email: req.user.email,
      bio: req.user.bio,
      height: req.user.height,
      weight: req.user.weight,
      stravaId: req.user.stravaId,
      stravaProfile: req.user.stravaProfile,
      mustChangePassword: req.user.mustChangePassword,
      createdAt: req.user.createdAt,
      updatedAt: req.user.updatedAt,
    };

    res.json(userProfile);
  } catch (error) {
    console.error("Get user profile error:", error);
    res
      .status(500)
      .json({ message: "Internal server error while fetching user profile" });
  }
};

export const updateUserProfile = async (
  req: AuthRequest,
  res: Response,
): Promise<any> => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const { displayName, email, bio, height, weight } = req.body;
    const userId = req.user._id;

    // Validate input
    if (displayName && typeof displayName !== "string") {
      return res.status(400).json({ message: "Display name must be a string" });
    }

    if (email && typeof email !== "string") {
      return res.status(400).json({ message: "Email must be a string" });
    }

    if (bio && typeof bio !== "string") {
      return res.status(400).json({ message: "Bio must be a string" });
    }

    if (height && typeof height !== "number") {
      return res.status(400).json({ message: "Height must be a number" });
    }

    if (weight && typeof weight !== "number") {
      return res.status(400).json({ message: "Weight must be a number" });
    }

    // Prepare update object (only include fields that were provided)
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (displayName !== undefined) updateData.displayName = displayName;
    if (email !== undefined) updateData.email = email;
    if (bio !== undefined) updateData.bio = bio;
    if (height !== undefined) updateData.height = height;
    if (weight !== undefined) updateData.weight = weight;

    // Update user
    const success = await userData.updateProfile(userId, updateData);

    if (!success) {
      return res
        .status(404)
        .json({ message: "User not found or update failed" });
    }

    // Get updated user profile
    const updatedUser = await userData.findById(userId.toString());
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found after update" });
    }

    // Return updated profile
    const userProfile = {
      _id: updatedUser._id,
      username: updatedUser.username,
      displayName: getUserDisplayName(updatedUser),
      email: updatedUser.email,
      bio: updatedUser.bio,
      height: updatedUser.height,
      weight: updatedUser.weight,
      stravaId: updatedUser.stravaId,
      stravaProfile: updatedUser.stravaProfile,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    };

    res.json(userProfile);
  } catch (error) {
    console.error("Update user profile error:", error);
    res
      .status(500)
      .json({ message: "Internal server error while updating user profile" });
  }
};

export const getUserById = async (
  req: AuthRequest,
  res: Response,
): Promise<any> => {
  try {
    const userId = req.params.id;

    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await userData.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Return public user information
    const publicUser = {
      _id: user._id,
      username: user.username,
      displayName: getUserDisplayName(user),
      email: user.email,
      bio: user.bio,
      stravaProfile: user.stravaProfile
        ? {
            firstname: user.stravaProfile.firstname,
            lastname: user.stravaProfile.lastname,
            username: user.stravaProfile.username,
          }
        : null,
      createdAt: user.createdAt,
    };

    res.json(publicUser);
  } catch (error) {
    console.error("Get user by ID error:", error);
    res
      .status(500)
      .json({ message: "Internal server error while fetching user" });
  }
};

export const getUserActivities = async (
  req: AuthRequest,
  res: Response,
): Promise<any> => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const userId = new ObjectId(req.user.userId);
    const activities = await workoutActivityService.getUserWorkouts(userId);

    // Sort activities by start date, most recent first
    const sortedActivities = activities.sort(
      (a, b) =>
        new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
    );

    res.json(sortedActivities);
  } catch (error) {
    console.error("Get user activities error:", error);
    res.status(500).json({
      message: "Internal server error while fetching user activities",
    });
  }
};

export const searchUsers = async (
  req: AuthRequest,
  res: Response,
): Promise<any> => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const query = req.query.query as string | undefined;
    let users;
    if (!query || query.trim().length === 0) {
      users = await userData.getAll();
    } else {
      users = await userData.searchByName(query.trim());
    }

    // Return public user information only
    const publicUsers = users.map((user) => ({
      _id: user._id,
      username: user.username,
      displayName: getUserDisplayName(user),
      email: user.email,
      bio: user.bio,
      stravaProfile: user.stravaProfile
        ? {
            firstname: user.stravaProfile.firstname,
            lastname: user.stravaProfile.lastname,
            username: user.stravaProfile.username,
          }
        : null,
      createdAt: user.createdAt,
    }));

    res.json(publicUsers);
  } catch (error) {
    console.error("Search users error:", error);
    res
      .status(500)
      .json({ message: "Internal server error while searching users" });
  }
};

export const syncStravaActivities = async (
  req: AuthRequest,
  res: Response,
): Promise<any> => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Check if user is connected to Strava
    if (!req.user.stravaId) {
      return res.status(400).json({
        message:
          "You must connect your Strava account before syncing activities",
      });
    }

    const userId = req.user._id;
    const stravaUserId = req.user.stravaId;

    // Perform the sync
    const result = await StravaSyncService.syncRecentActivities(
      userId,
      stravaUserId,
    );

    if (!result.success && result.errors.length > 0) {
      // Partial or complete failure
      return res.status(500).json({
        message: "Failed to sync activities from Strava",
        syncedCount: result.syncedCount,
        skippedCount: result.skippedCount,
        errors: result.errors,
        activities: result.activities,
      });
    }

    // Success
    return res.json({
      message: "Strava activities synced successfully",
      syncedCount: result.syncedCount,
      skippedCount: result.skippedCount,
      activities: result.activities,
    });
  } catch (error) {
    console.error("Sync Strava activities error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    // Check for specific error types
    if (errorMessage.includes("not connected to Strava")) {
      return res.status(400).json({
        message:
          "Your Strava connection has expired. Please reconnect your account.",
      });
    }

    res.status(500).json({
      message: "Internal server error while syncing Strava activities",
      error: errorMessage,
    });
  }
};

export const syncHealthConnectData = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    const result = await workoutActivityService.createHealthConnectActivity(
      userId,
      req.body,
    );

    res.status(201).json(result);
  } catch (error: any) {
    res.status(500).json({
      message: error.message || "Failed to sync Health Connect data",
    });
  }
};

export const createSystemActivity = async (
  req: AuthRequest,
  res: Response,
): Promise<any> => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }
    const userId = req.user._id;
    const {
  name,
  distance,
  movingTime,
  elapsedTime,
  startDate,
  workoutType,
  mapPolyline,
  routePoints,
  totalElevationGain,
  elevLow,
  elevHigh,
  splitsMetric,
} = req.body;
    if (!distance || distance <= 0) {
      return res
        .status(400)
        .json({ message: "Distance must be greater than 0" });
    }

    const pace = distance > 0 ? movingTime / 60 / distance : 0;
    const newActivity = {
  userId: userId,
  name: name || "App run",
  distance: Number(distance),
  movingTime: Number(movingTime),
  elapsedTime: Number(elapsedTime || movingTime),
  workoutType: workoutType || "Run",
  startDate: new Date(startDate || Date.now()),
  timezone: "Asia/Ho_Chi_Minh",
  mapPolyline: mapPolyline || "",

  routePoints: Array.isArray(routePoints) ? routePoints : [],

  pace: pace,
  recordType: RecordTypes.System,
  totalElevationGain: Number(totalElevationGain || 0),
  elevLow: Number(elevLow || 0),
  elevHigh: Number(elevHigh || 0),
  splitsMetric: splitsMetric || [],
};
    const activityId = await workoutActivityData.create(newActivity as any);
    const createdActivity = await workoutActivityData.findById(activityId);

    if (!createdActivity) {
      throw new Error("Failed to save activity to database");
    }

    await contestService.processIndividualContestActivities(
      userId,
      createdActivity,
    );

    await contestService.processTeamMemberActivities(userId, createdActivity);

    return res.status(201).json({
      message: "Activity saved and processed for contests successfully",
      activity: createdActivity,
    });
  } catch (error) {
    console.error("Create system activity error: ", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown",
    });
  }
};
