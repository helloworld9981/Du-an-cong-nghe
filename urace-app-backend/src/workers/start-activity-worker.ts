import { activityWorker } from './activity-worker';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down worker...');
  activityWorker.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down worker...');
  activityWorker.stop();
  process.exit(0);
});

// Start the worker
console.log('Starting activity worker...');
activityWorker.start().catch(err => {
  console.error('Failed to start activity worker:', err);
  process.exit(1);
}); 