import { createClient } from 'redis';
import { ObjectId } from 'mongodb';
import config from '../config/env.config';
import { createLogger } from '../utils/logger';

const logger = createLogger('RedisService');

class RedisService {
  private client: any;
  private isConnected: boolean = false;

  async connect() {
    try {
      // Get Redis URL from environment variable or use default
      const redisUrl = config.REDIS_URL;
      
      this.client = createClient({
        url: redisUrl
      });

      this.client.on('error', (err: any) => {
        logger.error('Redis connection error', 'connect', {
          error: err.message,
          stack: err.stack
        });
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        logger.info('Connected to Redis', 'connect', {
          url: redisUrl,
          connection: 'established'
        });
        this.isConnected = true;
      });

      await this.client.connect();
      return true;
    } catch (error: any) {
      logger.error('Failed to connect to Redis', 'connect', {
        error: error.message,
        stack: error.stack,
        url: config.REDIS_URL
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
      throw new Error('Redis client is not connected');
    }
  }

  /**
   * Store user's teams in Redis
   * @param userId User ID
   * @param teams Array of team IDs
   */
  async cacheUserTeams(userId: ObjectId, teams: ObjectId[]) {
    this.ensureConnected();
    
    const key = `userId:${userId.toString()}`;
    const teamIds = teams.map(id => id.toString());
    
    await this.client.set(key, JSON.stringify(teamIds));
  }

  /**
   * Get user's teams from Redis
   * @param userId User ID
   * @returns Array of team IDs or null if not found
   */
  async getUserTeams(userId: ObjectId): Promise<ObjectId[] | null> {
    try {
      this.ensureConnected();
      
      const key = `userId:${userId.toString()}`;
      const teamsJson = await this.client.get(key);
      
      if (!teamsJson) {
        return null;
      }
      
      const teamIdStrings = JSON.parse(teamsJson);
      return teamIdStrings.map((id: string) => new ObjectId(id));
    } catch (error: any) {
      logger.error('Error getting user teams from Redis', 'getUserTeams', {
        userId: userId.toString(),
        error: error.message,
        operation: 'getUserTeams'
      });
      return null;
    }
  }

  /**
   * Add a team to user's team list in Redis
   * @param userId User ID
   * @param teamId Team ID to add
   */
  async addTeamToUser(userId: ObjectId, teamId: ObjectId) {
    try {
      this.ensureConnected();
      
      const key = `userId:${userId.toString()}`;
      const teamsJson = await this.client.get(key);
      
      let teamIds: string[] = [];
      if (teamsJson) {
        teamIds = JSON.parse(teamsJson);
      }
      
      const teamIdStr = teamId.toString();
      if (!teamIds.includes(teamIdStr)) {
        teamIds.push(teamIdStr);
        await this.client.set(key, JSON.stringify(teamIds));
      }
    } catch (error: any) {
      logger.error('Error adding team to user in Redis', 'addTeamToUser', {
        userId: userId.toString(),
        teamId: teamId.toString(),
        error: error.message,
        operation: 'addTeamToUser'
      });
    }
  }

  /**
   * Remove a team from user's team list in Redis
   * @param userId User ID
   * @param teamId Team ID to remove
   */
  async removeTeamFromUser(userId: ObjectId, teamId: ObjectId) {
    try {
      this.ensureConnected();
      
      const key = `userId:${userId.toString()}`;
      const teamsJson = await this.client.get(key);
      
      if (!teamsJson) {
        return;
      }
      
      let teamIds: string[] = JSON.parse(teamsJson);
      const teamIdStr = teamId.toString();
      
      teamIds = teamIds.filter(id => id !== teamIdStr);
      await this.client.set(key, JSON.stringify(teamIds));
    } catch (error: any) {
      logger.error('Error removing team from user in Redis', 'removeTeamFromUser', {
        userId: userId.toString(),
        teamId: teamId.toString(),
        error: error.message,
        operation: 'removeTeamFromUser'
      });
    }
  }

  /**
   * Delete user's teams cache
   * @param userId User ID
   */
  async deleteUserTeamsCache(userId: ObjectId) {
    try {
      this.ensureConnected();
      
      const key = `userId:${userId.toString()}`;
      await this.client.del(key);
    } catch (error: any) {
      logger.error('Error deleting user teams cache', 'deleteUserTeamsCache', {
        userId: userId.toString(),
        error: error.message,
        operation: 'deleteUserTeamsCache'
      });
    }
  }

  // Join Request Methods
  
  /**
   * Add user to group join request set
   * @param groupId Group ID
   * @param userId User ID
   */
  async addJoinRequest(groupId: string, userId: string): Promise<boolean> {
    try {
      this.ensureConnected();
      const key = `JoinRequest:${groupId}`;
      const result = await this.client.sAdd(key, userId);
      return result === 1; // Returns 1 if element was added, 0 if already exists
    } catch (error: any) {
      logger.error('Error adding join request', 'addJoinRequest', {
        groupId,
        userId,
        error: error.message,
        operation: 'addJoinRequest'
      });
      return false;
    }
  }

  /**
   * Remove user from group join request set
   * @param groupId Group ID
   * @param userId User ID
   */
  async removeJoinRequest(groupId: string, userId: string): Promise<boolean> {
    try {
      this.ensureConnected();
      const key = `JoinRequest:${groupId}`;
      const result = await this.client.sRem(key, userId);
      return result === 1; // Returns 1 if element was removed, 0 if didn't exist
    } catch (error: any) {
      logger.error('Error removing join request', 'removeJoinRequest', {
        groupId,
        userId,
        error: error.message,
        operation: 'removeJoinRequest'
      });
      return false;
    }
  }

  /**
   * Check if user has pending join request for group
   * @param groupId Group ID
   * @param userId User ID
   */
  async hasJoinRequest(groupId: string, userId: string): Promise<boolean> {
    try {
      this.ensureConnected();
      const key = `JoinRequest:${groupId}`;
      const result = await this.client.sIsMember(key, userId);
      return result;
    } catch (error: any) {
      logger.error('Error checking join request', 'hasJoinRequest', {
        groupId,
        userId,
        error: error.message,
        operation: 'hasJoinRequest'
      });
      return false;
    }
  }

  /**
   * Get all pending join requests for a group
   * @param groupId Group ID
   */
  async getJoinRequests(groupId: string): Promise<string[]> {
    try {
      this.ensureConnected();
      const key = `JoinRequest:${groupId}`;
      const members = await this.client.sMembers(key);
      return members || [];
    } catch (error: any) {
      logger.error('Error getting join requests', 'getJoinRequests', {
        groupId,
        error: error.message,
        operation: 'getJoinRequests'
      });
      return [];
    }
  }

  // Rate Limiting Methods

  /**
   * Check and increment rate limit for a user action
   * Uses sliding window rate limiting with Redis sorted sets
   * @param userId User ID
   * @param action Action identifier (e.g., 'strava-sync')
   * @param maxRequests Maximum requests allowed in the window
   * @param windowSeconds Time window in seconds
   * @returns Object with allowed status and retry information
   */
  async checkRateLimit(
    userId: string,
    action: string,
    maxRequests: number,
    windowSeconds: number
  ): Promise<{ allowed: boolean; remaining: number; retryAfter?: number }> {
    try {
      this.ensureConnected();

      const key = `ratelimit:${action}:${userId}`;
      const now = Date.now();
      const windowStart = now - (windowSeconds * 1000);

      // Remove old entries outside the time window
      await this.client.zRemRangeByScore(key, 0, windowStart);

      // Count current requests in the window
      const currentCount = await this.client.zCard(key);

      if (currentCount >= maxRequests) {
        // Get the oldest request timestamp to calculate retry-after
        const oldestRequests = await this.client.zRange(key, 0, 0, { REV: false });
        const oldestTimestamp = oldestRequests.length > 0 ? parseFloat(oldestRequests[0]) : now;
        const retryAfter = Math.ceil((oldestTimestamp + (windowSeconds * 1000) - now) / 1000);

        return {
          allowed: false,
          remaining: 0,
          retryAfter: Math.max(retryAfter, 1)
        };
      }

      // Add current request to the sorted set
      await this.client.zAdd(key, { score: now, value: now.toString() });

      // Set expiration on the key to auto-cleanup
      await this.client.expire(key, windowSeconds * 2);

      return {
        allowed: true,
        remaining: maxRequests - currentCount - 1
      };

    } catch (error: any) {
      logger.error('Error checking rate limit', 'checkRateLimit', {
        userId,
        action,
        error: error.message,
        operation: 'checkRateLimit'
      });
      // Fail open - allow the request if Redis is unavailable
      return {
        allowed: true,
        remaining: maxRequests - 1
      };
    }
  }

  /**
   * Reset rate limit for a user action
   * @param userId User ID
   * @param action Action identifier
   */
  async resetRateLimit(userId: string, action: string): Promise<void> {
    try {
      this.ensureConnected();
      const key = `ratelimit:${action}:${userId}`;
      await this.client.del(key);
    } catch (error: any) {
      logger.error('Error resetting rate limit', 'resetRateLimit', {
        userId,
        action,
        error: error.message,
        operation: 'resetRateLimit'
      });
    }
  }

  /**
   * Get current rate limit status for a user action
   * @param userId User ID
   * @param action Action identifier
   * @param maxRequests Maximum requests allowed
   * @param windowSeconds Time window in seconds
   */
  async getRateLimitStatus(
    userId: string,
    action: string,
    maxRequests: number,
    windowSeconds: number
  ): Promise<{ count: number; remaining: number; resetAt: Date | null }> {
    try {
      this.ensureConnected();

      const key = `ratelimit:${action}:${userId}`;
      const now = Date.now();
      const windowStart = now - (windowSeconds * 1000);

      // Remove old entries
      await this.client.zRemRangeByScore(key, 0, windowStart);

      // Count current requests
      const currentCount = await this.client.zCard(key);

      // Get oldest timestamp for reset calculation
      let resetAt: Date | null = null;
      if (currentCount > 0) {
        const oldestRequests = await this.client.zRange(key, 0, 0, { REV: false });
        if (oldestRequests.length > 0) {
          const oldestTimestamp = parseFloat(oldestRequests[0]);
          resetAt = new Date(oldestTimestamp + (windowSeconds * 1000));
        }
      }

      return {
        count: currentCount,
        remaining: Math.max(0, maxRequests - currentCount),
        resetAt
      };

    } catch (error: any) {
      logger.error('Error getting rate limit status', 'getRateLimitStatus', {
        userId,
        action,
        error: error.message,
        operation: 'getRateLimitStatus'
      });
      return {
        count: 0,
        remaining: maxRequests,
        resetAt: null
      };
    }
  }
}

export const redisService = new RedisService(); 