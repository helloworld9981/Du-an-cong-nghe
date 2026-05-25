# urace-backend Docker Setup

This README provides instructions on how to run the urace-backend application using Docker.

## Prerequisites

- Docker installed on your system
- Docker Compose installed on your system

## Quick Start

### 1. Environment Setup

**Create your `.env` file:**

```bash
# Copy the example file
cp env.example .env

# Edit the .env file with your actual values
# For Windows: notepad .env
# For VS Code: code .env
```

**Required environment variables in `.env`:**

```env
# Application Configuration
NODE_ENV=development
PORT=3000

# Database Configuration
DB_NAME=urace
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=password

# Authentication & Security
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production

# Strava API Integration
STRAVA_CLIENT_ID=your-strava-client-id
STRAVA_CLIENT_SECRET=your-strava-client-secret
STRAVA_REDIRECT_URI=http://localhost:3000/auth/strava/callback

# CORS Configuration
FRONTEND_URL=http://localhost:8080
```

### 2. Using Docker Compose (Recommended)

```bash
# Build and start all services
docker-compose up --build

# Run in detached mode
docker-compose up -d --build

# View logs
docker-compose logs -f urace-backend

# Stop services
docker-compose down

# Stop services and remove volumes (data will be lost)
docker-compose down -v
```

### 3. Using Docker Only

If you want to run only the application container:

```bash
# Build the image
docker build -t urace-backend .

# Run with environment file
docker run -p 3000:3000 --env-file .env --name urace-backend urace-backend
```

## How Environment Variables Work

The setup uses a combination of:

1. **`.env` file**: Contains your actual configuration values
2. **`env_file`** in docker-compose: Loads all variables from `.env` into the container
3. **Variable substitution**: Uses `${VARIABLE:-default}` syntax for docker-compose configuration

### Example:
```yaml
# In docker-compose.yml
ports:
  - "${PORT:-3000}:3000"  # Uses PORT from .env, defaults to 3000

# In .env file
PORT=3000
```

## Docker Services

The `docker-compose.yml` includes:

- **urace-backend**: The main Node.js application
- **mongodb**: MongoDB database with persistent storage
- **redis**: Redis for caching and queue management

## Ports

- **3000**: urace-backend application (configurable via PORT in .env)
- **27017**: MongoDB database
- **6379**: Redis cache

## Important Notes

### Container Networking
The docker-compose setup automatically handles networking between containers:
- `MONGO_URI` is automatically set to `mongodb://mongodb:27017/...` (container-to-container)
- `REDIS_URL` is automatically set to `redis://redis:6379` (container-to-container)

### Local Development
For local development (without Docker), update your `.env`:
```env
MONGO_URI=mongodb://admin:password@localhost:27017/urace?authSource=admin
REDIS_URL=redis://localhost:6379
```

## Security Best Practices

1. **Never commit `.env` to git** (it's in `.gitignore`)
2. **Use strong, unique secrets** for JWT tokens
3. **Change default MongoDB credentials** in production
4. **Set proper Strava API credentials**

## Environment Variables Reference

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Application environment | `development` | ✅ |
| `PORT` | Application port | `3000` | ✅ |
| `DB_NAME` | MongoDB database name | `urace` | ✅ |
| `MONGO_ROOT_USERNAME` | MongoDB root username | `admin` | ✅ |
| `MONGO_ROOT_PASSWORD` | MongoDB root password | `password` | ✅ |
| `JWT_SECRET` | JWT signing secret | - | ✅ |
| `JWT_REFRESH_SECRET` | JWT refresh signing secret | - | ✅ |
| `STRAVA_CLIENT_ID` | Strava API client ID | - | ✅ |
| `STRAVA_CLIENT_SECRET` | Strava API client secret | - | ✅ |
| `STRAVA_REDIRECT_URI` | Strava OAuth callback URL | - | ✅ |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:8080` | ✅ |

## Health Checks

The application includes health checks that verify the service is running correctly. You can check the status with:

```bash
# Check container health
docker-compose ps

# Manual health check
curl http://localhost:3000/health
```

## Development

For development with hot reload, you might want to mount your source code:

```yaml
# Add this to the urace-backend service in docker-compose.yml
volumes:
  - ./src:/app/src
  - ./package.json:/app/package.json
command: npm run dev
```

## Troubleshooting

### Common Issues

1. **Port conflicts**: Make sure ports 3000, 27017, and 6379 are not in use
2. **Environment variables**: Ensure all required environment variables are set
3. **Dependencies**: Make sure MongoDB and Redis are healthy before the app starts

### Logs

View application logs:
```bash
docker-compose logs urace-backend
```

View all services logs:
```bash
docker-compose logs
```

### Database Access

Connect to MongoDB:
```bash
docker exec -it urace-mongodb mongosh -u admin -p password
```

Connect to Redis:
```bash
docker exec -it urace-redis redis-cli
```

## Production Considerations

For production deployment:

1. Use environment-specific values for secrets
2. Set up proper MongoDB authentication
3. Configure Redis password protection
4. Use a reverse proxy (nginx) for SSL termination
5. Set up monitoring and logging
6. Consider using Docker Swarm or Kubernetes for orchestration 