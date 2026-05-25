import { createClient } from "redis";
import config from "../config/env.config";
import { createLogger } from "../utils/logger";

const logger = createLogger("RedisQueueService");

export type QueueMessage = {
  id: string;
  data: any;
  timestamp: number;
  attempts?: number;
};

export class RedisQueueService {
  private client: any;
  private isConnected: boolean = false;

  // Queue names
  public static readonly ACTIVITY_QUEUE = "activity:queue";
  public static readonly FAILED_QUEUE = "activity:failed";
  public static readonly PROCESSING_QUEUE = "activity:processing";

  // queue for contest progress reminder
  public static readonly REMINDER_QUEUE = "reminder:queue";
  public static readonly REMINDER_FAILED_QUEUE = "reminder:failed";
  public static readonly REMINDER_PROCESSING_QUEUE = "reminder:processing";

  async connect() {
    try {
      // Get Redis URL from config
      const redisUrl = config.REDIS_URL;

      this.client = createClient({
        url: redisUrl,
      });

      this.client.on("error", (err: any) => {
        logger.error("Redis queue error", "connect", {
          error: err.message,
          stack: err.stack,
        });
        this.isConnected = false;
      });

      this.client.on("connect", () => {
        logger.info("Connected to Redis queue", "connect");
        this.isConnected = true;
      });

      await this.client.connect();
      return true;
    } catch (error: any) {
      logger.error("Failed to connect to Redis queue", "connect", {
        error: error.message,
        stack: error.stack,
      });
      return false;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
    }
  }

  private ensureConnected() {
    if (!this.isConnected) {
      throw new Error("Redis queue client is not connected");
    }
  }

  /**
   * Push a message to a queue
   * @param queue Queue name
   * @param data Message data
   * @param mongoId Optional MongoDB ID to associate with the message
   * @returns Message ID
   */
  async pushToQueue(
    queue: string,
    data: any,
    mongoId: string,
  ): Promise<string> {
    this.ensureConnected();

    const message: QueueMessage = {
      id: mongoId,
      data,
      timestamp: Date.now(),
      attempts: 0,
    };

    await this.client.lPush(queue, JSON.stringify(message));
    return message.id;
  }

  /**
   * Get a message from the queue (blocking pop)
   * @param queue Queue name
   * @param timeout Timeout in seconds (0 = no timeout)
   * @returns Message or null if timeout
   */
  async popFromQueue(
    queue: string,
    timeout: number = 0,
  ): Promise<QueueMessage | null> {
    this.ensureConnected();

    try {
      // Use BRPOP instead of bRPopLPush as it's the correct method in Redis v5.x
      const result = await this.client.brPop(queue, timeout);
      if (!result) {
        return null;
      }

      try {
        // Move the message to processing queue
        const message = JSON.parse(result.element);
        return message;
      } catch (error: any) {
        logger.error("Error parsing message from queue", "popFromQueue", {
          error: error.message,
          queue,
        });
        return null;
      }
    } catch (error: any) {
      logger.error("Error popping from queue", "popFromQueue", {
        error: error.message,
        queue,
      });
      return null;
    }
  }

  /**
   * Move a message to the processing queue
   * @param queue Source queue
   * @param message Message to move
   */
  async moveToProcessing(message: QueueMessage): Promise<void> {
    this.ensureConnected();
    message.attempts = (message.attempts || 0) + 1;
    await this.client.lPush(
      RedisQueueService.PROCESSING_QUEUE,
      JSON.stringify(message),
    );
  }

  /**
   * Move a message to the failed queue
   * @param message Message to move
   * @param error Error information
   */
  async moveToFailed(message: QueueMessage, error: any): Promise<void> {
    this.ensureConnected();

    const failedMessage = {
      ...message,
      error: {
        message: error.message || "Unknown error",
        stack: error.stack,
        timestamp: Date.now(),
      },
    };

    await this.client.lPush(
      RedisQueueService.FAILED_QUEUE,
      JSON.stringify(failedMessage),
    );
  }

  /**
   * Remove a message from the processing queue
   * @param message Message to remove
   */
  async removeFromProcessing(message: QueueMessage): Promise<void> {
    this.ensureConnected();

    // We need to re-stringify because the message might have changed
    const stringMessage = JSON.stringify(message);

    // Remove the message from the processing queue
    await this.client.lRem(
      RedisQueueService.PROCESSING_QUEUE,
      1,
      stringMessage,
    );
  }

  /**
   * Get queue length
   * @param queue Queue name
   * @returns Queue length
   */
  async getQueueLength(queue: string): Promise<number> {
    this.ensureConnected();
    return this.client.lLen(queue);
  }

  /**
   * Check if queue exists
   * @param queue Queue name
   * @returns True if queue exists
   */
  async queueExists(queue: string): Promise<boolean> {
    this.ensureConnected();
    return (await this.client.exists(queue)) === 1;
  }
}

export const redisQueueService = new RedisQueueService();
