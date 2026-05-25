import {
  redisQueueService,
  RedisQueueService,
  QueueMessage,
} from "../services/redis-queue.service";
import { redisService } from "../services/redis.service";
import { workoutActivityService } from "../services/workout-activity.service";
import { teamMemberActivityService } from "../services/team-member-activity.service";
import { userData } from "../data/user.data";
import { teamData } from "../data/team.data";
import { contestData } from "../data/contest.data";
import { workoutActivityData } from "../data/workout-activity.data";
import { teamMemberActivityData } from "../data/team-member-activity.data";
import { individualContestActivityData } from "../data/individual-contest-activity.data";
import { groupMemberData } from "../data/group-member.data";
import { eventData } from "../data/event.data";
import { StravaTokenService } from "../services/strava-token.service";
import { contestService } from "../services/contest.service";
import axios from "axios";
import { ObjectId } from "mongodb";
import dotenv from "dotenv";
import path from "path";
import config from "../config/env.config";
import { createLogger } from "../utils/logger";
import { RecordTypes } from "../models/workout-activity.model";

const logger = createLogger("ActivityWorker");

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// Max number of attempts before moving to failed queue
const MAX_ATTEMPTS = 3;

/**
 * ActivityWorker class that processes activity events from the Redis queue
 */
export class ActivityWorker {
  private isRunning: boolean = false;
  private shouldStop: boolean = false;

  /**
   * Start the worker
   */
  async start() {
    if (this.isRunning) {
      logger.warn("Worker is already running", "start");
      return;
    }

    this.isRunning = true;
    this.shouldStop = false;

    logger.info("Activity worker starting", "start", {
      maxAttempts: MAX_ATTEMPTS,
    });

    try {
      // Connect to MongoDB
      await userData.connect(config.MONGODB_URI, config.DB_NAME);
      await teamData.connect(config.MONGODB_URI, config.DB_NAME);
      await contestData.connect(config.MONGODB_URI, config.DB_NAME);
      await workoutActivityData.connect(config.MONGODB_URI, config.DB_NAME);
      await teamMemberActivityData.connect(config.MONGODB_URI, config.DB_NAME);
      await individualContestActivityData.connect(
        config.MONGODB_URI,
        config.DB_NAME,
      );
      await groupMemberData.connect(config.MONGODB_URI, config.DB_NAME);
      await eventData.connect(config.MONGODB_URI, config.DB_NAME);
      logger.info("Connected to MongoDB", "start");

      // Connect to Redis
      await redisQueueService.connect();
      await redisService.connect();
      logger.info("Connected to Redis queues", "start");

      // Start processing messages
      await this.processMessages();
    } catch (error) {
      logger.error("Error starting worker", "start", { error });
      this.isRunning = false;
      throw error;
    }
  }

  /**
   * Stop the worker
   */
  async stop() {
    logger.info("Stopping worker", "stop");
    this.shouldStop = true;

    // Disconnect from Redis
    await redisQueueService.disconnect();
    await redisService.disconnect();
    logger.info("Disconnected from Redis", "stop");
  }

