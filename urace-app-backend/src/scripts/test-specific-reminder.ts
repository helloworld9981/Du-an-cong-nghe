import { ObjectId } from "mongodb";
import { userData } from "../data/user.data";
import { contestData } from "../data/contest.data";
import { workoutActivityData } from "../data/workout-activity.data";
import { contestProgressReminderData } from "../data/contest-progress-reminder.data";
import { contestProgressReminderService } from "../services/contest-progress-reminder.service";
import { individualContestActivityData } from "../data/individual-contest-activity.data";
import { contestService } from "../services/contest.service";
import config from "../config/env.config";
import dotenv from "dotenv";
import path from "path";

import { notificationService } from "../services/notification.service";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// Mock Notification Service removed for production testing
// If you encounter "FAILURE: No reminders found", ensure your Notification Service credentials/tokens are valid.

async function testSpecificReminder() {
  console.log("Connecting to DB...");
  await userData.connect(config.MONGODB_URI, config.DB_NAME);
  await contestData.connect(config.MONGODB_URI, config.DB_NAME);
  await workoutActivityData.connect(config.MONGODB_URI, config.DB_NAME);
  await contestProgressReminderData.connect(config.MONGODB_URI, config.DB_NAME);
  await individualContestActivityData.connect(
    config.MONGODB_URI,
    config.DB_NAME,
  );

  const contestIdStr = "6978d36847b360dc867d6627";
  const userIdStr = "691b257e1b2204dd5bf25c25";

  // Validate IDs
  if (!ObjectId.isValid(contestIdStr) || !ObjectId.isValid(userIdStr)) {
    console.error("Invalid ID format provided.");
    return;
  }

  const contestId = new ObjectId(contestIdStr);
  const userId = new ObjectId(userIdStr);

  console.log(`Fetching contest ${contestIdStr}...`);
  const contest = await contestData.findById(contestId);
  if (!contest) {
    console.error("Contest not found!");
    return;
  }
  console.log(
    `Contest found: ${contest.name}, minDistance: ${contest.minDistance}`,
  );
  console.log(`Milestones: ${contest.reminderMilestones}`);

  if (!contest.minDistance) {
    console.error("Contest has no minDistance.");
    return;
  }

  // Create a mock workout activity to trigger a milestone
  // Let's target the lowest milestone or just 50% if generic.
  const targetMilestone =
    contest.reminderMilestones && contest.reminderMilestones.length > 0
      ? contest.reminderMilestones.sort((a, b) => a - b)[0]
      : 25;

  console.log(`Debug Contest:`);
  console.log(`- StartAt: ${contest.startAt} (${typeof contest.startAt})`);
  console.log(`- EndAt: ${contest.endAt}`);
  console.log(`- MinDistance: ${contest.minDistance}`);
  console.log(`- Now: ${new Date()}`);

  if (
    new Date() < new Date(contest.startAt) ||
    new Date() > new Date(contest.endAt)
  ) {
    console.warn("WARNING: Contest is NOT active at this time!");
  }

  // Create activity that puts user JUST above the milestone + buffer
  // e.g. if milestone is 25%, target 26%.
  const targetDistance = (contest.minDistance * (targetMilestone + 1)) / 100;

  console.log(
    `Creating mock activity: ${targetDistance.toFixed(2)}km to trigger > ${targetMilestone}% milestone...`,
  );

  // For Time-Based check, we don't strictly need a NEW activity if the time has passed.
  // But strictly speaking, the user logic relies on "getUserProgress" to get distance stats
  // to populate the notification message (e.g. "You have run X km").
  // So having an activity is good.

  const mockActivity = {
    userId: userId,
    stravaUserId: "mock_strava_user",
    name: "Mock Activity for Stats",
    distance: targetDistance,
    movingTime: 3600,
    workoutType: "Run",
    pace: 5.0,
    startDate: new Date(), // Now
    stravaActivityId: `mock_${Date.now()}`,
    splitsMetric: [],
  };

  const workoutId = await workoutActivityData.create(mockActivity as any);
  const createdActivity = await workoutActivityData.findById(workoutId);
  if (createdActivity) {
    await contestService.processIndividualContestActivities(
      userId,
      createdActivity,
    );
  }

  console.log("Triggering Time-Based Reminder Check...");

  // Directly call the method that the Cron Job would call for this contest
  await contestProgressReminderService.processContestReminders(contest);

  console.log("Checking for Reminder record...");
  const reminders = await (contestProgressReminderData as any).collection
    ?.find({
      contestId: contestId,
      userId: userId,
    })
    .toArray();

  // Write results to file
  const debugOutput = {
    contest: {
      startAt: contest.startAt,
      endAt: contest.endAt,
      minDistance: contest.minDistance,
      milestones: contest.reminderMilestones,
    },
    now: new Date(),
    targetDistance,
    mockActivityId: workoutId,
    remindersFound: reminders,
  };

  require("fs").writeFileSync(
    path.resolve(__dirname, "debug_result.json"),
    JSON.stringify(debugOutput, null, 2),
  );

  if (reminders && reminders.length > 0) {
    console.log("SUCCESS: Reminders found");
  } else {
    console.log("FAILURE: No reminders found");
  }
}

testSpecificReminder()
  .then(() => {
    console.log("Done.");
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
