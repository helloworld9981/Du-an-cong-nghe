import { Request, Response } from 'express';
import { workoutActivityData } from '../data/workout-activity.data';
import { ObjectId } from 'mongodb';
import dotenv from "dotenv";
import path from "path";
import axios from 'axios';
import { StravaTokenService } from '../services/strava-token.service';
import { userData } from '../data/user.data';
import { redisService } from '../services/redis.service';
import { workoutActivityService } from '../services/workout-activity.service';
import { teamMemberActivityService } from '../services/team-member-activity.service';
import { contestData } from '../data/contest.data';
import { teamData } from '../data/team.data';
import { redisQueueService, RedisQueueService } from '../services/redis-queue.service';
import { eventData } from '../data/event.data';
import { Collection, Db } from 'mongodb';
import { Event } from '../models/event.model';
import config from '../config/env.config';
import { createLogger } from '../utils/logger';

const logger = createLogger('StravaWebhookController');

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

// Webhook verification endpoint
export const verifyWebhook = (req: Request, res: Response) => {
  const VERIFY_TOKEN = config.STRAVA_WEBHOOK_VERIFY_TOKEN;
  
  // Verify token from Strava
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      logger.info('Strava webhook verified successfully', 'verifyWebhook', { mode, challenge });
      res.json({ "hub.challenge": challenge });
    } else {
      res.sendStatus(403);
    }
  }
};

// Webhook event handler
export const handleWebhookEvent = async (req: Request, res: Response) => {
  try {
    const event = req.body;
    logger.info('Received Strava webhook event', 'handleWebhook', { 
      eventType: event.aspect_type, 
      objectType: event.object_type, 
      objectId: event.object_id, 
      ownerId: event.owner_id 
    });

    // Store event in database and get the inserted ID
    const insertedEvent = await eventData.insertEvent({
      ...event,
      received_at: new Date()
    });

    if (!insertedEvent.insertedId) {
      throw new Error('Failed to insert event into database');
    }

    // Push to single queue with event type
    const messageId = await redisQueueService.pushToQueue(
      RedisQueueService.ACTIVITY_QUEUE,
      {
        type: event.aspect_type,
        event
      },
      insertedEvent.insertedId.toString()
    );

    logger.info('Strava webhook event queued for processing', 'handleWebhook', { 
      messageId, 
      mongoId: insertedEvent.insertedId, 
      eventType: event.aspect_type 
    });

    // Return immediately to Strava with 200 OK
    res.status(200).send('OK');
  } catch (error) {
    logger.error('Strava webhook handling error', 'handleWebhook', { error, eventData: req.body });
    // Still return 200 to Strava to avoid retries, but log the error
    res.status(200).json({ message: 'Error processing webhook event, queued for retry' });
  }
};