  /**
   * Process messages from the queue
   */
  private async processMessages() {
    logger.info("Started processing messages", "processMessages");

    while (!this.shouldStop) {
      try {
        // Get next message from queue with a timeout of 5 seconds
        const message = await redisQueueService.popFromQueue(
          RedisQueueService.ACTIVITY_QUEUE,
          5,
        );

        if (!message) {
          // No message received, continue waiting
          continue;
        }

        logger.info("Processing message", "processMessages", {
          messageId: message.id,
          eventType: message.data.type,
        });

        // Update event status to Processing
        await eventData.updateEventStatus(
          new ObjectId(message.id),
          "Processing",
        );

        // Process based on event type and object type
        try {
          switch (message.data.type) {
            case "create":
              await this.handleActivityCreate(message.data.event);
              break;
            case "update":
              if (message.data.event.object_type === "athlete") {
                await this.handleAthleteUpdate(message.data.event);
              } else {
                await this.handleActivityUpdate(message.data.event);
              }
              break;
            case "delete":
              await this.handleActivityDelete(message.data.event);
              break;
            default:
              logger.warn("Unknown event type", "processMessages", {
                eventType: message.data.type,
                messageId: message.id,
              });
          }

          // Message processed successfully, update status to Successful
          await eventData.updateEventStatus(
            new ObjectId(message.id),
            "Successful",
          );
        } catch (error) {
          logger.error("Error processing message", "processMessages", {
            messageId: message.id,
            error,
          });

          // Increment attempts counter
          await eventData.incrementAttempts(new ObjectId(message.id));

          // Get current event to check attempts
          const event = await eventData.findById(new ObjectId(message.id));
          const attempts = event?.attempts || 0;

          if (attempts < MAX_ATTEMPTS) {
            // Put back in the queue for retry
            await redisQueueService.pushToQueue(
              RedisQueueService.ACTIVITY_QUEUE,
              message.data,
              message.id,
            );
            logger.info("Message requeued for retry", "processMessages", {
              messageId: message.id,
              attempt: attempts,
            });
          } else {
            await redisQueueService.pushToQueue(
              RedisQueueService.FAILED_QUEUE,
              message.data,
              message.id,
            );
            // Update status to Failed after max attempts
            await eventData.updateEventStatus(
              new ObjectId(message.id),
              "Failed",
              error instanceof Error ? error.message : "Unknown error",
            );
            logger.error(
              "Message marked as failed after max attempts",
              "processMessages",
              { messageId: message.id, attempts },
            );
          }
        }
      } catch (error) {
        logger.error("Error in message processing loop", "processMessages", {
          error,
        });
        // Sleep for a bit to avoid hammering Redis with errors
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }

    logger.info("Stopped processing messages", "processMessages");
    this.isRunning = false;
  }

  /**
   * Handle an activity create event
   */
  private async handleActivityCreate(event: any) {
    if (event.object_type !== "activity") return;

    // Check if activity already exists
    const exists = await workoutActivityData.existsByStravaActivityId(
      event.object_id,
    );
    if (exists) {
      logger.info(
        "Activity already exists, skipping creation",
        "handleActivityCreate",
        { activityId: event.object_id },
      );
      return;
    }

    // Find user in our system by Strava ID
    const user = await userData.findByStravaId(event.owner_id);
    if (!user) {
      logger.warn(
        "User not found for Strava ID in create activity",
        "handleActivityCreate",
        { stravaUserId: event.owner_id },
      );
      throw new Error("User not found");
    }

    // Get valid access token using StravaTokenService
    const accessToken = await StravaTokenService.getValidAccessToken(
      event.owner_id,
    );

    // Fetch detailed activity data from Strava
    const response = await axios.get(
      `https://www.strava.com/api/v3/activities/${event.object_id}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    const stravaActivity = response.data;

    // Transform Strava data to your model
    if (!user._id) {
      throw new Error("User ID is undefined");
    }

    const activity = {
      userId: user._id,
      stravaUserId: event.owner_id,
      name: stravaActivity.name,
      distance: stravaActivity.distance / 1000, // convert to km
      movingTime: stravaActivity.moving_time,
      workoutType: stravaActivity.type,
      pace: this.calculatePace(
        stravaActivity.distance,
        stravaActivity.moving_time,
      ),
      startDate: new Date(stravaActivity.start_date),
      stravaActivityId: event.object_id,
      startLatLng: stravaActivity.start_latlng || null,
      endLatLng: stravaActivity.end_latlng || null,
      elevationGain: stravaActivity.total_elevation_gain,
      elevHigh: stravaActivity.elev_high,
      elevLow: stravaActivity.elev_low,
      splitsMetric: stravaActivity.splits_metric,
      recordType: RecordTypes.Strava,
    };

    // Create workout activity
    const workoutId = await workoutActivityService.createWorkout(activity);
    const createdActivity =
      await workoutActivityService.getWorkoutById(workoutId);

    if (!createdActivity) {
      logger.error(
        "Failed to create workout activity",
        "handleActivityCreate",
        { activityId: event.object_id },
      );
      throw new Error("Failed to create workout activity");
    }

    logger.info("Activity created successfully", "handleActivityCreate", {
      activityId: event.object_id,
    });

    await contestService.processTeamMemberActivities(user._id, createdActivity);

    // Process individual contest activities
    await contestService.processIndividualContestActivities(
      user._id,
      createdActivity,
    );
  }

  /**
   * Handle an activity update event
   */
  private async handleActivityUpdate(event: any) {
    if (event.object_type !== "activity") return;

    // Find user in our system by Strava ID
    const user = await userData.findByStravaId(event.owner_id);
    if (!user) {
      logger.warn(
        "User not found for Strava ID in update activity",
        "handleActivityUpdate",
        { stravaUserId: event.owner_id },
      );
      throw new Error("User not found");
    }

    // Get valid access token using StravaTokenService
    const accessToken = await StravaTokenService.getValidAccessToken(
      event.owner_id,
    );

    // Fetch detailed activity data from Strava
    const response = await axios.get(
      `https://www.strava.com/api/v3/activities/${event.object_id}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    const stravaActivity = response.data;

    // Transform Strava data to update model
    const update = {
      name: stravaActivity.name,
      distance: stravaActivity.distance / 1000, // convert to km
      movingTime: stravaActivity.moving_time,
      workoutType: stravaActivity.type,
      pace: this.calculatePace(
        stravaActivity.distance,
        stravaActivity.moving_time,
      ),
      startDate: new Date(stravaActivity.start_date),
      startLatLng: stravaActivity.start_latlng || null,
      endLatLng: stravaActivity.end_latlng || null,

      // New fields
      elevationGain: stravaActivity.total_elevation_gain,
      elevHigh: stravaActivity.elev_high,
      elevLow: stravaActivity.elev_low,
      splitsMetric: stravaActivity.splits_metric,
    };

    const success = await workoutActivityData.updateByStravaActivityId(
      event.object_id,
      update,
    );
    if (success) {
      logger.info("Activity updated successfully", "handleActivityUpdate", {
        activityId: event.object_id,
      });

      // Get the updated workout activity
      const updatedActivity = await workoutActivityData.findByStravaActivityId(
        event.object_id,
      );
      if (updatedActivity && updatedActivity._id) {
        // Delete existing team member activities for this workout
        await teamMemberActivityData.deleteByWorkoutActivityId(
          updatedActivity._id,
        );
        logger.info(
          "Deleted existing team member activities for updated workout",
          "handleActivityUpdate",
          { activityId: event.object_id },
        );

        // Delete existing individual contest activities for this workout
        await individualContestActivityData.deleteByWorkoutActivityId(
          updatedActivity._id,
        );
        logger.info(
          "Deleted existing individual contest activities for updated workout",
          "handleActivityUpdate",
          { activityId: event.object_id },
        );

        // Recreate team member activities with updated data
        await contestService.processTeamMemberActivities(
          user._id,
          updatedActivity,
        );

        // Recreate individual contest activities with updated data
        await contestService.processIndividualContestActivities(
          user._id,
          updatedActivity,
        );
      }
    } else {
      logger.error("Failed to update activity", "handleActivityUpdate", {
        activityId: event.object_id,
      });
      throw new Error("Failed to update activity");
    }
  }

  /**
   * Handle an activity delete event
   */
  private async handleActivityDelete(event: any) {
    if (event.object_type !== "activity") return;

    // Find the workout activity first to get its ID for deleting related data
    const workoutActivity = await workoutActivityData.findByStravaActivityId(
      event.object_id,
    );

    if (workoutActivity && workoutActivity._id) {
      // Delete related team member activities
      const teamMemberDeleteCount =
        await teamMemberActivityData.deleteByWorkoutActivityId(
          workoutActivity._id,
        );
      logger.info(
        `Deleted ${teamMemberDeleteCount} team member activities for workout ${workoutActivity._id}`,
        "handleActivityDelete",
      );

      // Delete related individual contest activities
      const individualDeleteCount =
        await individualContestActivityData.deleteByWorkoutActivityId(
          workoutActivity._id,
        );
      logger.info(
        `Deleted ${individualDeleteCount} individual contest activities for workout ${workoutActivity._id}`,
        "handleActivityDelete",
      );
    }

    const success = await workoutActivityData.deleteByStravaActivityId(
      event.object_id,
    );
    if (success) {
      logger.info("Activity deleted successfully", "handleActivityDelete", {
        activityId: event.object_id,
      });
    } else {
      logger.error("Failed to delete activity", "handleActivityDelete", {
        activityId: event.object_id,
      });
      throw new Error("Failed to delete activity");
    }
  }

  /**
   * Handle an athlete update event (e.g., authorization revocation)
   */
  private async handleAthleteUpdate(event: any) {
    if (event.object_type !== "athlete") return;

    logger.info("Processing athlete update event", "handleAthleteUpdate", {
      athleteId: event.owner_id,
      updates: event.updates,
    });

    // Check if this is an authorization revocation
    if (event.updates?.authorized === "false") {
      await this.handleAuthorizationRevocation(event);
    } else {
      logger.info(
        "Athlete update event not related to authorization",
        "handleAthleteUpdate",
        {
          athleteId: event.owner_id,
          updates: event.updates,
        },
      );
    }
  }

  /**
   * Handle Strava authorization revocation
   */
  private async handleAuthorizationRevocation(event: any) {
    const athleteId = event.owner_id;

    logger.info(
      "Processing authorization revocation",
      "handleAuthorizationRevocation",
      { athleteId },
    );

    try {
      // Find user by Strava ID
      const user = await userData.findByStravaId(athleteId);
      if (!user) {
        logger.warn(
          "User not found for Strava ID during authorization revocation",
          "handleAuthorizationRevocation",
          {
            stravaUserId: athleteId,
          },
        );
        return;
      }

      if (!user._id) {
        logger.error(
          "User ID is undefined during authorization revocation",
          "handleAuthorizationRevocation",
          {
            stravaUserId: athleteId,
          },
        );
        return;
      }

      // Clear Strava tokens and profile from user record
      await userData.updateProfile(user._id, {
        accessToken: null,
        refreshToken: null,
        expiresAt: null,
        stravaId: null,
        stravaProfile: null,
      });

      // Clear cached team data for this user since Strava disconnection affects team activities
      await redisService.deleteUserTeamsCache(user._id);

      logger.info(
        "Successfully processed authorization revocation",
        "handleAuthorizationRevocation",
        {
          athleteId,
          userId: user._id,
        },
      );
    } catch (error) {
      logger.error(
        "Error processing authorization revocation",
        "handleAuthorizationRevocation",
        {
          athleteId,
          error,
        },
      );
      throw error;
    }
  }

  /**
   * Calculate pace from distance and moving time
   */
  private calculatePace(distance: number, movingTime: number): number | null {
    // Return null for activities with zero distance (e.g., Weight Training, Yoga)
    if (distance === 0) {
      return null;
    }
    // Convert to minutes per kilometer
    return movingTime / 60 / (distance / 1000);
  }
}

// Export singleton
export const activityWorker = new ActivityWorker();
