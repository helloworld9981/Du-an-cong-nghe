// src/models/user.model.ts

import { ObjectId } from "mongodb";

export interface StravaProfile {
  id: number;
  username: string | null;
  firstname: string;
  lastname: string;
  // Add other relevant Strava profile fields
}

export interface User {
  _id: ObjectId;
  userId?: string | ObjectId; 
  username: string;
  password?: string;
  // Auth provider
  authProvider?: "local" | "google";
  // Google OAuth
  googleId?: string;
  email?: string;
  displayName?: string; // User's display name (can be edited)
  bio?: string; // User's bio/description
  height?: number; // User's height in cm
  weight?: number; // User's weight in kg
  stravaId?: number;
  stravaProfile?: StravaProfile;
  // Strava OAuth tokens
  accessToken?: string; // Strava access token
  refreshToken?: string; // Strava refresh token
  expiresAt?: number; // Strava token expiration
  // JWT refresh token for app authentication
  jwtRefreshToken?: string; // JWT refresh token for app authentication
  // Password reset tokens
  resetToken?: string; // Password reset token
  resetTokenExpiry?: Date; // Password reset token expiration
  // Force password change for temporary passwords
  mustChangePassword?: boolean; // User must change password (set for auto-generated passwords)
  groupIds?: ObjectId[]; // Groups that user is a member of

  // Login streak
  loginStreak?: number;
  longestLoginStreak?: number;
  lastLoginDate?: Date;
  loginDates?: string[];

  createdAt: Date;
  updatedAt: Date;
}
