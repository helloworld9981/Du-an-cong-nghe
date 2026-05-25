import axios from "axios";
import { ObjectId } from "mongodb";
import { StravaTokenService } from "./strava-token.service";
import { workoutActivityService } from "./workout-activity.service";
import { workoutActivityData } from "../data/workout-activity.data";
import { contestService } from "./contest.service";
import { createLogger } from "../utils/logger";
import { RecordTypes } from "../models/workout-activity.model";

const logger = createLogger("StravaSyncService");

export interface SyncResult {
  success: boolean;
  syncedCount: number;
  skippedCount: number;
  errors: string[];
  activities?: {
    synced: Array<{ name: string; date: Date; type: string }>;
    skipped: Array<{ name: string; date: Date; reason: string }>;
  };
}

export class StravaSyncService {
  /**
   * Manually sync user's Strava activities from the last 48 hours
   * @param userId User's MongoDB ID
   * @param stravaUserId User's Strava athlete ID
   * @returns Sync result with counts and details
   */
  static async syncRecentActivities(
    userId: ObjectId,
    stravaUserId: number,
  ): Promise<SyncResult> {
    const result: SyncResult = {
      success: false,
      syncedCount: 0,
      skippedCount: 0,
      errors: [],
      activities: {
        synced: [],
        skipped: [],
      },
    };

    try {
      logger.info("Starting manual sync for user", "syncRecentActivities", {
        userId: userId.toString(),
        stravaUserId,
      });

      // Calculate 48-hour window
      const now = Math.floor(Date.now() / 1000); // Unix timestamp
      const fortyEightHoursAgo = now - 48 * 60 * 60;

      // Get valid access token (auto-refreshes if expired)
      const accessToken =
        await StravaTokenService.getValidAccessToken(stravaUserId);

      // Fetch activities from Strava API
      // https://developers.strava.com/docs/reference/#api-Activities-getLoggedInAthleteActivities
      const response = await axios.get(
        "https://www.strava.com/api/v3/athlete/activities",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          params: {
            after: fortyEightHoursAgo,
            per_page: 200, // Max allowed by Strava API
          },
        },
      );

      const activities = response.data;

      logger.info("Fetched activities from Strava", "syncRecentActivities", {
        userId: userId.toString(),
        count: activities.length,
      });

      // Process each activity
      for (const stravaActivity of activities) {
        try {
          // Check if activity already exists
          const exists = await workoutActivityData.existsByStravaActivityId(
            stravaActivity.id,
          );

          if (exists) {
            logger.info(
              "Activity already exists, skipping",
              "syncRecentActivities",
              {
                activityId: stravaActivity.id,
                name: stravaActivity.name,
              },
            );
            result.skippedCount++;
            result.activities?.skipped.push({
              name: stravaActivity.name,
              date: new Date(stravaActivity.start_date),
              reason: "Already synced",
            });
            continue;
          }

          // Transform Strava data to internal model
          const activity = {
            userId: userId,
            stravaUserId: stravaUserId,
            name: stravaActivity.name,
            distance: stravaActivity.distance / 1000, // convert to km
            movingTime: stravaActivity.moving_time,
            workoutType: stravaActivity.type,
            pace: this.calculatePace(
              stravaActivity.distance,
              stravaActivity.moving_time,
            ),
            startDate: new Date(stravaActivity.start_date),
            stravaActivityId: stravaActivity.id,
            startLatLng: stravaActivity.start_latlng || null,
            endLatLng: stravaActivity.end_latlng || null,
            elevationGain: stravaActivity.total_elevation_gain,
            elevHigh: stravaActivity.elev_high,
            elevLow: stravaActivity.elev_low,
            splitsMetric: stravaActivity.splits_metric,
            recordType: RecordTypes.Strava,
          };

          // Create workout activity
          const workoutId =
            await workoutActivityService.createWorkout(activity);
          const createdActivity =
            await workoutActivityService.getWorkoutById(workoutId);

          if (!createdActivity) {
            throw new Error("Failed to create workout activity");
          }

          logger.info("Activity synced successfully", "syncRecentActivities", {
            activityId: stravaActivity.id,
            name: stravaActivity.name,
          });

          result.syncedCount++;
          result.activities?.synced.push({
            name: stravaActivity.name,
            date: new Date(stravaActivity.start_date),
            type: stravaActivity.type,
          });

          // Process contest activities
          await contestService.processTeamMemberActivities(
            userId,
            createdActivity,
          );
          await contestService.processIndividualContestActivities(
            userId,
            createdActivity,
          );
        } catch (activityError) {
          const errorMsg =
            activityError instanceof Error
              ? activityError.message
              : "Unknown error";
          logger.error(
            "Error syncing individual activity",
            "syncRecentActivities",
            {
              activityId: stravaActivity.id,
              error: errorMsg,
            },
          );
          result.errors.push(
            `Failed to sync "${stravaActivity.name}": ${errorMsg}`,
          );
        }
      }

      result.success = result.errors.length === 0 || result.syncedCount > 0;

      logger.info("Manual sync completed", "syncRecentActivities", {
        userId: userId.toString(),
        syncedCount: result.syncedCount,
        skippedCount: result.skippedCount,
        errorCount: result.errors.length,
      });

      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      logger.error("Error during manual sync", "syncRecentActivities", {
        userId: userId.toString(),
        error: errorMsg,
      });

      result.success = false;
      result.errors.push(errorMsg);
      return result;
    }
  }

  /**
   * Calculate pace from distance and moving time
   * @param distance Distance in meters
   * @param movingTime Moving time in seconds
   * @returns Pace in minutes per kilometer, or null for zero-distance activities
   */
  private static calculatePace(
    distance: number,
    movingTime: number,
  ): number | null {
    // Return null for activities with zero distance (e.g., Weight Training, Yoga)
    if (distance === 0) {
      return null;
    }
    // Convert to minutes per kilometer
    return movingTime / 60 / (distance / 1000);
  }
}
