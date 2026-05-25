import { ObjectId } from "mongodb";
import { Contest } from "../models/contest.model";
import {
  MilestoneType,
  ProgressStatus,
} from "../models/contest-progress-reminder.model";
import { NotificationType } from "../models/notification.model";
import { contestData } from "../data/contest.data";
import { individualContestActivityData } from "../data/individual-contest-activity.data";
import { contestProgressReminderData } from "../data/contest-progress-reminder.data";
import { notificationService } from "./notification.service";
import {
  CONTEST_NOTIFICATION_MESSAGES,
  formatNotificationMessage,
} from "../config/contest-notification-messages";
import { createLogger } from "../utils/logger";
import { RedisQueueService, redisQueueService } from "./redis-queue.service";
import { ReminderJob } from "../models/reminder-job.model";

const logger = createLogger("ContestProgressReminderService");

class ContestProgressReminderService {
  async getActiveContests(): Promise<Contest[]> {
    const now = new Date();
    const allContests = await contestData.getAll();

    return allContests.filter((contest) => {
      if (!contest.minDistance || contest.minDistance <= 0) {
        return false;
      }
      const startAt = new Date(contest.startAt);
      const endAt = new Date(contest.endAt);

      return startAt <= now && now <= endAt;
    });
  }

  calculateTimeProgress(contest: Contest): number {
    const now = new Date();
    const startAt = new Date(contest.startAt);
    const endAt = new Date(contest.endAt);

    const totalDuration = endAt.getTime() - startAt.getTime();
    const elapsed = now.getTime() - startAt.getTime();

    if (totalDuration <= 0) return 100;

    return (elapsed / totalDuration) * 100;
  }

  getCurrentMilestone(
    timeProgress: number,
    milestones: number[],
  ): MilestoneType | null {
    const sortedMilestones = [...milestones].sort((a, b) => a - b);
    for (let i = sortedMilestones.length - 1; i >= 0; i--) {
      if (timeProgress >= sortedMilestones[i]) {
        return sortedMilestones[i];
      }
    }
    return null;
  }

  getReachedMilestones(
    timeProgress: number,
    milestones: number[],
  ): MilestoneType[] {
    return milestones.filter((m) => timeProgress >= m);
  }

  async getUserProgress(
    contestId: ObjectId,
    userId: ObjectId,
    minDistance: number,
  ): Promise<{ distance: number; percent: number }> {
    const stats = await individualContestActivityData.getIndividualStats(
      contestId,
      userId,
    );

    const distance = stats.totalDistance;
    const percent = minDistance > 0 ? (distance / minDistance) * 100 : 0;

    return { distance, percent };
  }

  determineStatus(
    progressPercent: number,
    milestone: MilestoneType,
  ): ProgressStatus {
    if (progressPercent >= 100) {
      return "completed";
    }

    if (progressPercent >= milestone) {
      return "on_track";
    }

    return "behind";
  }

  getNotificationType(status: ProgressStatus): NotificationType {
    switch (status) {
      case "behind":
        return NotificationType.CONTEST_PROGRESS_BEHIND;
      case "on_track":
        return NotificationType.CONTEST_PROGRESS_ON_TRACK;
      case "completed":
        return NotificationType.CONTEST_PROGRESS_COMPLETED;
    }
  }

