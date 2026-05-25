import { Collection, Db, MongoClient, Document } from "mongodb";
import { createLogger } from '../utils/logger';

const logger = createLogger('BaseData');

export abstract class BaseData<T extends Document> {
  protected client: MongoClient | null = null;
  protected db: Db | null = null;
  protected collection: Collection<T> | null = null;

  constructor(protected collectionName: string) {}

  async connect(uri: string, dbName: string): Promise<void> {
    try {
      this.client = new MongoClient(uri);
      await this.client.connect();
      this.db = this.client.db(dbName);
      this.collection = this.db.collection<T>(this.collectionName);
      logger.info('Connected to MongoDB collection', 'connect', { collection: this.collectionName });
    } catch (error) {
      logger.error('Failed to connect to MongoDB collection', 'connect', { 
        collection: this.collectionName, 
        error 
      });                                                                                                                                                                                            
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
      this.collection = null;
    }
  }

  public isConnected(): boolean {
    return this.collection !== null;
  }

  protected ensureConnected(): void {
    if (!this.collection) {
      throw new Error("Database not connected. Call connect() first.");
    }
  }
}
