# Activity Worker Docker Setup

This guide explains how to set up and run the Activity Worker using Docker.

## Prerequisites

- Docker and Docker Compose installed
- Node.js 18+ (for development mode)
- `.env` file configured (copy from `env.example`)

## Quick Start

### Option 1: Using the Management Scripts (Recommended)

#### For Linux/macOS:
```bash
# Make the script executable (first time only)
chmod +x scripts/run-worker.sh

# Build the worker image
./scripts/run-worker.sh build

# Start the worker with dependencies
./scripts/run-worker.sh start

# View logs
./scripts/run-worker.sh logs
```

#### For Windows PowerShell:
```powershell
# Build the worker image
.\scripts\run-worker.ps1 build

# Start the worker with dependencies
.\scripts\run-worker.ps1 start

# View logs
.\scripts\run-worker.ps1 logs
```

### Option 2: Using Docker Commands Directly

```bash
# Build the worker image
docker build -f Dockerfile.worker -t urace-activity-worker .

# Start with dependencies
docker-compose -f docker-compose.worker.yml up -d

# View logs
docker-compose -f docker-compose.worker.yml logs -f activity-worker

# Stop everything
docker-compose -f docker-compose.worker.yml down
```

## Files Created

This setup creates the following files:

- **`Dockerfile.worker`** - Multi-stage Docker build for the worker
- **`docker-compose.worker.yml`** - Complete stack with MongoDB, Redis, and the worker
- **`scripts/run-worker.sh`** - Bash script for easy management (Linux/macOS)
- **`scripts/run-worker.ps1`** - PowerShell script for Windows

## Configuration

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# MongoDB Configuration
MONGO_URI=mongodb://admin:password@localhost:27017/urace?authSource=admin
DB_NAME=urace
MONGO_USERNAME=admin
MONGO_PASSWORD=password

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Strava API Configuration
STRAVA_CLIENT_ID=your_strava_client_id
STRAVA_CLIENT_SECRET=your_strava_client_secret

# Other environment variables as needed
```

### Docker Compose Configuration

The `docker-compose.worker.yml` includes:

- **MongoDB** - Database for storing application data
- **Redis** - Queue system for processing activities
- **Activity Worker** - Your worker application

## Development Mode

For development with hot reloading:

```bash
# Linux/macOS
./scripts/run-worker.sh dev

# Windows
.\scripts\run-worker.ps1 dev

# Or directly
npm run worker:dev
```

## Available Commands

### Management Script Commands:

| Command | Description |
|---------|-------------|
| `build` | Build the worker Docker image |
| `start` | Start the worker and dependencies |
| `stop` | Stop the worker and dependencies |
| `restart` | Restart the worker and dependencies |
| `logs` | Show worker logs (follow mode) |
| `dev` | Run in development mode with file watching |
| `clean` | Remove containers and volumes |

### Docker Compose Commands:

```bash
# Start in background
docker-compose -f docker-compose.worker.yml up -d

# Start with logs
docker-compose -f docker-compose.worker.yml up

# Stop services
docker-compose -f docker-compose.worker.yml down

# Stop and remove volumes
docker-compose -f docker-compose.worker.yml down -v

# View logs
docker-compose -f docker-compose.worker.yml logs -f activity-worker

# Rebuild and restart
docker-compose -f docker-compose.worker.yml up --build -d
```

## Architecture

### Multi-Stage Dockerfile

The `Dockerfile.worker` uses a multi-stage build:

1. **Build Stage**: Installs dependencies and compiles TypeScript
2. **Production Stage**: Creates optimized image with only production dependencies

### Key Features

- **Security**: Runs as non-root user
- **Signal Handling**: Uses `dumb-init` for proper signal handling
- **Health Checks**: Monitors worker process health
- **Optimization**: Minimal production image size
- **Graceful Shutdown**: Handles SIGTERM/SIGINT signals properly

### Dependencies

The worker requires:
- MongoDB for data storage
- Redis for queue management
- Environment variables for configuration

## Monitoring

### Health Checks

The Docker setup includes health checks for all services:

```bash
# Check service health
docker-compose -f docker-compose.worker.yml ps

# View health check logs
docker inspect urace-activity-worker --format='{{.State.Health}}'
```

### Logs

```bash
# View worker logs
docker-compose -f docker-compose.worker.yml logs activity-worker

# Follow logs in real-time
docker-compose -f docker-compose.worker.yml logs -f activity-worker

# View all services logs
docker-compose -f docker-compose.worker.yml logs
```

## Troubleshooting

### Common Issues

1. **Port Conflicts**: Ensure ports 27017 (MongoDB) and 6379 (Redis) are available
2. **Environment Variables**: Check `.env` file exists and has correct values
3. **Docker Permissions**: Ensure Docker daemon is running and accessible

### Debug Mode

To run with debug output:

```bash
# Set debug environment variable
docker-compose -f docker-compose.worker.yml exec activity-worker npm run worker:dev
```

### Logs Location

Logs are handled by Docker's logging system. To persist logs:

```yaml
# Add to docker-compose.worker.yml under activity-worker service
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

## Production Considerations

### Scaling

To run multiple worker instances:

```bash
# Scale to 3 worker instances
docker-compose -f docker-compose.worker.yml up -d --scale activity-worker=3
```

### Monitoring

Consider adding monitoring tools:
- Prometheus for metrics
- Grafana for dashboards
- ELK stack for log analysis

### Security

- Use Docker secrets for sensitive data
- Regular security updates for base images
- Network isolation with custom Docker networks

## Next Steps

1. Configure your `.env` file with actual values
2. Build and start the worker: `./scripts/run-worker.sh build && ./scripts/run-worker.sh start`
3. Monitor logs: `./scripts/run-worker.sh logs`
4. Set up monitoring and alerting for production use 