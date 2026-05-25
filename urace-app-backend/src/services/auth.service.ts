import axios from 'axios';
import querystring from 'querystring';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { userData } from '../data/user.data';
import { User } from '../models/user.model';
import { RegisterDto, LoginDto, ForgotPasswordDto, ChangePasswordDto } from '../dtos/auth.dto';
import { emailService } from './email.service';
import { StravaTokenService } from './strava-token.service';
import dotenv from 'dotenv';
import path from 'path';
import { ObjectId } from 'mongodb';
import config from '../config/env.config';
import { createLogger } from '../utils/logger';

const logger = createLogger('AuthService');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const STRAVA_TOKEN_URL = 'https://www.strava.com/oauth/token';
const STRAVA_ATHLETE_URL = 'https://www.strava.com/api/v3/athlete';

const googleClient = new OAuth2Client(config.GOOGLE_WEB_CLIENT_ID);

type LoginStreakResult = {
  loginStreak: number;
  longestLoginStreak: number;
  lastLoginDate: Date;
  loginDates: string[];
};

type AuthLoginResult = {
  token: string;
  refreshToken: string;
  user: User;
  streak: LoginStreakResult;
};

const generateSecurePassword = (): string => {
  const length = 12;
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*';

  const allChars = uppercase + lowercase + numbers + symbols;
  let password = '';

  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];

  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  return password.split('').sort(() => Math.random() - 0.5).join('');
};

