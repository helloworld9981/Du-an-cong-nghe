import { userData } from "../data/user.data";
import { workoutActivityService } from "../services/workout-activity.service";
import { contestService } from "../services/contest.service";
import { workoutActivityData } from "../data/workout-activity.data";
import { teamMemberActivityData } from "../data/team-member-activity.data";
import { individualContestActivityData } from "../data/individual-contest-activity.data";
import { groupMemberData } from "../data/group-member.data";
import { contestData } from "../data/contest.data";
import { teamData } from "../data/team.data";
import { eventData } from "../data/event.data";
import config from "../config/env.config";
import { createLogger } from "../utils/logger";
import { ObjectId } from "mongodb";

const logger = createLogger("ManualActivityScript");

async function main() {
  try {
    console.log("Connecting to database...");
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

    console.log("Connected to MongoDB");

    const targetEmail = process.env.TARGET_EMAIL;
    const targetStravaId = 193600119;
    let user;

    if (targetEmail) {
      user = await userData.findByEmail(targetEmail);
      if (user && !user.stravaId && targetStravaId) {
        console.log(
          `User ${user.username} has no Strava ID. Using provided TARGET_STRAVA_ID: ${targetStravaId}`,
        );
        user.stravaId = targetStravaId;
      }
    } else if (targetStravaId) {
      console.log(`Looking for user with Strava ID: ${targetStravaId}`);
      user = await userData.findByStravaId(targetStravaId);
    } else {
      const users = await userData.getAll();
      user = users.find((u) => u.stravaId);
    }

    if (!user) {
      console.error(
        "No user found. Please provide TARGET_EMAIL, TARGET_STRAVA_ID, or ensure at least one user is connected to Strava.",
      );
      process.exit(1);
    }

    // Use the stravaId from user object (which might be temporarily set from env)
    if (!user.stravaId) {
      console.error(
        `User ${user.username} does not have a connected Strava account (stravaId is missing) and no TARGET_STRAVA_ID provided.`,
      );
      process.exit(1);
    }

    console.log(
      `Creating activity for user: ${user.username} (${user.email}), Strava ID: ${user.stravaId}`,
    );

    // Create fake activity
    // Create fake activities for future dates (next 3 days)
    const daysToCreate = [0, 1, 2, 3]; // 1 day later, 2 days later, 3 days later

    for (const daysOffset of daysToCreate) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + daysOffset);
      // Set time to morning run (e.g., 7:00 AM)
      startDate.setHours(7, 0, 0, 0);

      const stravaActivityId = Math.floor(Math.random() * 1000000000);

      // Random distance between 3km and 8km
      const distance = 3 + Math.random() * 5;
      // Assume pace roughly 5-7 min/km
      const pace = 5 + Math.random() * 2;
      const movingTime = Math.floor(distance * pace * 60); // in seconds

      // Generate fake splits
      const splitsMetric = [];
      let remainingDistance = parseFloat(distance.toFixed(3)) * 1000; // to meters
      let splitCounter = 1;

      while (remainingDistance > 0) {
        const splitDist = remainingDistance >= 1000 ? 1000 : remainingDistance;
        const splitPace = pace + (Math.random() * 1 - 0.5); // vary pace slightly
        const splitTime = Math.floor((splitDist / 1000) * splitPace * 60);

        splitsMetric.push({
          distance: splitDist,
          elapsed_time: splitTime,
          elevation_difference: Math.floor(Math.random() * 20 - 5),
          moving_time: splitTime,
          split: splitCounter,
          average_speed: 1000 / (splitPace * 60),
          pace_zone: 0,
        });

        remainingDistance -= splitDist;
        splitCounter++;
      }

      const fakeActivity = {
        userId: user._id,
        stravaUserId: user.stravaId,
        name: `Future Run (+${daysOffset}d) - ${startDate.toLocaleDateString()}`,
        distance: parseFloat(distance.toFixed(2)),
        movingTime: movingTime,
        workoutType: "Run",
        pace: parseFloat(pace.toFixed(2)),
        startDate: startDate,
        stravaActivityId: stravaActivityId,
        startLatLng: [21.0285, 105.8542] as [number, number], // Hanoi coordinates
        endLatLng: [21.0285, 105.8542] as [number, number],

        // New fields
        elevationGain: Math.floor(Math.random() * 100),
        elevHigh: 50 + Math.floor(Math.random() * 50),
        elevLow: 10 + Math.floor(Math.random() * 20),
        splitsMetric: splitsMetric,
      };

      console.log(`Creating activity for date: ${startDate.toISOString()}`);
      const id = await workoutActivityService.createWorkout(fakeActivity);
      console.log(`Activity created with ID: ${id}`);

      const createdActivity = await workoutActivityService.getWorkoutById(id);

      if (createdActivity) {
        console.log("Processing contest activities...");
        // Trigger processing
        await contestService.processTeamMemberActivities(
          user._id,
          createdActivity,
        );
        await contestService.processIndividualContestActivities(
          user._id,
          createdActivity,
        );
        console.log("Done processing for this activity.");
      }
      console.log("---");
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    process.exit(0);
  }
}

main();
