// src/data/user.data.ts

import { Collection, Db, MongoClient, ObjectId } from 'mongodb';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User, StravaProfile } from '../models/user.model';
import dotenv from 'dotenv';
import path from 'path';
import config from '../config/env.config';
import { createLogger } from '../utils/logger';

const logger = createLogger('UserData');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
const JWT_SECRET = config.JWT_SECRET;

export class UserData {
  private db: Db | null = null;
  private collection: Collection | null = null;

  async connect(mongoUri: string, dbName: string): Promise<void> {
    try {
      const client = await MongoClient.connect(mongoUri);
      this.db = client.db(dbName);
      this.collection = this.db.collection('Users');

      // Create unique index on stravaId to enforce 1-1 mapping
      // Use sparse: true to allow multiple null values (users without Strava connection)
      try {
        await this.collection.createIndex(
          { stravaId: 1 },
          {
            unique: true,
            sparse: true,
            name: 'stravaId_unique'
          }
        );
        logger.info('Created unique index on stravaId', 'connect', {
          collection: 'Users',
          index: 'stravaId_unique'
        });
      } catch (error: any) {
        // Index already exists (code 11000) or other index creation error
        if (error.code === 11000 || error.codeName === 'IndexOptionsConflict') {
          logger.info('Unique index on stravaId already exists', 'connect', {
            collection: 'Users',
            index: 'stravaId_unique'
          });
        } else {
          logger.error('Failed to create unique index on stravaId', 'connect', {
            collection: 'Users',
            error: error.message
          });
          throw error;
        }
      }

      logger.info('Database connection established', 'connect', {
        collection: 'Users'
      });
    } catch (error) {
      logger.error('Failed to connect to MongoDB', 'connect', { collection: 'Users', error });
      throw error;
    }
  }

  async findByUsername(username: string): Promise<User | null> {
    try {
      if (!this.collection) throw new Error('Database not connected');
      
      const user = await this.collection.findOne({ username }) as User | null;
      logger.debug('User lookup by username', 'findByUsername', { username, found: !!user });
      return user;
    } catch (error) {
      logger.error('Error finding user by username', 'findByUsername', { username, error });
      return null;
    }
  }

  async findById(userId: string): Promise<User | null> {
    try {
      if (!this.collection) throw new Error('Database not connected');
      
      const user = await this.collection.findOne({ 
        _id: new ObjectId(userId) 
      }) as User | null;
      
      return user;
    } catch (error) {
      logger.error('Error finding user by ID', 'findById', { userId, error });
      return null;
    }
  }

