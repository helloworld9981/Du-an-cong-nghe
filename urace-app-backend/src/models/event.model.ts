import { ObjectId } from 'mongodb';

export type EventStatus = 'Pending' | 'Processing' | 'Successful' | 'Failed';

export interface Event {
  _id?: ObjectId;
  aspect_type: string;
  event_time: number;
  object_id: number;
  object_type: string;
  owner_id: number;
  subscription_id: number;
  updates?: Record<string, any>;
  received_at: Date;
  status: EventStatus;
  attempts?: number;
  error?: string;
} 