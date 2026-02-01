# Docker Setup for MultimodAI

This guide explains how to build and run MultimodAI using Docker.

## Prerequisites

- Docker and Docker Compose installed
- Environment variables configured (see below)

## Quick Start

1. **Create environment files:**

   Backend `.env` file in `backend/` directory:
   ```env
   PORT=3001
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRES_IN=7d
   OPENAI_API_KEY=your_openai_api_key
   GOOGLE_OAUTH_CLIENT_ID=your_google_oauth_client_id
   GOOGLE_OAUTH_CLIENT_SECRET=your_google_oauth_client_secret
   CORS_ORIGIN=http://localhost:3000
   FRONTEND_URL=http://localhost:3000
   ```

   Root `.env` file for docker-compose:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRES_IN=7d
   OPENAI_API_KEY=your_openai_api_key
   GOOGLE_OAUTH_CLIENT_ID=your_google_oauth_client_id
   GOOGLE_OAUTH_CLIENT_SECRET=your_google_oauth_client_secret
   CORS_ORIGIN=http://localhost:3000
   FRONTEND_URL=http://localhost:3000
   NEXT_PUBLIC_API_URL=https://openai-api-965239735739.europe-west1.run.app
   ```

2. **Build and run with Docker Compose:**
   ```bash
   docker-compose up --build
   ```

3. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

## Individual Service Builds

### Backend Only

```bash
cd backend
docker build -t multimodai-backend .
docker run -p 3001:3001 --env-file .env multimodai-backend
```

### Frontend Only

```bash
cd frontend
docker build -t multimodai-frontend --build-arg NEXT_PUBLIC_API_URL=https://openai-api-965239735739.europe-west1.run.app .
docker run -p 3000:3000 -e NEXT_PUBLIC_API_URL=https://openai-api-965239735739.europe-west1.run.app multimodai-frontend
```

## Production Deployment

For production, make sure to:

1. Update `NEXT_PUBLIC_API_URL` to your production backend URL
2. Update `CORS_ORIGIN` and `FRONTEND_URL` to your production domain
3. Use secure secrets for `JWT_SECRET` and API keys
4. Consider using Docker secrets or a secrets management service

## Docker Compose Commands

- **Start services:** `docker-compose up`
- **Start in background:** `docker-compose up -d`
- **Rebuild and start:** `docker-compose up --build`
- **Stop services:** `docker-compose down`
- **View logs:** `docker-compose logs -f`
- **View specific service logs:** `docker-compose logs -f backend` or `docker-compose logs -f frontend`

## Health Checks

Both services include health checks:
- Backend: `http://localhost:3001/health`
- Frontend: `http://localhost:3000`

You can check health status with:
```bash
docker-compose ps
```

## Troubleshooting

1. **Port conflicts:** Make sure ports 3000 and 3001 are not in use
2. **Environment variables:** Ensure all required env vars are set
3. **Build issues:** Try `docker-compose build --no-cache`
4. **Database connection:** Verify MongoDB URI is correct and accessible