const generatePasswordResetEmailTemplate = (temporaryPassword: string): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>URace Password Reset</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
            .password-box { background: white; border: 2px solid #4CAF50; padding: 15px; margin: 20px 0; text-align: center; border-radius: 5px; }
            .password { font-size: 20px; font-weight: bold; color: #4CAF50; font-family: monospace; }
            .warning { background: #fff3cd; border: 1px solid #ffeeba; color: #856404; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>URace Password Reset</h1>
        </div>
        <div class="content">
            <p>Hello,</p>
            <p>You requested a password reset for your URace account. Your new temporary password is:</p>

            <div class="password-box">
                <div class="password">${temporaryPassword}</div>
            </div>

            <p><strong>Instructions:</strong></p>
            <ol>
                <li>Use this temporary password to log into your account</li>
                <li>For security reasons, please change your password immediately after logging in</li>
                <li>Go to your profile settings to set a new permanent password</li>
            </ol>

            <div class="warning">
                <strong>Security Notice:</strong> This temporary password is only valid for a limited time. If you did not request this password reset, please contact support immediately.
            </div>

            <p>Best regards,<br>The URace Team</p>
        </div>
        <div class="footer">
            This is an automated message. Please do not reply to this email.
        </div>
    </body>
    </html>
  `;
};

export interface DisconnectResult {
  success: boolean;
  warning?: boolean;
  message: string;
}

export interface AuthService {
  login: (data: LoginDto) => Promise<AuthLoginResult | null>;
  loginWithGoogle: (idToken: string) => Promise<AuthLoginResult>;
  register: (data: RegisterDto) => Promise<any>;
  authenticateToken: (token: string) => Promise<any>;
  refreshToken: (refreshToken: string) => Promise<{ token: string; refreshToken: string } | null>;
  getUserById: (userId: string) => Promise<any>;
  handleStravaCallback: (code: string, error: string | undefined, userId: string) => Promise<any>;
  getStravaAthlete: (accessToken: string) => Promise<any | null>;
  forgotPassword: (data: ForgotPasswordDto) => Promise<boolean>;
  changePassword: (userId: string, data: ChangePasswordDto) => Promise<boolean>;
  disconnectStrava: (userId: string) => Promise<DisconnectResult>;
}

export const authService: AuthService = {
  async login(data: LoginDto): Promise<AuthLoginResult | null> {
    try {
      const user = await userData.findByEmail(data.email);
      if (!user) {
        return null;
      }

      if (!user.password) {
        logger.warn('Password login attempted for non-local account', 'login', {
          email: data.email,
          authProvider: user.authProvider,
        });
        return null;
      }

      const isValid = await userData.validatePassword(data.password, user.password);
      if (!isValid) {
        return null;
      }

      const streak = await userData.updateLoginStreak(user._id.toString());
      const updatedUser = await userData.findById(user._id.toString());

      if (!updatedUser) {
        throw new Error('User not found after updating login streak');
      }

      const token = userData.generateToken(updatedUser);
      const refreshToken = userData.generateRefreshToken(updatedUser);

      await userData.storeJwtRefreshToken(updatedUser._id, refreshToken);

      return {
        token,
        refreshToken,
        user: updatedUser,
        streak,
      };
    } catch (error: any) {
      logger.error('Error during login', 'login', {
        email: data.email,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  },

  async loginWithGoogle(idToken: string): Promise<AuthLoginResult> {
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: config.GOOGLE_WEB_CLIENT_ID,
      });

      const payload = ticket.getPayload();

      if (!payload?.email) {
        throw new Error('Invalid Google account');
      }

      let user = await userData.findByEmail(payload.email);

      if (!user) {
        user = await userData.create({
          username: payload.email.split('@')[0],
          email: payload.email,
          displayName: payload.name || payload.email.split('@')[0],
          googleId: payload.sub,
          authProvider: 'google',
          mustChangePassword: false,
        });
      }

      if (!user) {
        throw new Error('Failed to create Google user');
      }

      const streak = await userData.updateLoginStreak(user._id.toString());
      const updatedUser = await userData.findById(user._id.toString());

      if (!updatedUser) {
        throw new Error('User not found after updating login streak');
      }

      const token = userData.generateToken(updatedUser);
      const refreshToken = userData.generateRefreshToken(updatedUser);

      await userData.storeJwtRefreshToken(updatedUser._id, refreshToken);

      return {
        token,
        refreshToken,
        user: updatedUser,
        streak,
      };
    } catch (error: any) {
      logger.error('Error during Google login', 'loginWithGoogle', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  },

  async register(data: RegisterDto): Promise<any> {
    logger.info('User registration attempt', 'register', {
      username: data.username,
      email: data.email,
    });

    try {
      const existingUserByEmail = await userData.findByEmail(data.email);
      if (existingUserByEmail) {
        logger.warn('Registration failed - email already exists', 'register', {
          email: data.email,
        });
        return { error: 'email', message: 'Email already exists' };
      }

      const newUser = await userData.create({
        ...data,
        authProvider: 'local',
        loginStreak: 0,
        longestLoginStreak: 0,
        loginDates: [],
      });

      if (newUser) {
        logger.info('User registration successful', 'register', {
          username: data.username,
          userId: newUser._id.toString(),
        });
      }

      return newUser;
    } catch (error: any) {
      logger.error('Error during registration', 'register', {
        username: data.username,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  },

  async authenticateToken(token: string): Promise<any> {
    return userData.findByToken(token);
  },

  async getUserById(userId: string): Promise<any> {
    return userData.findById(userId);
  },

  async handleStravaCallback(code: string, error: string | undefined, userId: string): Promise<any> {
    if (error) {
      logger.error('Strava authorization failed', 'authorizeWithStrava', { error, userId });
      return { error: 'STRAVA_AUTH_FAILED', message: 'Strava authorization failed' };
    }

    if (code) {
      try {
        const tokenResponse = await axios.post(
          STRAVA_TOKEN_URL,
          querystring.stringify({
            client_id: config.STRAVA_CLIENT_ID,
            client_secret: config.STRAVA_CLIENT_SECRET,
            code,
            grant_type: 'authorization_code',
            redirect_uri: config.STRAVA_REDIRECT_URI,
          }),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          },
        );

        const { access_token, refresh_token, expires_at, athlete } = tokenResponse.data;

        const internalUserObjectId = new ObjectId(userId);
        const internalUser = await userData.findById(userId);

        if (!internalUser) {
          logger.error('Internal user not found during Strava callback', 'handleStravaCallback', { userId });
          return { error: 'USER_NOT_FOUND', message: 'User not found' };
        }

        if (internalUser.stravaId && internalUser.stravaProfile) {
          logger.warn('User already connected to Strava', 'handleStravaCallback', {
            userId,
            existingStravaId: internalUser.stravaId,
            newStravaId: athlete.id,
          });
          return { error: 'ALREADY_CONNECTED', message: 'User already connected to Strava' };
        }

        const existingStravaUser = await userData.findByStravaId(athlete.id);
        if (existingStravaUser && existingStravaUser._id.toString() !== userId) {
          logger.warn('Strava account already connected to another user', 'handleStravaCallback', {
            stravaId: athlete.id,
            existingUserId: existingStravaUser._id.toString(),
            attemptingUserId: userId,
          });
          return {
            error: 'STRAVA_ALREADY_CONNECTED',
            message: 'This Strava account is already connected to another user',
          };
        }

        await userData.updateUserTokens(internalUserObjectId, access_token, refresh_token, expires_at);
        await userData.setStravaProfile(internalUserObjectId, athlete.id, {
          id: athlete.id,
          username: athlete.username,
          firstname: athlete.firstname,
          lastname: athlete.lastname,
        });

        logger.info('Successfully connected user to Strava', 'handleStravaCallback', {
          userId,
          stravaId: athlete.id,
        });

        return await userData.findByStravaId(athlete.id);
      } catch (err: any) {
        logger.error('Error exchanging authorization code for token', 'authorizeWithStrava', {
          error: err.response?.data || err.message,
          userId,
          code: code?.substring(0, 10) + '...',
        });
        return { error: 'TOKEN_EXCHANGE_FAILED', message: 'Failed to exchange authorization code for token' };
      }
    }

    return { error: 'MISSING_CODE', message: 'Authorization code is missing' };
  },

  async getStravaAthlete(accessToken: string): Promise<any | null> {
    try {
      const response = await axios.get(STRAVA_ATHLETE_URL, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      return response.data;
    } catch (error: any) {
      logger.error('Error fetching Strava athlete', 'authorizeWithStrava', {
        error: error.response?.data || error.message,
      });
      return null;
    }
  },

  async refreshToken(refreshToken: string): Promise<{ token: string; refreshToken: string } | null> {
    try {
      const user = await userData.findByRefreshToken(refreshToken);
      if (!user) return null;

      const newToken = userData.generateToken(user);
      const newRefreshToken = userData.generateRefreshToken(user);

      await userData.storeJwtRefreshToken(user._id, newRefreshToken);

      return { token: newToken, refreshToken: newRefreshToken };
    } catch (error) {
      logger.error('Error refreshing token', 'refreshStravaToken', { error });
      return null;
    }
  },

  async forgotPassword(data: ForgotPasswordDto): Promise<boolean> {
    try {
      const user = await userData.findByEmail(data.email);
      if (!user) {
        logger.info('Password reset requested for non-existent email', 'forgotPassword', {
          email: data.email,
        });
        return true;
      }

      if (!user.password) {
        logger.warn('Password reset requested for non-local account', 'forgotPassword', {
          email: data.email,
          authProvider: user.authProvider,
        });
        return true;
      }

      const temporaryPassword = generateSecurePassword();

      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000);

      await userData.storeResetToken(user._id, resetToken, resetTokenExpiry);
      await userData.updatePasswordTemporary(user._id, temporaryPassword);

      const subject = 'URace - Password Reset';
      const text = `Your new temporary password is: ${temporaryPassword}\n\nPlease change your password after logging in.`;
      const html = generatePasswordResetEmailTemplate(temporaryPassword);

      emailService.sendEmail(data.email, subject, text, html)
        .then(emailSent => {
          if (emailSent) {
            logger.info('Password reset email sent successfully', 'forgotPassword', { email: data.email });
          } else {
            logger.error('Failed to send password reset email', 'forgotPassword', { email: data.email });
          }
        })
        .catch(error => {
          logger.error('Error sending password reset email', 'forgotPassword', {
            error,
            email: data.email,
          });
        });

      logger.info('Password reset initiated', 'forgotPassword', { email: data.email });
      return true;
    } catch (error) {
      logger.error('Error processing password reset', 'forgotPassword', {
        error,
        email: data.email,
      });
      return false;
    }
  },

  async changePassword(userId: string, data: ChangePasswordDto): Promise<boolean> {
    try {
      const user = await userData.findById(userId);
      if (!user) {
        logger.error('User not found for password change', 'changePassword', { userId });
        return false;
      }

      if (!user.password) {
        logger.warn('Password change attempted for non-local account', 'changePassword', {
          userId,
          authProvider: user.authProvider,
        });
        return false;
      }

      const isCurrentPasswordValid = await userData.validatePassword(data.currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        logger.error('Invalid current password for user', 'changePassword', { userId });
        return false;
      }

      const isSamePassword = await userData.validatePassword(data.newPassword, user.password);
      if (isSamePassword) {
        logger.error('New password must be different from current password', 'changePassword', { userId });
        return false;
      }

      await userData.updatePassword(new ObjectId(userId), data.newPassword);

      logger.info('Password changed successfully for user', 'changePassword', { userId });
      return true;
    } catch (error) {
      logger.error('Error changing password', 'changePassword', { error, userId });
      return false;
    }
  },

  async disconnectStrava(userId: string): Promise<DisconnectResult> {
    try {
      logger.info('User initiated Strava disconnection', 'disconnectStrava', { userId });

      const user = await userData.findById(userId);
      if (!user) {
        logger.error('User not found for Strava disconnection', 'disconnectStrava', { userId });
        throw new Error('User not found');
      }

      if (!user.stravaId || !user.stravaProfile) {
        logger.warn('User attempted to disconnect but has no Strava connection', 'disconnectStrava', { userId });
        throw new Error('Not connected to Strava');
      }

      let stravaDeauthorized = false;

      try {
        const validToken = await StravaTokenService.ensureValidToken(user);
        stravaDeauthorized = await StravaTokenService.deauthorize(validToken);

        if (stravaDeauthorized) {
          logger.info('Successfully deauthorized from Strava API', 'disconnectStrava', {
            userId,
            stravaId: user.stravaId,
          });
        } else {
          logger.warn('Strava deauthorization failed, continuing with local cleanup', 'disconnectStrava', {
            userId,
            stravaId: user.stravaId,
          });
        }
      } catch (error: any) {
        logger.warn('Error during Strava deauthorization, continuing with local cleanup', 'disconnectStrava', {
          userId,
          stravaId: user.stravaId,
          error: error.message,
        });
      }

      await userData.clearStravaConnection(new ObjectId(userId));

      logger.info('Successfully disconnected user from Strava', 'disconnectStrava', {
        userId,
        stravaDeauthorized,
      });

      if (stravaDeauthorized) {
        return {
          success: true,
          message: 'Successfully disconnected from Strava',
        };
      }

      return {
        success: true,
        warning: true,
        message: 'Disconnected from URace. Strava authorization may still be active.',
      };
    } catch (error: any) {
      logger.error('Error disconnecting from Strava', 'disconnectStrava', {
        error: error.message,
        userId,
      });
      throw error;
    }
  },
};