import * as cron from "node-cron";
import { contestProgressReminderService } from "../services/contest-progress-reminder.service";
import { createLogger } from "../utils/logger";

const logger = createLogger("ContestReminderWorker");

class ContestReminderWorker {
  private cronJob: cron.ScheduledTask | null = null;
  private isRunning: boolean = false;

  start(schedule: string = "0 * * * *"): void {
    if (this.cronJob) {
      logger.warn("Worker already running", "start");
      return;
    }

    if (!cron.validate(schedule)) {
      logger.error("Invalid cron expression", "start", { schedule });
      throw new Error("Invalid cron expression: " + schedule);
    }

    this.cronJob = cron.schedule(schedule, async () => {
      if (this.isRunning) {
        logger.warn("Previous job still running, skipping", "run");
        return;
      }

      this.isRunning = true;
      const startTime = Date.now();

      logger.info("Starting scheduled reminder check", "run");

      try {
        const result = await contestProgressReminderService.enqueueReminders();
        logger.info("Enqueued reminder jobs", "run", {
          enqueuedCount: result.enqueuedCount,
          durationMs: Date.now() - startTime,
        });
      } catch (error) {
        logger.error("Error enqueuing reminders", "run", { error });
      } finally {
        this.isRunning = false;
      }
    });

    logger.info("Contest reminder worker started", "start", {
      schedule,
    });
  }

  stop(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      this.isRunning = false;
      logger.info("Contest reminder worker stopped", "stop");
    }
  }

  async runManually(): Promise<void> {
    if (this.isRunning) {
      logger.warn("Job already running", "runManually");
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();

    logger.info("Running manual reminder enqueue", "runManually");

    try {
      const result = await contestProgressReminderService.enqueueReminders();

      const duration = Date.now() - startTime;
      logger.info("Completed manual reminder enqueue", "runManually", {
        enqueuedCount: result.enqueuedCount,
        durationMs: duration,
      });
    } catch (error) {
      logger.error("Error in manual reminder enqueue", "runManually", {
        error,
      });
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  isWorkerRunning(): boolean {
    return this.cronJob !== null;
  }

  isJobExecuting(): boolean {
    return this.isRunning;
  }
}

export const contestReminderWorker = new ContestReminderWorker();
