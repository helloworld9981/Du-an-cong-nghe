import { Request, Response } from "express";
import { userData } from "../data/user.data";

export const getMyLoginStreak = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = (req as any).user?.userId || (req as any).user?._id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    const user = await userData.findById(userId.toString());

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    res.json({
      success: true,
      data: {
        loginStreak: user.loginStreak || 0,
        longestLoginStreak: user.longestLoginStreak || 0,
        lastLoginDate: user.lastLoginDate || null,
        loginDates: user.loginDates || [],
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};