  async processParticipantReminder(
    contest: Contest,
    userId: ObjectId,
    milestone: MilestoneType,
  ): Promise<void> {
    const contestId = contest._id!;
    const minDistance = contest.minDistance!;

    const { distance, percent } = await this.getUserProgress(
      contestId,
      userId,
      minDistance,
    );

    const status = this.determineStatus(percent, milestone);
    if (status === "completed") {
      const alreadyCompleted =
        await contestProgressReminderData.hasCompletionNotificationBeenSent(
          contestId,
          userId,
        );

      if (alreadyCompleted) {
        logger.debug(
          "User already received completion notification, skipping",
          "processParticipantReminder",
          { contestId, userId, milestone },
        );
        return;
      }

      await this.sendNotification(contest, userId, milestone, status, distance);
      await contestProgressReminderData.create({
        contestId,
        userId,
        milestone,
        status,
        progressPercent: percent,
        distanceAtTime: distance,
        targetDistance: minDistance,
        isCompletionNotification: true,
        notifiedAt: new Date(),
      });

      logger.info(
        "Sent completion notification",
        "processParticipantReminder",
        {
          contestId,
          userId,
          distance,
          percent,
        },
      );

      return;
    }

    const alreadySent = await contestProgressReminderData.hasReminderBeenSent(
      contestId,
      userId,
      milestone,
    );

    if (alreadySent) {
      logger.debug(
        "Reminder already sent for this milestone",
        "processParticipantReminder",
        { contestId, userId, milestone },
      );
      return;
    }

    await this.sendNotification(contest, userId, milestone, status, distance);
    await contestProgressReminderData.create({
      contestId,
      userId,
      milestone,
      status,
      progressPercent: percent,
      distanceAtTime: distance,
      targetDistance: minDistance,
      isCompletionNotification: false,
      notifiedAt: new Date(),
    });

    logger.info("Sent progress notification", "processParticipantReminder", {
      contestId,
      userId,
      milestone,
      status,
      distance,
      percent,
    });
  }

  async sendNotification(
    contest: Contest,
    userId: ObjectId,
    milestone: MilestoneType,
    status: ProgressStatus,
    currentDistance: number,
  ): Promise<void> {
    const template =
      CONTEST_NOTIFICATION_MESSAGES[milestone] &&
      CONTEST_NOTIFICATION_MESSAGES[milestone][status]
        ? CONTEST_NOTIFICATION_MESSAGES[milestone][status]
        : CONTEST_NOTIFICATION_MESSAGES["DEFAULT"][status];
    const minDistance = contest.minDistance!;
    const expectedDistance = (milestone / 100) * minDistance;
    const remaining = minDistance - currentDistance;

    const { title, message } = formatNotificationMessage(template, {
      contest: contest.name,
      current: currentDistance,
      target: minDistance,
      expected: expectedDistance,
      remaining: remaining,
      milestone: milestone,
    });

    const notificationType = this.getNotificationType(status);

    await notificationService.sendNotification(
      userId.toString(),
      title,
      message,
      notificationType,
      {
        contestId: contest._id?.toString(),
        contestName: contest.name,
        milestone,
        status,
        currentDistance,
        targetDistance: minDistance,
      },
    );
  }

  async processContestReminders(contest: Contest): Promise<void> {
    const contestId = contest._id!;

    const timeProgress = this.calculateTimeProgress(contest);

    const milestones = (contest.reminderMilestones || [25, 50, 75]).sort(
      (a, b) => a - b,
    );

    const reachedMilestones = this.getReachedMilestones(
      timeProgress,
      milestones,
    );

    if (reachedMilestones.length === 0) {
      logger.debug("No milestones reached yet", "processContestReminders", {
        contestId,
        timeProgress,
      });
      return;
    }

    logger.info("Processing contest reminders", "processContestReminders", {
      contestId,
      contestName: contest.name,
      timeProgress,
      reachedMilestones,
    });

    let participantIds: ObjectId[] = [];

    if (contest.contestType === "Individual") {
      participantIds = contest.participantIds || [];
    } else if (contest.contestType === "Team") {
      logger.debug("Skipping team contest", "processContestReminders", {
        contestId,
      });
      return;
    }

    if (participantIds.length === 0) {
      logger.debug("No participants in contest", "processContestReminders", {
        contestId,
      });
      return;
    }

    for (const userId of participantIds) {
      for (const milestone of reachedMilestones) {
        try {
          await this.processParticipantReminder(contest, userId, milestone);
        } catch (error) {
          logger.error(
            "Error processing participant reminder",
            "processContestReminders",
            {
              contestId,
              userId,
              milestone,
              error,
            },
          );
        }
      }
    }
  }

