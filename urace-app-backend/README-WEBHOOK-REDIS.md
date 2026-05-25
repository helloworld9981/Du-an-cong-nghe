# Webhook Redis Integration

This document explains how the Strava webhook integrates with Redis for team member activity processing.

## Overview

When a new workout activity is received from Strava:

1. The webhook handler creates a workout activity record
2. It then checks Redis for the user's teams using the key format `userId:{ObjectId}`
3. For each team, it creates a team member activity record if the workout is relevant to that team/contest
4. Team statistics are automatically updated

## How It Works

### 1. Activity Creation

When Strava sends a webhook event for a new activity:
- The `handleActivityCreate` function processes the activity data
- It creates a workout activity record in the database
- It then calls `processTeamMemberActivities` to handle team-related processing

### 2. Team Lookup via Redis

The `processTeamMemberActivities` function:
- First tries to get the user's teams from Redis cache
- If not found in Redis, falls back to database lookup
- If teams are found from database, it updates the Redis cache

### 3. Team Member Activity Creation

For each team the user belongs to:
- Checks if the team and associated contest are valid
- Verifies the activity date is within the contest period
- Creates a team member activity record using `teamMemberActivityService.createFromWorkout()`

## Testing with the Script

You can test this integration using the `test-webhook-redis.js` script:

```
node scripts/test-webhook-redis.js <userId>
```

This script:
1. Connects to MongoDB and Redis
2. Checks Redis for the user's teams
3. Creates a sample workout activity
4. Processes team member activities simulating the webhook flow
5. Displays detailed logs of what's happening

### Example Output

```
Testing webhook Redis integration for user 6056e1234a78bc90d1234567...
Connected to MongoDB
Found user: john.doe@example.com, Strava ID: 12345678
Connected to Redis
Teams in Redis cache: 2
- Team: Running Team, Members: 5
- Team: Marathon Team, Members: 3

Creating sample activity...
Created workout activity with ID: 6056e9876a78bc90d9876543

Processing team member activities...
Found 2 teams to process
Created team member activity for team Running Team with ID: 6056e9876a78bc90d9876544
Activity outside contest 6056e1234a78bc90d1234570 date range, skipping

Test completed successfully!
```

## Manual Testing

You can also manually test the integration:

1. Add a user to a team
2. Verify the Redis cache using `verify-redis-cache.js`
3. Create a Strava activity for that user (through the Strava API or app)
4. Check that team member activities are created
5. Verify that team statistics are updated

## Troubleshooting

If team member activities aren't being created:

1. Check the Redis connection is working
2. Verify the user is a member of at least one team
3. Ensure the activity date is within a contest's date range
4. Check server logs for errors in the `processTeamMemberActivities` function
5. Make sure the user's Strava account is properly connected 