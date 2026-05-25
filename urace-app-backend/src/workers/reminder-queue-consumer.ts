import {
  redisQueueService,
  RedisQueueService,
  QueueMessage,
} from "../services/redis-queue.service";
import { contestProgressReminderService } from "../services/contest-progress-reminder.service";
import { ReminderJob } from "../models/reminder-job.model";
import { createLogger } from "../utils/logger";

const logger = createLogger("ReminderQueueConsumer");
const MAX_ATTEMPTS = 3;

export class ReminderQueueConsumer {
  private isRunning: boolean = false;
  private shouldStop: boolean = false;
  private processDelay: number = 100; // 100ms delay between processing jobs (rate limiting)

  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn("Consumer is already running", "start");
      return;
    }

    this.isRunning = true;
    this.shouldStop = false;

    logger.info("Reminder queue consumer starting", "start", {
      maxAttempts: MAX_ATTEMPTS,
      processDelayMs: this.processDelay,
    });

    try {
      await this.processMessages();
    } catch (error) {
      logger.error("Error starting consumer", "start", { error });
      this.isRunning = false;
      throw error;
    }
  }

  async stop(): Promise<void> {
    logger.info("Stopping consumer", "stop");
    this.shouldStop = true;
  }

  private async processMessages(): Promise<void> {
    logger.info("Started processing messages", "processMessages");

    while (!this.shouldStop) {
      try {
        const message = await redisQueueService.popFromQueue(
          RedisQueueService.REMINDER_QUEUE,
          5,
        );

        if (!message) {
          continue;
        }

        logger.info("Processing reminder job", "processMessages", {
          messageId: message.id,
          contestId: message.data.contestId,
          userId: message.data.userId,
          milestone: message.data.milestone,
        });

        try {
          await this.processReminderJob(message.data);

          logger.info(
            "Reminder job processed successfully",
            "processMessages",
            {
              messageId: message.id,
            },
          );
          await this.delay(this.processDelay);
        } catch (error) {
          logger.error("Error processing reminder job", "processMessages", {
            messageId: message.id,
            error,
          });

          const attempts = (message.attempts || 0) + 1;

          if (attempts < MAX_ATTEMPTS) {
            const retryMessage: QueueMessage = {
              ...message,
              attempts,
            };

            await redisQueueService.pushToQueue(
              RedisQueueService.REMINDER_QUEUE,
              retryMessage.data,
              retryMessage.id,
            );

            logger.info("Reminder job requeued for retry", "processMessages", {
              messageId: message.id,
              attempt: attempts,
            });
          } else {
            await redisQueueService.pushToQueue(
              RedisQueueService.REMINDER_FAILED_QUEUE,
              message.data,
              message.id,
            );

            logger.error(
              "Reminder job moved to failed queue after max attempts",
              "processMessages",
              {
                messageId: message.id,
                attempts,
              },
            );
          }
        }
      } catch (error) {
        logger.error("Error in message processing loop", "processMessages", {
          error,
        });
        await this.delay(5000);
      }
    }

    logger.info("Stopped processing messages", "processMessages");
    this.isRunning = false;
  }

  private async processReminderJob(job: ReminderJob): Promise<void> {
    await contestProgressReminderService.processSingleReminderJob(job);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  isConsumerRunning(): boolean {
    return this.isRunning;
  }

  setProcessDelay(ms: number): void {
    this.processDelay = ms;
    logger.info("Process delay updated", "setProcessDelay", { delayMs: ms });
  }
}

export const reminderQueueConsumer = new ReminderQueueConsumer();
