# Redis Implementation for User Team Caching

This application uses Redis to cache user team relationships, improving performance for team-related operations.

## Setup

1. Install Redis on your system (https://redis.io/download)
2. Add the following to your `.env` file:
   ```
   REDIS_URL=redis://localhost:6379
   ```
   If using a Redis server with authentication:
   ```
   REDIS_URL=redis://username:password@your-redis-host:6379
   ```

## Features

- **User team membership caching**: Whenever a user is added to or removed from a team, the Redis cache is updated
- **Team lookup optimization**: When fetching a user's teams, the application first checks Redis cache before querying the database
- **Fault tolerance**: If Redis is unavailable, the application falls back to standard database queries

## Key Format

Redis keys follow this format:
- User's teams: `userId:{ObjectId}` storing a JSON array of team IDs

## API Endpoints

- `GET /user/teams` - Get teams for the authenticated user (uses Redis cache)
- `GET /users/:userId/teams` - Get teams for a specific user (uses Redis cache)

## Testing Redis

You can verify Redis is working by:

1. Adding a user to a team
2. Using the Redis CLI to check the cache:
   ```
   redis-cli
   > GET "userId:123456789" 
   ```
   This should return a JSON array of team IDs

## Troubleshooting

If Redis connection fails:
1. Check that Redis is running: `redis-cli ping` (should return PONG)
2. Verify your REDIS_URL is correct in the .env file
3. Check the application logs for connection errors 