  async findByToken(token: string): Promise<User | null> {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      return this.findById(decoded.userId);
    } catch (error) {
      logger.error('Error finding user by token', 'findByToken', { error });
      return null;
    }
  }

  async validatePassword(inputPassword: string, hashedPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(inputPassword, hashedPassword);
    } catch (error) {
      logger.error('Error validating password', 'validatePassword', { error });
      return false;
    }
  }

  generateToken(user: User): string {
    try {
      return jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });
    } catch (error) {
      logger.error('Error generating token', 'generateToken', { userId: user._id, error });
      throw error;
    }
  }

  generateRefreshToken(user: User): string {
    try {
      return jwt.sign({ userId: user._id, type: 'refresh' }, JWT_SECRET, { expiresIn: '7d' });
    } catch (error) {
      logger.error('Error generating refresh token', 'generateRefreshToken', { userId: user._id, error });
      throw error;
    }
  }

  async findByRefreshToken(refreshToken: string): Promise<User | null> {
    try {
      if (!this.collection) throw new Error('Database not connected');
      
      const decoded = jwt.verify(refreshToken, JWT_SECRET) as { userId: string; type: string };
      
      // Verify this is a refresh token
      if (decoded.type !== 'refresh') {
        logger.error('Invalid refresh token type', 'findByRefreshToken', { tokenType: decoded.type });
        return null;
      }
      
      // Find user and verify the refresh token matches the stored one
      const user = await this.collection.findOne({ 
        _id: new ObjectId(decoded.userId),
        jwtRefreshToken: refreshToken
      }) as User | null;
      
      return user;
    } catch (error) {
      logger.error('Error finding user by refresh token', 'findByRefreshToken', { error });
      return null;
    }
  }

  async create(data: Partial<User>): Promise<User | null> {
  try {
    if (!this.collection) {
      throw new Error('Database not connected');
    }

    let hashedPassword: string | undefined = undefined;

    // Only hash password for local auth users
    if (data.password) {
      hashedPassword = await bcrypt.hash(data.password, 10);
    }

    const newUser = {
      username: data.username,

      // Local auth
      password: hashedPassword,

      // Basic info
      email: data.email,
      displayName: data.displayName,

      // Google OAuth
      googleId: data.googleId,
      authProvider: data.authProvider,

      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await this.collection.insertOne(newUser);

    if (result.acknowledged) {
      return {
        ...newUser,
        _id: result.insertedId
      } as User;
    }

    return null;
  } catch (error) {
    logger.error('Error creating user', 'create', {
      username: data.username,
      email: data.email,
      error
    });

    return null;
  }
}

  async updateUserTokens(userId: ObjectId, accessToken: string, refreshToken: string, expiresAt: number): Promise<void> {
    if (!this.collection) throw new Error('Database not connected');

    await this.collection.updateOne(
      { _id: userId },
      { 
        $set: { 
          accessToken, 
          refreshToken, 
          expiresAt, 
          updatedAt: new Date() 
        } 
      }
    );
  }
  
  async setStravaProfile(userId: ObjectId, stravaId: number, stravaProfile: StravaProfile): Promise<void> {
    if (!this.collection) throw new Error('Database not connected');

    await this.collection.updateOne(
      { _id: userId },
      { $set: { stravaId: stravaId, stravaProfile, updatedAt: new Date() } }
    );
  }

  async findByStravaId(stravaId: number): Promise<User | null> {
    try {
      if (!this.collection) throw new Error('Database not connected');
      
      const user = await this.collection.findOne({ 
        stravaId: stravaId 
      }) as User | null;
      
      return user;
    } catch (error) {
      logger.error('Error finding user by Strava ID', 'findByStravaId', { stravaId, error });
      return null;
    }
  }

  async searchByName(query: string): Promise<User[]> {
    try {
      if (!this.collection) throw new Error('Database not connected');
      
      // Create a case-insensitive regex search
      const searchRegex = new RegExp(query, 'i');
      
      const users = await this.collection.find({
        $or: [
          { username: { $regex: searchRegex } },
          { email: { $regex: searchRegex } },
          { 'stravaProfile.firstname': { $regex: searchRegex } },
          { 'stravaProfile.lastname': { $regex: searchRegex } },
          { 'stravaProfile.username': { $regex: searchRegex } }
        ]
      }).limit(20).toArray() as User[];
      
      return users;
    } catch (error) {
      logger.error('Error searching users by name', 'searchByName', { query, error });
      return [];
    }
  }

  async getAll(): Promise<User[]> {
    try {
      if (!this.collection) throw new Error('Database not connected');
      
      const users = await this.collection.find({}).toArray() as User[];
      return users;
    } catch (error) {
      logger.error('Error getting all users', 'getAllUsers', { error });
      return [];
    }
  }

  async updateProfile(userId: ObjectId, updateData: any): Promise<boolean> {
    try {
      if (!this.collection) throw new Error('Database not connected');
      
      const result = await this.collection.updateOne(
        { _id: userId },
        { 
          $set: { 
            ...updateData,
            updatedAt: new Date() 
          } 
        }
      );
      
      return result.modifiedCount > 0;
    } catch (error) {
      logger.error('Error updating user profile', 'updateProfile', { userId, error });
      return false;
    }
  }

  async storeJwtRefreshToken(userId: ObjectId, refreshToken: string): Promise<void> {
    try {
      if (!this.collection) throw new Error('Database not connected');
      
      await this.collection.updateOne(
        { _id: userId },
        { 
          $set: { 
            jwtRefreshToken: refreshToken,
            updatedAt: new Date() 
          } 
        }
      );
    } catch (error) {
      logger.error('Error storing JWT refresh token', 'storeRefreshToken', { userId, error });
      throw error;
    }
  }

  async clearJwtRefreshToken(userId: ObjectId): Promise<void> {
    try {
      if (!this.collection) throw new Error('Database not connected');
      
      await this.collection.updateOne(
        { _id: userId },
        { 
          $unset: { jwtRefreshToken: "" },
          $set: { updatedAt: new Date() }
        }
      );
    } catch (error) {
      logger.error('Error clearing JWT refresh token', 'clearRefreshToken', { userId, error });
      throw error;
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      if (!this.collection) throw new Error('Database not connected');
      
      const user = await this.collection.findOne({ email }) as User | null;
      return user;
    } catch (error) {
      logger.error('Error finding user by email', 'findByEmail', { email, error });
      return null;
    }
  }

  async updatePassword(userId: ObjectId, newPassword: string): Promise<void> {
    try {
      if (!this.collection) throw new Error('Database not connected');
      
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      await this.collection.updateOne(
        { _id: userId },
        { 
          $set: { 
            password: hashedPassword,
            updatedAt: new Date()
          },
          $unset: { 
            resetToken: "",
            resetTokenExpiry: "",
            mustChangePassword: ""
          }
        }
      );
    } catch (error) {
      logger.error('Error updating password', 'updatePassword', { userId, error });
      throw error;
    }
  }

  async updatePasswordTemporary(userId: ObjectId, newPassword: string): Promise<void> {
    try {
      if (!this.collection) throw new Error('Database not connected');
      
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      await this.collection.updateOne(
        { _id: userId },
        { 
          $set: { 
            password: hashedPassword,
            updatedAt: new Date()
          },
          $unset: { 
            resetToken: "",
            resetTokenExpiry: ""
          }
          // Note: NOT clearing mustChangePassword flag for temporary passwords
        }
      );
    } catch (error) {
      logger.error('Error updating temporary password', 'updateTemporaryPassword', { userId, error });
      throw error;
    }
  }

  async storeResetToken(userId: ObjectId, resetToken: string, expiryDate: Date): Promise<void> {
    try {
      if (!this.collection) throw new Error('Database not connected');

      await this.collection.updateOne(
        { _id: userId },
        {
          $set: {
            resetToken,
            resetTokenExpiry: expiryDate,
            mustChangePassword: true, // Force password change for auto-generated passwords
            updatedAt: new Date()
          }
        }
      );
    } catch (error) {
      logger.error('Error storing reset token', 'storeResetToken', { userId, error });
      throw error;
    }
  }

  async clearStravaConnection(userId: ObjectId): Promise<void> {
    try {
      if (!this.collection) throw new Error('Database not connected');

      await this.collection.updateOne(
        { _id: userId },
        {
          $unset: {
            stravaId: "",
            stravaProfile: "",
            accessToken: "",
            refreshToken: "",
            expiresAt: ""
          },
          $set: {
            updatedAt: new Date()
          }
        }
      );

      logger.info('Cleared Strava connection from user', 'clearStravaConnection', { userId: userId.toString() });
    } catch (error) {
      logger.error('Error clearing Strava connection', 'clearStravaConnection', { userId, error });
      throw error;
    }
  }

    async updateLoginStreak(userId: string): Promise<{
    loginStreak: number;
    longestLoginStreak: number;
    lastLoginDate: Date;
    loginDates: string[];
  }> {
    try {
      if (!this.collection) throw new Error('Database not connected');

      const user = await this.findById(userId);

      if (!user) {
        throw new Error('User not found');
      }

      const now = new Date();

      const todayString = now.toISOString().split('T')[0];

      const today = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
      );

      let loginStreak = user.loginStreak || 0;
      let longestLoginStreak = user.longestLoginStreak || 0;
      const loginDates = user.loginDates || [];

      if (!user.lastLoginDate) {
        loginStreak = 1;
      } else {
        const lastLogin = new Date(user.lastLoginDate);

        const lastLoginDay = new Date(
          lastLogin.getFullYear(),
          lastLogin.getMonth(),
          lastLogin.getDate(),
        );

        const diffTime = today.getTime() - lastLoginDay.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
          loginStreak = user.loginStreak || 1;
        } else if (diffDays === 1) {
          loginStreak += 1;
        } else {
          loginStreak = 1;
        }
      }

      longestLoginStreak = Math.max(longestLoginStreak, loginStreak);

      const updatedLoginDates = loginDates.includes(todayString)
        ? loginDates
        : [...loginDates, todayString];

      await this.collection.updateOne(
        { _id: new ObjectId(userId) },
        {
          $set: {
            loginStreak,
            longestLoginStreak,
            lastLoginDate: now,
            loginDates: updatedLoginDates,
            updatedAt: now,
          },
        },
      );

      return {
        loginStreak,
        longestLoginStreak,
        lastLoginDate: now,
        loginDates: updatedLoginDates,
      };
    } catch (error) {
      logger.error('Error updating login streak', 'updateLoginStreak', {
        userId,
        error,
      });
      throw error;
    }
  }
}





export const userData = new UserData();
