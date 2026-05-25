import express, { RequestHandler } from "express";
import { createServer } from "http";
import cors from "cors";
import cookieParser from "cookie-parser";
import {
  register,
  login,
  googleLogin,
  refreshToken,
  logout,
  forgotPassword,
  changePassword,
  initiateStravaAuth,
  stravaCallback,
  disconnectStrava,
} from "./controllers/auth.controller";
import {
  createGroup,
  getGroup,
  updateGroup,
  deleteGroup,
  leaveGroup,
  getAllGroups,
  getGroupMembers,
  addGroupMember,
  removeGroupMember,
  updateMemberRole,
  requestToJoinGroup,
  getPendingJoinRequests,
  approveJoinRequest,
  rejectJoinRequest,
  getUserRole,
  getUserJoinRequestStatus,
  revokeJoinRequest,
} from "./controllers/group.controller";
import {
  createContest,
  getContest,
  updateContest,
  deleteContest,
  createTeam,
  addMemberToTeam,
  addMultipleMembersToTeam,
  removeMemberFromTeam,
  getTeamsForContest,
  getUserTeams,
  getContestsForGroup,
  getIndividualContestLeaderboard,
  getIndividualContestActivities,
  addParticipantToContest,
  addMultipleParticipantsToContest,
  removeParticipantFromContest,
  getContestParticipants,
  getAvailableContestParticipants,
  getContestTeamLeaderboard,
  getTeamStats,
  getAllContests,
  getContestTeamStats,
  syncActivityData,
  getTeamMemberLeaderboard,
  getTeamMemberActivities as getContestTeamMemberActivities,
  getTeamContestActivities,
} from "./controllers/contest.controller";
import {
  getUserProfile,
  updateUserProfile,
  getUserById,
  getUserActivities,
  searchUsers,
  syncStravaActivities,
  createSystemActivity,
  syncHealthConnectData,
} from "./controllers/user.controller";
import {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
} from "./controllers/notification.controller";
import {
  getTeamDetail,
  getTeamMemberActivities,
} from "./controllers/team.controller";
import {
  rejectActivity,
  restoreActivity,
  getRejectedActivities,
} from "./controllers/activity-moderation.controller";
import { userData } from "./data/user.data";
import { getMyLoginStreak } from "./controllers/streak.controller";
import {
  authenticateToken,
  authenticateApiKey,
} from "./middleware/auth.middleware";
import { rateLimitMiddleware } from "./middleware/rate-limit.middleware";
import dotenv from "dotenv";
import path from "path";
import { groupData } from "./data/group.data";
import { groupMemberData } from "./data/group-member.data";
import { contestData } from "./data/contest.data";
import { teamData } from "./data/team.data";
import { workoutActivityData } from "./data/workout-activity.data";
import { teamMemberActivityData } from "./data/team-member-activity.data";
import { individualContestActivityData } from "./data/individual-contest-activity.data";
import {
  verifyWebhook,
  handleWebhookEvent,
} from "./controllers/strava-webhook.controller";
import { redisService } from "./services/redis.service";
import { redisQueueService } from "./services/redis-queue.service";
import { eventData } from "./data/event.data";
import { notificationData } from "./data/notification.data";
import config from "./config/env.config";
import {
  requestLogger,
  errorLogger,
  responseTimeMiddleware,
} from "./middleware/logging.middleware";
import { createLogger } from "./utils/logger";
import { socketService } from "./services/socket.service";
import { contestProgressReminderData } from "./data/contest-progress-reminder.data";
import { contestReminderWorker } from "./workers/contest-reminder-worker";
import { reminderQueueConsumer } from "./workers/reminder-queue-consumer";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = express();
const port = process.env.PORT || 3000;
const appLogger = createLogger("app");

// ngrok setup
const ngrok = require("ngrok");

// Response time tracking
app.use(responseTimeMiddleware);

// Request logging
app.use(requestLogger);

// CORS configuration
const allowedOrigins = [
  "http://localhost:8081",
  "http://localhost:19006",
  "http://localhost:19000",
  "https://urace-app.netlify.app",
  "https://urace.netlify.app",
  "https://dazzling-conkies-f25f07.netlify.app",
];

