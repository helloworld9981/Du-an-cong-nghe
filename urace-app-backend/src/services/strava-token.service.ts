import axios from 'axios';
import { userData } from '../data/user.data';
import { User } from '../models/user.model';
import config from '../config/env.config';
import { createLogger } from '../utils/logger';

const logger = createLogger('StravaTokenService');

export class StravaTokenService {
  static async refreshToken(refreshToken: string): Promise<{
    access_token: string,
    refresh_token: string,
    expires_at: number
  }> {
    const response = await axios.post('https://www.strava.com/oauth/token', {
      client_id: config.STRAVA_CLIENT_ID,
      client_secret: config.STRAVA_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    });

    return {
      access_token: response.data.access_token,
      refresh_token: response.data.refresh_token,
      expires_at: response.data.expires_at
    };
  }

  static async getValidAccessToken(athleteId: number): Promise<string> {
    const user = await userData.findByStravaId(athleteId);
    if (!user?.accessToken) {
      throw new Error('User not connected to Strava');
    }

    // Check if token needs refresh
    if (!user.expiresAt || user.expiresAt < Date.now()/1000) {
      if (!user.refreshToken || !user._id) {
        throw new Error('Invalid user data: missing refresh token or user ID');
      }
      const newTokens = await this.refreshToken(user.refreshToken);
      await userData.updateUserTokens(
        user._id,
        newTokens.access_token,
        newTokens.refresh_token,
        newTokens.expires_at
      );
      return newTokens.access_token;
    }

    return user.accessToken;
  }

  /**
   * Ensures a user has a valid access token, refreshing if necessary
   * @param user User object with Strava tokens
   * @returns Valid access token
   */
  static async ensureValidToken(user: User): Promise<string> {
    if (!user.accessToken) {
      throw new Error('User not connected to Strava');
    }

    // Check if token needs refresh
    if (!user.expiresAt || user.expiresAt < Date.now() / 1000) {
      if (!user.refreshToken || !user._id) {
        logger.warn('Token expired but cannot refresh - missing data', 'ensureValidToken', {
          userId: user._id?.toString(),
          hasRefreshToken: !!user.refreshToken
        });
        // Return expired token - deauthorization might still work
        return user.accessToken;
      }

      try {
        const newTokens = await this.refreshToken(user.refreshToken);
        await userData.updateUserTokens(
          user._id,
          newTokens.access_token,
          newTokens.refresh_token,
          newTokens.expires_at
        );
        logger.info('Successfully refreshed Strava token', 'ensureValidToken', {
          userId: user._id.toString()
        });
        return newTokens.access_token;
      } catch (error: any) {
        logger.warn('Failed to refresh token, using expired token for deauthorization', 'ensureValidToken', {
          userId: user._id?.toString(),
          error: error.message
        });
        // Return expired token anyway - deauthorization might still work
        return user.accessToken;
      }
    }

    return user.accessToken;
  }

  /**
   * Deauthorizes the application from Strava OAuth
   * @param accessToken Valid Strava access token
   * @returns True if successful, false otherwise
   */
  static async deauthorize(accessToken: string): Promise<boolean> {
    try {
      await axios.post('https://www.strava.com/oauth/deauthorize', null, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      logger.info('Successfully deauthorized from Strava', 'deauthorize', {
        tokenPrefix: accessToken.substring(0, 8) + '...'
      });
      return true;
    } catch (error: any) {
      logger.error('Failed to deauthorize from Strava', 'deauthorize', {
        error: error.response?.data || error.message,
        status: error.response?.status,
        tokenPrefix: accessToken.substring(0, 8) + '...'
      });
      return false;
    }
  }
}