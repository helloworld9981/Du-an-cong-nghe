# Redis Queue Architecture for Strava Webhook Processing

This document explains the Redis queue-based architecture implemented for processing Strava webhook events.

## Overview

We've redesigned the webhook handler to use a queue-based approach:

1. When a webhook event is received, it's immediately pushed to a Redis queue
2. A separate worker process consumes events from the queue and processes them
3. This decouples the webhook receipt from the processing, improving reliability and scalability

## Components

### 1. Redis Queue Service (`redis-queue.service.ts`)

The central component that manages the queues:

- **Activity Queue**: Main queue for incoming activities (`activity:queue`)
- **Processing Queue**: For activities currently being processed (`activity:processing`)
- **Failed Queue**: For activities that failed processing (`activity:failed`)

### 2. Webhook Controller (`strava-webhook.controller.ts`)

Receives webhook events from Strava and:
- Validates the event
- Pushes events to the Redis queue
- Returns an immediate 200 OK response to Strava

### 3. Activity Worker (`activity-worker.ts`)

A separate process that:
- Pulls events from the queue
- Processes each event based on type (create/update/delete)
- For activity creates, uses Redis to check for user teams
- Creates team member activities for relevant teams
- Handles failures with retries and dead-letter queue

## How It Works

### Event Flow

1. Strava sends a webhook event to the `/webhook` endpoint
2. The webhook controller validates and immediately pushes to Redis queue
3. The worker process retrieves the event from the queue
4. The worker processes the event (creates workout, team member activities, etc.)
5. Processing success/failure is tracked, with retry mechanisms

### Queue Management

- Messages are stored in Redis lists
- The worker uses blocking pop operations to efficiently wait for new messages
- Failed messages are retried up to 3 times before moving to the failed queue
- Processing state is tracked to ensure no messages are lost

## Running the Worker

To run the activity worker process:

```bash
# Production mode
npm run worker

# Development mode with auto-reload
npm run worker:dev
```

It's recommended to run the worker as a separate process from the main API server.

## Architecture Benefits

1. **Reliability**: If processing fails, the event stays in the queue for retry
2. **Scalability**: Multiple workers can process events in parallel
3. **Responsiveness**: API server can respond quickly to Strava without waiting for processing
4. **Visibility**: Failed events are stored for inspection and manual retry
5. **Resource isolation**: Processing doesn't impact API performance

## Monitoring and Maintenance

To monitor the queue:

1. Check queue lengths:
   ```
   redis-cli
   > LLEN activity:queue
   > LLEN activity:processing
   > LLEN activity:failed
   ```

2. Inspect failed messages:
   ```
   redis-cli
   > LRANGE activity:failed 0 -1
   ```

3. Manually move a message back to the main queue:
   ```
   redis-cli
   > RPOPLPUSH activity:failed activity:queue
   ```

## Testing

You can test the queue system without real Strava events using:

1. The included test script `test-webhook-redis.js`
2. A manual Redis push:
   ```
   redis-cli
   > LPUSH activity:queue "{\"id\":\"test123\",\"data\":{\"type\":\"create\",\"event\":{\"object_type\":\"activity\",\"object_id\":12345}},\"timestamp\":1621234567890,\"attempts\":0}"
   ```

## Troubleshooting

If events aren't being processed:

1. Check Redis connection (`redis-cli ping`)
2. Verify the worker is running (`ps aux | grep worker`)
3. Check for errors in the worker logs
4. Inspect the failed queue for common error patterns 