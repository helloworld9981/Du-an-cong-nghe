/**
 * Entry point to start the Reminder Queue Consumer as a standalone process
 *
 * Usage: npx ts-node src/workers/start-reminder-consumer.ts
 * Or: npm run start:reminder-consumer (if script is added to package.json)
 *
 * This script:
 * 1. Connects to MongoDB and Redis
 * 2. Starts the consumer to process reminder jobs from the queue
 * 3. Handles graceful shutdown on SIGINT/SIGTERM
 */

import { reminderQueueConsumer } from "./reminder-queue-consumer";
import { redisQueueService } from "../services/redis-queue.service";
import { contestData } from "../data/contest.data";
import { contestProgressReminderData } from "../data/contest-progress-reminder.data";
import { notificationData } from "../data/notification.data";
import { individualContestActivityData } from "../data/individual-contest-activity.data";
import config from "../config/env.config";
import { createLogger } from "../utils/logger";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const logger = createLogger("StartReminderConsumer");

async function main() {
  logger.info("Starting reminder queue consumer...", "main");

  try {
    // Connect to MongoDB collections needed by the consumer
    logger.info("Connecting to MongoDB...", "main");
    await contestData.connect(config.MONGODB_URI, config.DB_NAME);
    await contestProgressReminderData.connect(
      config.MONGODB_URI,
      config.DB_NAME,
    );
    await notificationData.connect(config.MONGODB_URI, config.DB_NAME);
    await individualContestActivityData.connect(
      config.MONGODB_URI,
      config.DB_NAME,
    );
    logger.info("Connected to MongoDB", "main");

    // Connect to Redis
    logger.info("Connecting to Redis...", "main");
    await redisQueueService.connect();
    logger.info("Connected to Redis", "main");

    // Start the consumer
    logger.info("Starting consumer...", "main");
    await reminderQueueConsumer.start();
  } catch (error) {
    logger.error("Failed to start reminder consumer", "main", { error });
    process.exit(1);
  }
}

// Graceful shutdown handlers
process.on("SIGINT", async () => {
  logger.info("Received SIGINT, shutting down gracefully...", "shutdown");
  await reminderQueueConsumer.stop();
  await redisQueueService.disconnect();
  logger.info("Shutdown complete", "shutdown");
  process.exit(0);
});

process.on("SIGTERM", async () => {
  logger.info("Received SIGTERM, shutting down gracefully...", "shutdown");
  await reminderQueueConsumer.stop();
  await redisQueueService.disconnect();
  logger.info("Shutdown complete", "shutdown");
  process.exit(0);
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception", "error", { error });
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled rejection", "error", { reason, promise });
  process.exit(1);
});

// Start the consumer
main();
