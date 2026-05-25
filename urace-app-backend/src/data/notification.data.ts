import { Collection, Db, MongoClient, ObjectId } from "mongodb";
import { Notification } from "../models/notification.model";

class NotificationData {
  private collection: Collection<Notification> | null = null;
  private db: Db | null = null;

  async connect(uri: string, dbName: string): Promise<void> {
    try {
      const client = new MongoClient(uri);
      await client.connect();
      this.db = client.db(dbName);
      this.collection = this.db.collection<Notification>("notifications");
      console.log("Connected to notifications collection");
    } catch (error) {
      console.error("Failed to connect to notifications collection", error);
      throw error;
    }
  }

  async createNotification(
    notification: Omit<Notification, "_id">,
  ): Promise<Notification> {
    if (!this.collection) {
      throw new Error("Notification collection not connected");
    }

    const result = await this.collection.insertOne(notification as any);
    return { ...notification, _id: result.insertedId };
  }

  async getUserNotifications(
    userId: string,
    limit: number = 20,
    skip: number = 0,
  ): Promise<Notification[]> {
    if (!this.collection) {
      throw new Error("Notification collection not connected");
    }

    return this.collection
      .find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
  }

  async markAsRead(notificationId: string): Promise<boolean> {
    if (!this.collection) {
      throw new Error("Notification collection not connected");
    }

    const result = await this.collection.updateOne(
      { _id: new ObjectId(notificationId) },
      { $set: { isRead: true } },
    );

    return result.modifiedCount > 0;
  }

  async markAllAsRead(userId: string): Promise<boolean> {
    if (!this.collection) {
      throw new Error("Notification collection not connected");
    }

    const result = await this.collection.updateMany(
      { userId, isRead: false },
      { $set: { isRead: true } },
    );

    return result.modifiedCount > 0;
  }
}

export const notificationData = new NotificationData();