const corsOptions = {
  origin: (origin: any, callback: any) => {
    console.log("Incoming Request Origin:", origin);

    // Allow requests with no origin (mobile apps)
    if (!origin) {
      return callback(null, true);
    }

    // Allow localhost
    if (
      origin.startsWith("http://localhost:") ||
      origin.startsWith("http://127.0.0.1:")
    ) {
      return callback(null, true);
    }

    // Allow Expo URLs
    if (
      origin.endsWith(".exp.direct") ||
      origin.includes("expo.dev") ||
      origin.includes("exp.host")
    ) {
      return callback(null, true);
    }

    // Check allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.log("❌ Blocked by CORS:", origin);
    return callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
    "x-mobile-app",
  ],
  credentials: true,
  optionsSuccessStatus: 204,
};

// Apply CORS middleware
app.use(cors(corsOptions));

app.use(express.json()); // For parsing request bodies
app.use(cookieParser()); // For parsing cookies
app.use(express.static(path.join(__dirname, "../public"))); // Serve static files

async function startServer() {
  await userData.connect(config.MONGODB_URI, config.DB_NAME);
  await groupData.connect(config.MONGODB_URI, config.DB_NAME);
  await groupMemberData.connect(config.MONGODB_URI, config.DB_NAME);
  await contestData.connect(config.MONGODB_URI, config.DB_NAME);
  await teamData.connect(config.MONGODB_URI, config.DB_NAME);
  await workoutActivityData.connect(config.MONGODB_URI, config.DB_NAME);
  await teamMemberActivityData.connect(config.MONGODB_URI, config.DB_NAME);
  await individualContestActivityData.connect(
    config.MONGODB_URI,
    config.DB_NAME,
  );
  await eventData.connect(config.MONGODB_URI, config.DB_NAME);
  await notificationData.connect(config.MONGODB_URI, config.DB_NAME);
  await contestProgressReminderData.connect(config.MONGODB_URI, config.DB_NAME);

  // Connect to Redis and Redis Queue
  await redisService.connect();
  await redisQueueService.connect();

  // Auth routes
  app.post("/api/register", register as RequestHandler);
  app.post("/api/login", login as RequestHandler);
  app.post("/api/auth/google", googleLogin as RequestHandler);
  app.post("/api/refresh-token", refreshToken as RequestHandler);
  app.post("/api/logout", logout as RequestHandler);
  app.post("/api/forgot-password", forgotPassword as RequestHandler);
  app.put(
    "/api/change-password",
    authenticateToken,
    changePassword as RequestHandler,
  );
  app.post(
    "/api/user/disconnect-strava",
    authenticateToken,
    disconnectStrava as RequestHandler,
  );
  app.get("/api/connect/strava", initiateStravaAuth as RequestHandler);
  app.get("/api/auth/strava/callback", stravaCallback as RequestHandler);

  //hellcare F**
  app.post(
  "/api/user/sync-health-connect",
  authenticateToken,
  syncHealthConnectData as RequestHandler,
);
  // Group routes - all protected with authenticateToken middleware
  // Streak routes 
app.get(
  "/api/user/login-streak",
  authenticateToken,
  getMyLoginStreak as RequestHandler,
);

  app.post("/api/groups", authenticateToken, createGroup as RequestHandler);
  app.get("/api/groups/:id", authenticateToken, getGroup as RequestHandler);
  app.put("/api/groups/:id", authenticateToken, updateGroup as RequestHandler);
  app.delete(
    "/api/groups/:id",
    authenticateToken,
    deleteGroup as RequestHandler,
  );
  app.post(
  "/api/groups/:id/leave",
  authenticateToken,
  leaveGroup as RequestHandler,
  );
  app.get("/api/groups", authenticateToken, getAllGroups as RequestHandler);
  app.get(
    "/api/groups/:id/contests",
    authenticateToken,
    getContestsForGroup as RequestHandler,
  );

  // Member management routes
  app.get(
    "/api/groups/:id/members",
    authenticateToken,
    getGroupMembers as RequestHandler,
  );
  app.post(
    "/api/groups/:id/members",
    authenticateToken,
    addGroupMember as RequestHandler,
  );
  app.delete(
    "/api/groups/:id/members/:userId",
    authenticateToken,
    removeGroupMember as RequestHandler,
  );
  app.put(
    "/api/groups/:id/members/:userId/role",
    authenticateToken,
    updateMemberRole as RequestHandler,
  );
  app.get(
    "/api/groups/:id/role",
    authenticateToken,
    getUserRole as RequestHandler,
  );

  // Join request routes
  app.post(
    "/api/groups/:id/join",
    authenticateToken,
    requestToJoinGroup as RequestHandler,
  );
  app.get(
    "/api/groups/:id/requests",
    authenticateToken,
    getPendingJoinRequests as RequestHandler,
  );
  app.post(
    "/api/groups/:id/requests/:userId/approve",
    authenticateToken,
    approveJoinRequest as RequestHandler,
  );
  app.post(
    "/api/groups/:id/requests/:userId/reject",
    authenticateToken,
    rejectJoinRequest as RequestHandler,
  );
  app.get(
    "/api/groups/:id/join-status",
    authenticateToken,
    getUserJoinRequestStatus as RequestHandler,
  );
  app.delete(
    "/api/groups/:id/join",
    authenticateToken,
    revokeJoinRequest as RequestHandler,
  );

  // Contest routes - all protected with authenticateToken middleware
  app.get("/api/contests", authenticateToken, getAllContests as RequestHandler);
  app.post("/api/contests", authenticateToken, createContest as RequestHandler);
  app.get("/api/contests/:id", authenticateToken, getContest as RequestHandler);
  app.put(
    "/api/contests/:id",
    authenticateToken,
    updateContest as RequestHandler,
  );
  app.delete(
    "/api/contests/:id",
    authenticateToken,
    deleteContest as RequestHandler,
  );
  app.get(
    "/api/contests/:id/teams",
    authenticateToken,
    getTeamsForContest as RequestHandler,
  );
  app.get(
    "/api/contests/:id/leaderboard",
    authenticateToken,
    getIndividualContestLeaderboard as RequestHandler,
  );
  app.get(
    "/api/contests/:id/users/:userId/activities",
    authenticateToken,
    getIndividualContestActivities as RequestHandler,
  );
  app.get(
    "/api/contests/:id/participants",
    authenticateToken,
    getContestParticipants as RequestHandler,
  );
  app.get(
    "/api/contests/:contestId/available-participants",
    authenticateToken,
    getAvailableContestParticipants as RequestHandler,
  );
  app.get(
    "/api/contests/:id/team-leaderboard",
    authenticateToken,
    getContestTeamLeaderboard as RequestHandler,
  );
  app.get(
    "/api/contests/:id/team-member-leaderboard",
    authenticateToken,
    getTeamMemberLeaderboard as RequestHandler,
  );
  app.get(
    "/api/contests/:contestId/team-members/:userId/activities",
    authenticateToken,
    getContestTeamMemberActivities as RequestHandler,
  );
  app.post(
    "/api/contests/:contestId/participants",
    authenticateToken,
    addParticipantToContest as RequestHandler,
  );
  app.post(
    "/api/contests/:contestId/participants/bulk",
    authenticateToken,
    addMultipleParticipantsToContest as RequestHandler,
  );
  app.delete(
    "/api/contests/:contestId/participants/:participantId",
    authenticateToken,
    removeParticipantFromContest as RequestHandler,
  );

  // Activity Moderation routes (Admin only - for rejecting fraudulent activities)
  app.post(
    "/api/contests/:contestId/activities/:activityId/reject",
    authenticateToken,
    rejectActivity as RequestHandler,
  );
  app.post(
    "/api/contests/:contestId/activities/:activityId/restore",
    authenticateToken,
    restoreActivity as RequestHandler,
  );
  app.get(
    "/api/contests/:contestId/rejected-activities",
    authenticateToken,
    getRejectedActivities as RequestHandler,
  );

  // Admin/Developer route for manual activity data sync
  app.post(
    "/api/admin/sync-activity-data",
    authenticateApiKey,
    syncActivityData as RequestHandler,
  );

  // Team management within contests
  app.post(
    "/api/contests/:contestId/teams",
    authenticateToken,
    createTeam as RequestHandler,
  );
  app.post(
    "/api/teams/:teamId/members",
    authenticateToken,
    addMemberToTeam as RequestHandler,
  );
  app.post(
    "/api/teams/:teamId/members/bulk",
    authenticateToken,
    addMultipleMembersToTeam as RequestHandler,
  );
  app.delete(
    "/api/teams/:teamId/members/:userId",
    authenticateToken,
    removeMemberFromTeam as RequestHandler,
  );

  // Team detail routes
  app.get("/api/teams/:id", authenticateToken, getTeamDetail as RequestHandler);
  app.get(
    "/api/teams/:teamId/stats",
    authenticateToken,
    getTeamStats as RequestHandler,
  );
  app.get(
    "/api/teams/:teamId/members/:userId/activities",
    authenticateToken,
    getTeamMemberActivities as RequestHandler,
  );
  app.get(
    "/api/contests/:contestId/teams/:teamId/stats",
    authenticateToken,
    getContestTeamStats as RequestHandler,
  );
  app.get(
    "/api/contests/:contestId/teams/:teamId/activities",
    authenticateToken,
    getTeamContestActivities as RequestHandler,
  );

  // User teams route
  app.get("/api/user/teams", authenticateToken, getUserTeams as RequestHandler);
  app.get(
    "/api/users/:userId/teams",
    authenticateToken,
    getUserTeams as RequestHandler,
  );

  // User profile route
  app.get(
    "/api/user/profile",
    authenticateToken,
    getUserProfile as RequestHandler,
  );
  app.put(
    "/api/user/profile",
    authenticateToken,
    updateUserProfile as RequestHandler,
  );

  // User search route (must come before /:id route)
  app.get(
    "/api/users/search",
    authenticateToken,
    searchUsers as RequestHandler,
  );
  app.get("/api/users/:id", authenticateToken, getUserById as RequestHandler);

  // User activities route
  app.get(
    "/api/user/activities",
    authenticateToken,
    getUserActivities as RequestHandler,
  );

  // Strava sync route - with rate limiting (5 requests per hour)
  app.post(
    "/api/user/sync-strava",
    authenticateToken,
    rateLimitMiddleware({
      action: "strava-sync",
      maxRequests: 5,
      windowSeconds: 3600, // 1 hour
      message:
        "Too many sync requests. You can sync up to 5 times per hour. Please try again later.",
    }),
    syncStravaActivities as RequestHandler,
  );

  app.get(
    "/api/notifications",
    authenticateToken,
    getUserNotifications as RequestHandler,
  );
  app.put(
    "/api/notifications/:id/read",
    authenticateToken,
    markAsRead as RequestHandler,
  );
  app.put(
    "/api/notifications/read-all",
    authenticateToken,
    markAllAsRead as RequestHandler,
  );

  // Strava webhook routes
  app.get("/api/webhook", verifyWebhook as RequestHandler);
  app.post("/api/webhook", handleWebhookEvent as RequestHandler);

  // system activity
  app.post(
    "/api/user/activities/system",
    authenticateToken,
    createSystemActivity as RequestHandler,
  );

  // Error logging middleware (must be after routes)
  app.use(errorLogger);

  const httpServer = createServer(app);
  socketService.initialize(httpServer);

  httpServer.listen(port, async () => {
    console.log(`Server is running on port ${port}`);
    try {
      const url = await ngrok.connect(port);
      console.log(`Ngrok tunnel is live at: ${url}`);
    } catch (err) {
      console.error("Error while connecting ngrok", err);
    }
    appLogger.info("Server started successfully", "startServer", {
      port,
      environment: process.env.NODE_ENV || "development",
      database: config.DB_NAME,
    });

    contestReminderWorker.start("0 * * * *"); // hourly
    appLogger.info("Contest reminder worker started (hourly)", "startServer");

    reminderQueueConsumer.start().catch((error) => {
      appLogger.error(
        "Failed to start reminder queue consumer",
        "startServer",
        {
          error: error.message,
        },
      );
    });
    appLogger.info("Reminder queue consumer started", "startServer");
  });
}

startServer().catch((error) => {
  appLogger.error("Failed to start server", "startServer", {
    error: error.message,
    stack: error.stack,
  });
  process.exit(1);
});
