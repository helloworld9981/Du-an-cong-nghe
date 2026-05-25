import { ObjectId } from "mongodb";
import { WorkoutActivity, RecordTypes } from "../models/workout-activity.model";
import { workoutActivityData } from "../data/workout-activity.data";
import { userData } from "../data/user.data";
import { createLogger } from "../utils/logger";

const logger = createLogger("WorkoutActivityService");

export class WorkoutActivityService {
  /**
   * Get a workout by ID
   */
  async getWorkoutById(id: ObjectId): Promise<WorkoutActivity | null> {
    return workoutActivityData.findById(id);
  }

  /**
   * Create a new workout activity
   */
  async createWorkout(
    workout: Omit<WorkoutActivity, "_id" | "createdAt" | "updatedAt">,
  ): Promise<ObjectId> {
    return workoutActivityData.create(workout);
  }

  /**
   * Create or update a workout activity from Health Connect data
   */
  async createHealthConnectActivity(
    userId: string,
    data: any,
  ): Promise<WorkoutActivity | null> {
    const userObjectId = new ObjectId(userId);

    const startDate = new Date(data.startDate || new Date());

    const day = String(startDate.getDate()).padStart(2, "0");
    const month = String(startDate.getMonth() + 1).padStart(2, "0");

    const syncDate =
      data.healthConnectSyncDate || startDate.toISOString().slice(0, 10);

    const distance = Number(data.distance || 0); // km
    const movingTime = Number(data.movingTime || 0); // seconds
    const steps = Number(data.steps || 0);
    const calories = Number(data.calories || 0);

    const pace =
      distance > 0 && movingTime > 0
        ? movingTime / 60 / distance
        : null;

    const name = data.name || `Health Connect (${day}/${month})`;

    const existingActivity =
      await workoutActivityData.findHealthConnectActivityByDate(
        userObjectId,
        syncDate,
      );

    const workoutActivityDataToSave: Partial<WorkoutActivity> = {
      userId: userObjectId,
      stravaUserId: 0,
      name,
      distance,
      movingTime,
      workoutType: data.workoutType || "Run",
      pace,
      startDate,
      stravaActivityId: undefined,
      recordType: RecordTypes.HealthConnect,
      healthConnectSyncDate: syncDate,
      steps,
      calories,
    } as any;

    if (existingActivity?._id) {
      await workoutActivityData.updateById(
        existingActivity._id,
        workoutActivityDataToSave,
      );

      return workoutActivityData.findById(existingActivity._id);
    }

    const activityId = await workoutActivityData.create(
      workoutActivityDataToSave as Omit<
        WorkoutActivity,
        "_id" | "createdAt" | "updatedAt"
      >,
    );

    return workoutActivityData.findById(activityId);
  }

  /**
   * Get activities by user ID
   */
  async getUserWorkouts(userId: ObjectId): Promise<WorkoutActivity[]> {
    return workoutActivityData.findByUserId(userId);
  }

  /**
   * Process a Strava activity for a user
   */
  async processStravaActivity(
    stravaUserId: number,
    activityData: any,
  ): Promise<WorkoutActivity | null> {
    const user = await userData.findByStravaId(stravaUserId);

    if (!user) {
      logger.error("No user found with Strava ID", "processStravaActivity", {
        stravaUserId,
      });
      return null;
    }

    const existingActivity = await workoutActivityData.findByStravaActivityId(
      activityData.id,
    );

    if (existingActivity) {
      logger.info(
        "Activity already exists, skipping",
        "processStravaActivity",
        { stravaActivityId: activityData.id },
      );
      return existingActivity;
    }

    const workoutActivity: Omit<
      WorkoutActivity,
      "_id" | "createdAt" | "updatedAt"
    > = {
      userId: user._id!,
      stravaUserId,
      distance: activityData.distance / 1000,
      movingTime: activityData.moving_time,
      workoutType: activityData.type,
      pace: activityData.moving_time / 60 / (activityData.distance / 1000),
      startDate: new Date(activityData.start_date),
      stravaActivityId: activityData.id,
      recordType: RecordTypes.Strava,
    };

    const activityId = await workoutActivityData.create(workoutActivity);

    return workoutActivityData.findById(activityId);
  }
}

export const workoutActivityService = new WorkoutActivityService();