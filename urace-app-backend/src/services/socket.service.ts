import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import config from "../config/env.config";
import { createLogger } from "../utils/logger";

class SocketService {
  private io: Server | null = null;
  private logger = createLogger("SocketService");

  public initialize(httpServer: HttpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    this.io.use((socket, next) => {
      const token =
        socket.handshake.auth.token ||
        socket.handshake.headers.authorization?.split(" ")[1];

      if (!token) {
        this.logger.warn("Connection attempt without token", "middleware");
        return next(new Error("Authentication error: No token provided"));
      }

      try {
        const decoded = jwt.verify(token, config.JWT_SECRET) as {
          userId: string;
        };
        socket.data.userId = decoded.userId;
        next();
      } catch (err) {
        this.logger.error("Invalid token during connection", "middleware", {
          error: err,
        });
        return next(new Error("Authentication error: Invalid token"));
      }
    });

    this.io.on("connection", (socket) => {
      this.handleConnection(socket);
    });

    this.logger.info("Socket.IO initialized", "initialize");
  }

  private handleConnection(socket: Socket) {
    const userId = socket.data.userId;
    this.logger.info(`User connected: ${userId}`, "handleConnection", {
      socketId: socket.id,
    });

    socket.join(`user:${userId}`);

    socket.on("disconnect", () => {
      this.logger.info(`User disconnected: ${userId}`, "handleConnection");
    });
  }

  public emitToUser(userId: string, type: string, payload: any) {
    if (!this.io) {
      this.logger.error("Socket.IO not initialized", "emitToUser");
      return;
    }

    this.logger.info(`Sending ${type} to user ${userId}`, "emitToUser");
    this.io.to(`user:${userId}`).emit(type, payload);
  }

  public emitToAll(type: string, payload: any) {
    if (!this.io) {
      return;
    }
    this.io.emit(type, payload);
  }
}

export const socketService = new SocketService();
