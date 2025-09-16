# Docker Setup for TutorMe API

This document provides instructions for running the TutorMe API using Docker.

## Prerequisites

- Docker and Docker Compose installed on your system
- Git (to clone the repository)

## Local Development

### 1. Build and Run with Docker Compose

```bash
# Build and start all services
docker compose up --build

# Run in detached mode
docker compose up --build -d

# View logs
docker compose logs -f

# Stop services
docker compose down
```

### 2. Access the Application

- **API**: http://localhost:3000
- **Health Check**: http://localhost:3000/healthz
- **MongoDB**: localhost:27017

### 3. Environment Variables

The following environment variables are configured in `docker-compose.yml`:

- `PORT`: 3000
- `MONGODB_URL`: mongodb://admin:password@mongo:27017/tutorme?authSource=admin
- `NODE_ENV`: development
- `JWT_SECRET`: your-jwt-secret-key-here
- `JWT_ACCESS_EXPIRATION_MINUTES`: 30
- `JWT_REFRESH_EXPIRATION_DAYS`: 30
- `JWT_RESET_PASSWORD_EXPIRATION_MINUTES`: 10
- `JWT_VERIFY_EMAIL_EXPIRATION_MINUTES`: 10

### 4. MongoDB Access

To connect to the MongoDB instance directly:

```bash
# Connect to MongoDB container
docker compose exec mongo mongosh -u admin -p password --authenticationDatabase admin

# Or use MongoDB Compass with:
# Connection String: mongodb://admin:password@localhost:27017/tutorme?authSource=admin
```

## Production Deployment on Render

### 1. Prerequisites

- Render account
- MongoDB Atlas cluster or Render MongoDB service
- GitHub repository with the code

### 2. Environment Variables

Set the following environment variables in your Render dashboard:

**Required:**
- `MONGODB_URL`: Your MongoDB connection string
- `JWT_SECRET`: A secure JWT secret key

**Optional (with defaults):**
- `PORT`: 3000
- `NODE_ENV`: production
- `JWT_ACCESS_EXPIRATION_MINUTES`: 30
- `JWT_REFRESH_EXPIRATION_DAYS`: 30
- `JWT_RESET_PASSWORD_EXPIRATION_MINUTES`: 10
- `JWT_VERIFY_EMAIL_EXPIRATION_MINUTES`: 10

**Email Configuration (if using email features):**
- `SMTP_HOST`: Your SMTP server host
- `SMTP_PORT`: Your SMTP server port
- `SMTP_USERNAME`: Your SMTP username
- `SMTP_PASSWORD`: Your SMTP password
- `EMAIL_FROM`: Email address to send from

### 3. Deployment Steps

1. Connect your GitHub repository to Render
2. Render will automatically detect the `Dockerfile` and `render.yaml`
3. Set the required environment variables in the Render dashboard
4. Deploy!

### 4. Health Check

Render will automatically use the `/healthz` endpoint for health checks.

## Docker Commands Reference

```bash
# Build the Docker image
docker build -t tutorme-api .

# Run the container
docker run -p 3000:3000 -e MONGODB_URL="your-mongodb-url" tutorme-api

# View running containers
docker ps

# View container logs
docker logs <container-id>

# Stop and remove containers
docker compose down

# Remove volumes (WARNING: This will delete all data)
docker compose down -v
```

## Troubleshooting

### Common Issues

1. **Port already in use**: Make sure port 3000 is not being used by another application
2. **MongoDB connection failed**: Check if MongoDB container is running and accessible
3. **Permission denied**: Make sure Docker has proper permissions on your system

### Logs

```bash
# View all logs
docker compose logs

# View specific service logs
docker compose logs server
docker compose logs mongo

# Follow logs in real-time
docker compose logs -f
```

### Clean Up

```bash
# Remove all containers and networks
docker compose down

# Remove everything including volumes
docker compose down -v

# Remove images
docker rmi tutorme-api
```

## Security Notes

- Change default MongoDB credentials in production
- Use strong JWT secrets
- Configure proper CORS settings for production
- Use HTTPS in production
- Regularly update base images for security patches
