import { Collection, Db, ObjectId } from 'mongodb';
import { Event, EventStatus } from '../models/event.model';

class EventData {
  private collection!: Collection<Event>;

  async connect(mongoUri: string, dbName: string) {
    const { MongoClient } = require('mongodb');
    const client = new MongoClient(mongoUri);
    await client.connect();
    const db: Db = client.db(dbName);
    this.collection = db.collection<Event>('Events');
  }

  async insertEvent(event: Event) {
    // Set initial status as Pending
    const eventWithStatus = {
      ...event,
      status: 'Pending' as EventStatus,
      attempts: 0
    };
    return this.collection.insertOne(eventWithStatus);
  }

  async findById(id: ObjectId): Promise<Event | null> {
    return this.collection.findOne({ _id: id });
  }

  async updateEventStatus(eventId: ObjectId, status: EventStatus, error?: string) {
    const update: any = { status };
    if (error) {
      update.error = error;
    }
    return this.collection.updateOne(
      { _id: eventId },
      { $set: update }
    );
  }

  async incrementAttempts(eventId: ObjectId) {
    return this.collection.updateOne(
      { _id: eventId },
      { $inc: { attempts: 1 } }
    );
  }

  async findAll() {
    return this.collection.find({}).toArray();
  }
}

export const eventData = new EventData(); 