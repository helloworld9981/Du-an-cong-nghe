import { notificationData } from "../data/notification.data";
import { socketService } from "./socket.service";
import { createLogger } from "../utils/logger";
import { NotificationType } from "../models/notification.model";

class NotificationService {
  private logger = createLogger("NotificationService");

  async sendNotification(
    userId: string,
    title: string,
    message: string,
    type: NotificationType = NotificationType.INFO,
    data?: any,
  ) {
    try {
      const notification = await notificationData.createNotification({
        userId,
        title,
        message,
        type,
        data,
        isRead: false,
        createdAt: new Date(),
      });

      socketService.emitToUser(userId, "NOTIFICATION", notification);

      this.logger.info(`Notification sent to ${userId}`, "sendNotification");
      return notification;
    } catch (error) {
      this.logger.error("Failed to send notification", "sendNotification", {
        error,
      });
      throw error;
    }
  }

  async getUserNotifications(
    userId: string,
    limit: number = 20,
    skip: number = 0,
  ) {
    return notificationData.getUserNotifications(userId, limit, skip);
  }

  async markAsRead(notificationId: string) {
    return notificationData.markAsRead(notificationId);
  }

  async markAllAsRead(userId: string) {
    return notificationData.markAllAsRead(userId);
  }
}

export const notificationService = new NotificationService();
