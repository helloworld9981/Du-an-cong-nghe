// src/controllers/auth.controller.ts

import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { authService } from "../services/auth.service";
import {
  RegisterDto,
  LoginDto,
  AuthResponseDto,
  ForgotPasswordDto,
  ChangePasswordDto,
} from "../dtos/auth.dto";
import dotenv from "dotenv";
import path from "path";
import { AuthRequest } from "../middleware/auth.middleware";
import config from "../config/env.config";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// Load environment variables
const STRAVA_CLIENT_ID = config.STRAVA_CLIENT_ID!;
const STRAVA_REDIRECT_URI = config.STRAVA_REDIRECT_URI!;
const JWT_SECRET = config.JWT_SECRET!;

const STRAVA_AUTHORIZE_URL = "https://www.strava.com/oauth/authorize";

export const register = async (req: Request, res: Response): Promise<any> => {
  try {
    const registerDto: RegisterDto = req.body;

    if (!registerDto.username || !registerDto.password || !registerDto.email) {
      return res
        .status(400)
        .json({ message: "Username, email, and password are required" });
    }

    const result = await authService.register(registerDto);

    // Check if result contains an error
    if (result && result.error) {
      return res.status(400).json({ message: result.message });
    }

    // Check if user creation failed for other reasons
    if (!result) {
      return res.status(400).json({ message: "Registration failed" });
    }

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Registration error:", error);
    res
      .status(500)
      .json({ message: "Internal server error during registration" });
  }
};

export const login = async (req: Request, res: Response): Promise<any> => {
  try {
    const loginDto: LoginDto = req.body;

    if (!loginDto.email || !loginDto.password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const result = await authService.login(loginDto);

    if (result) {
      // Set httpOnly cookies for tokens
      res.cookie("accessToken", result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 1000, // 1 hour
      });

      res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Return user data (no tokens in response body)
      res.json({
        message: "Login successful",
        user: result.user,
        accessToken: result.token,
      });
    } else {
      res.status(401).json({ message: "Invalid credentials" });
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error during login" });
  }
};
export const googleLogin = async (req: Request, res: Response): Promise<any> => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ message: "Google token is required" });
    }

    const result = await authService.loginWithGoogle(idToken);

    res.cookie("accessToken", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 1000,
    });

    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      message: "Google login successful",
      user: result.user,
      accessToken: result.token,
    });
  } catch (error) {
    console.error("Google login error:", error);
    return res.status(401).json({ message: "Google login failed" });
  }
};
export const refreshToken = async (
  req: Request,
  res: Response,
): Promise<any> => {
  // Get refresh token from httpOnly cookie
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(400).json({ message: "Refresh token is required" });
  }

  try {
    const result = await authService.refreshToken(refreshToken);

    if (!result) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    // Set new tokens in httpOnly cookies
    res.cookie("accessToken", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 1000, // 1 hour
    });

    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({ message: "Tokens refreshed successfully" });
  } catch (error) {
    console.error("Error refreshing token:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const initiateStravaAuth = async (
  req: Request,
  res: Response,
): Promise<any> => {
  try {
    // Get the access token from httpOnly cookie
    let token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      token = req.cookies?.accessToken;
    }

    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Verify the token and get the user
    const user = await authService.authenticateToken(token);

    if (!user) {
      return res.status(401).json({ message: "Invalid token" });
    }

    let userId: string;

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      userId = decoded.userId;

      if (!userId) {
        return res.status(401).json({ message: "Invalid token structure" });
      }
    } catch (jwtError) {
      console.error("❌ JWT verification failed:", jwtError);
      return res.status(401).json({ message: "Invalid token" });
    }

    const isMobile = req.headers["x-mobile-app"] === "true";
    const mobileRedirectUri = req.query.redirectUri as string;

    const statePayload = {
      userId: userId,
      isMobile: isMobile,
      timestamp: Date.now(),
      redirectUri: mobileRedirectUri || null,
    };
    console.log("Is mobile request:", isMobile);

    // Use the existing token as the state parameter
    const state = jwt.sign(statePayload, JWT_SECRET, { expiresIn: "30d" });

    const authorizeUrl = `${STRAVA_AUTHORIZE_URL}?client_id=${STRAVA_CLIENT_ID}&redirect_uri=${encodeURIComponent(
      STRAVA_REDIRECT_URI,
    )}&response_type=code&scope=read_all,activity:read_all,profile:read_all&approval_prompt=auto&state=${encodeURIComponent(state)}`;
    console.log("Authorize URL:", authorizeUrl);

    if (isMobile) {
      // Return URL as JSON for mobile apps
      return res.json({ url: authorizeUrl });
    } else {
      // Redirect for web browsers
      return res.redirect(authorizeUrl);
    }
  } catch (error) {
    console.error("Strava auth initiation error:", error);
    res
      .status(500)
      .json({
        message:
          "Internal server error during Strava authentication initiation",
      });
  }
};