  async processAllActiveContests(): Promise<void> {
    logger.info(
      "Starting to process all active contests",
      "processAllActiveContests",
    );

    try {
      const activeContests = await this.getActiveContests();

      logger.info("Found active contests", "processAllActiveContests", {
        count: activeContests.length,
      });

      for (const contest of activeContests) {
        try {
          await this.processContestReminders(contest);
        } catch (error) {
          logger.error(
            "Error processing contest reminders",
            "processAllActiveContests",
            {
              contestId: contest._id,
              contestName: contest.name,
              error,
            },
          );
        }
      }

      logger.info(
        "Finished processing all active contests",
        "processAllActiveContests",
        {
          processedCount: activeContests.length,
        },
      );
    } catch (error) {
      logger.error(
        "Error in processAllActiveContests",
        "processAllActiveContests",
        { error },
      );
      throw error;
    }
  }

  async enqueueReminders(): Promise<{ enqueuedCount: number }> {
    logger.info("Starting to enqueue reminders", "enqueueReminders");

    const contests = await this.getActiveContests();
    let enqueuedCount = 0;
    let skippedCount = 0;

    logger.info("Found active contests", "enqueueReminders", {
      count: contests.length,
    });

    for (const contest of contests) {
      const contestId = contest._id;
      if (!contestId) continue;

      if (contest.contestType === "Team") {
        logger.debug("Skipping team contest", "enqueueReminders", {
          contestId,
        });
        continue;
      }

      const timeProgress = this.calculateTimeProgress(contest);
      const contestMilestones = (
        contest.reminderMilestones || [25, 50, 75]
      ).sort((a, b) => a - b);
      const milestones = this.getReachedMilestones(
        timeProgress,
        contestMilestones,
      );

      if (milestones.length === 0) {
        logger.debug("No milestones reached yet", "enqueueReminders", {
          contestId,
          timeProgress,
        });
        continue;
      }

      const participantIds = contest.participantIds || [];

      for (const userId of participantIds) {
        for (const milestone of milestones) {
          const alreadySent =
            await contestProgressReminderData.hasReminderBeenSent(
              contestId,
              userId,
              milestone,
            );

          if (alreadySent) {
            skippedCount++;
            continue;
          }

          const completionSent =
            await contestProgressReminderData.hasCompletionNotificationBeenSent(
              contestId,
              userId,
            );

          if (completionSent) {
            skippedCount++;
            continue;
          }

          const jobData: ReminderJob = {
            contestId: contestId.toString(),
            contestName: contest.name,
            userId: userId.toString(),
            milestone: milestone,
            minDistance: contest.minDistance!,
            startAt: contest.startAt.toISOString(),
            endAt: contest.endAt.toISOString(),
          };

          const jobId = `${contestId}-${userId}-${milestone}`;
          await redisQueueService.pushToQueue(
            RedisQueueService.REMINDER_QUEUE,
            jobData,
            jobId,
          );

          enqueuedCount++;
        }
      }
    }

    logger.info("Finished enqueuing reminders", "enqueueReminders", {
      enqueuedCount,
      skippedCount,
    });

    return { enqueuedCount };
  }

  async processSingleReminderJob(job: ReminderJob): Promise<void> {
    logger.info("Processing single reminder job", "processSingleReminderJob", {
      contestId: job.contestId,
      userId: job.userId,
      milestone: job.milestone,
    });

    const contest = await contestData.findById(new ObjectId(job.contestId));
    if (!contest) {
      logger.warn("Contest not found", "processSingleReminderJob", {
        contestId: job.contestId,
      });
      return;
    }

    await this.processParticipantReminder(
      contest,
      new ObjectId(job.userId),
      job.milestone,
    );
  }
}

export const contestProgressReminderService =
  new ContestProgressReminderService();
