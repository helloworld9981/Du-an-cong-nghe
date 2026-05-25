import { MongoClient, Db } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';
import config from './env.config';

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

let db: Db | null = null;

export async function getDb(): Promise<Db> {
  if (db) {
    return db;
  }

  const mongoUrl = config.MONGODB_URI;
  const client = new MongoClient(mongoUrl);
  
  await client.connect();
  db = client.db(config.DB_NAME);
  
  return db;
} 