export const stravaCallback = async (
  req: Request,
  res: Response,
): Promise<any> => {
  const FRONTEND_URL = config.FRONTEND_URL;
  const MOBILE_DEEP_LINK = "uraceappfrontend://strava-callback";

  try {
    const { code, error, state } = req.query as {
      code?: string;
      error?: string;
      state?: string;
    };

    if (!state) {
      return res.redirect(`${FRONTEND_URL}?error=missing_state`);
    }

    // Verify the state token to get the user ID
    try {
      const decodedJwt = jwt.verify(state, JWT_SECRET) as {
        userId: string;
        isMobile?: boolean;
        redirectUri?: string;
      };
      if (!decodedJwt?.userId) {
        return res.redirect(`${MOBILE_DEEP_LINK}?error=invalid_state`);
      }

      const loggedInUserId = decodedJwt.userId;
      const isMobile = decodedJwt.isMobile || false;
      const redirectUrl = isMobile
        ? decodedJwt.redirectUri || "uraceappfrontend://strava-callback"
        : FRONTEND_URL;

      if (error) {
        console.error("Strava auth error:", error);
        return res.redirect(
          `${redirectUrl}?error=${encodeURIComponent(error)}`,
        );
      }

      if (!code) {
        return res.redirect(`${redirectUrl}?error=missing_code`);
      }

      const result = await authService.handleStravaCallback(
        code,
        error,
        loggedInUserId,
      );

      // Check if result contains an error
      if (result && result.error) {
        const errorCode = result.error;
        let errorParam = "strava_auth_failed";

        switch (errorCode) {
          case "ALREADY_CONNECTED":
            errorParam = "already_connected";
            break;
          case "STRAVA_ALREADY_CONNECTED":
            errorParam = "strava_already_connected";
            break;
          case "USER_NOT_FOUND":
            errorParam = "user_not_found";
            break;
          case "TOKEN_EXCHANGE_FAILED":
            errorParam = "token_exchange_failed";
            break;
          case "MISSING_CODE":
            errorParam = "missing_code";
            break;
          default:
            errorParam = "strava_auth_failed";
        }

        return res.redirect(`${redirectUrl}?error=${errorParam}`);
      }

      if (!result) {
        return res.redirect(`${redirectUrl}?error=strava_auth_failed`);
      }

      // Simply redirect to frontend with success status
      res.redirect(`${redirectUrl}?success=true`);
    } catch (jwtError) {
      return res.redirect(`${MOBILE_DEEP_LINK}?error=invalid_token`);
    }
  } catch (error) {
    console.error("Strava callback error:", error);
    res.redirect(`${MOBILE_DEEP_LINK}?error=server_error`);
  }
};

export const logout = async (req: Request, res: Response): Promise<any> => {
  try {
    // Clear httpOnly cookies
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const forgotPassword = async (
  req: Request,
  res: Response,
): Promise<any> => {
  try {
    const forgotPasswordDto: ForgotPasswordDto = req.body;

    if (!forgotPasswordDto.email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(forgotPasswordDto.email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const success = await authService.forgotPassword(forgotPasswordDto);

    if (success) {
      // Always return success message for security reasons (don't reveal if email exists)
      res.json({
        message:
          "If an account with this email exists, a password reset email has been sent.",
      });
    } else {
      res
        .status(500)
        .json({ message: "Failed to process password reset request" });
    }
  } catch (error) {
    console.error("Forgot password error:", error);
    res
      .status(500)
      .json({ message: "Internal server error during password reset" });
  }
};

export const changePassword = async (
  req: AuthRequest,
  res: Response,
): Promise<any> => {
  try {
    const changePasswordDto: ChangePasswordDto = req.body;

    // Validate required fields
    if (!changePasswordDto.currentPassword || !changePasswordDto.newPassword) {
      return res
        .status(400)
        .json({ message: "Current password and new password are required" });
    }

    // Validate password strength
    if (changePasswordDto.newPassword.length < 8) {
      return res
        .status(400)
        .json({ message: "New password must be at least 8 characters long" });
    }

    // Get user ID from authenticated request
    const userId = req.user?._id?.toString() || req.user?.userId?.toString();
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const success = await authService.changePassword(userId, changePasswordDto);

    if (success) {
      res.json({ message: "Password changed successfully" });
    } else {
      res
        .status(400)
        .json({
          message:
            "Failed to change password. Please check your current password.",
        });
    }
  } catch (error) {
    console.error("Change password error:", error);
    res
      .status(500)
      .json({ message: "Internal server error during password change" });
  }
};

export const disconnectStrava = async (
  req: AuthRequest,
  res: Response,
): Promise<any> => {
  try {
    // Get user ID from authenticated request
    const userId = req.user?._id?.toString() || req.user?.userId?.toString();
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const result = await authService.disconnectStrava(userId);

    if (result.warning) {
      return res.json({
        success: true,
        message: result.message,
        warning: true,
      });
    }

    return res.json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    console.error("Disconnect Strava error:", error);

    if (error.message === "Not connected to Strava") {
      return res.status(400).json({ message: "No Strava account connected" });
    }

    if (error.message === "User not found") {
      return res.status(401).json({ message: "Authentication required" });
    }

    return res
      .status(500)
      .json({ message: "Failed to disconnect from Strava" });
  }
};
