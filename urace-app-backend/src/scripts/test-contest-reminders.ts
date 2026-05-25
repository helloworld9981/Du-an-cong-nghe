/**
 * Manual script to test contest progress reminders
 * Run with: npx ts-node src/scripts/test-contest-reminders.ts
 */
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import config from "../config/env.config";
import { contestData } from "../data/contest.data";
import { individualContestActivityData } from "../data/individual-contest-activity.data";
import { notificationData } from "../data/notification.data";
import { contestProgressReminderData } from "../data/contest-progress-reminder.data";
import { contestProgressReminderService } from "../services/contest-progress-reminder.service";
import { createLogger } from "../utils/logger";

const logger = createLogger("TestContestReminders");

async function main() {
  try {
    logger.info("Connecting to databases...", "main");
    await contestData.connect(config.MONGODB_URI, config.DB_NAME);
    await individualContestActivityData.connect(
      config.MONGODB_URI,
      config.DB_NAME,
    );
    await notificationData.connect(config.MONGODB_URI, config.DB_NAME);
    await contestProgressReminderData.connect(
      config.MONGODB_URI,
      config.DB_NAME,
    );

    logger.info("Connected to databases", "main");

    const activeContests =
      await contestProgressReminderService.getActiveContests();
    logger.info("Active contests with minDistance:", "main", {
      count: activeContests.length,
      contests: activeContests.map((c) => ({
        id: c._id,
        name: c.name,
        minDistance: c.minDistance,
        startAt: c.startAt,
        endAt: c.endAt,
        participantCount: c.participantIds?.length || 0,
      })),
    });

    logger.info("Processing reminders...", "main");
    await contestProgressReminderService.processAllActiveContests();

    logger.info("Done!", "main");
    process.exit(0);
  } catch (error) {
    logger.error("Error:", "main", { error });
    process.exit(1);
  }
}

main();
