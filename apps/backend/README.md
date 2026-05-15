<!-- @format -->

# Backend Application

Elysia.js backend API server with Bun runtime. This is a thin entry point that
assembles plugins from `@repo/backend-base` and starts the HTTP server.

## Overview

This application contains no business logic — all routes, services, DTOs, and
error handling live in `packages/backend-base`. The entry point (`src/index.ts`)
only:

- Mounts OpenAPI documentation (Scalar UI at `/openapi`)
- Registers plugins from `@repo/backend-base`
- Starts the HTTP server on port 3333 (configurable via `PORT` env var)

## Getting Started

### Prerequisites

- Bun runtime installed
- PostgreSQL database running
- Redis running (for email queue and session caching)
- Environment variables configured in `.env`

### Development

```bash
# From the monorepo root
turbo dev --filter=backend

# Or from this directory
bun dev
```

The backend will be available at `http://localhost:3333`.

### Infrastructure Services

Start the required infrastructure services:

```bash
docker compose up -d
```

This starts PostgreSQL, Redis, and other services.

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Required variables:

- `PORT` - HTTP port (default: 3333)
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `WEB_URL` - CORS allowed origin
- `BETTER_AUTH_SECRET` / `BETTER_AUTH_URL` - BetterAuth configuration
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - Google OAuth
- `RESEND_API_KEY` / `EMAIL_FROM` / `EMAIL_TO` - Email configuration
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` - Stripe payments

See [CLAUDE.md](./CLAUDE.md) for detailed environment setup.

## API Documentation

OpenAPI documentation is available at:

- **Scalar UI**: http://localhost:3333/openapi
- **JSON Spec**: http://localhost:3333/openapi/json

## Features

- **Authentication**: BetterAuth with email/password and Google OAuth
- **Email Queue**: BullMQ-based email processing with Redis
- **User Management**: CRUD operations for users
- **Stripe Integration**: Payment processing and webhooks
- **Subscription Management**: Cron job for subscription expiration
- **OpenAPI Documentation**: Auto-generated API docs
- **Bull Board**: Queue monitoring UI at `/admin/queues`

## Testing

Run unit tests:

```bash
bun run test
```

Run tests with coverage:

```bash
bun test:coverage
```

## Docker Deployment

Build and run as a Docker container:

```bash
# Build image
docker build -t ignite-api -f apps/backend/Dockerfile .

# Run container
docker run --name ignite-api \
  --env-file apps/backend/.env \
  -e DATABASE_URL=postgresql://docker:docker@host.docker.internal:5432/ignite-starter \
  -e REDIS_URL=redis://:abcd1234@host.docker.internal:6379 \
  -p 3333:3333 \
  ignite-api
```

See [Docker Deployment Guide](../../docs/docker/deployment.md) for complete
details.

## Architecture

See [CLAUDE.md](./CLAUDE.md) for architectural details and conventions.

## Documentation

- [CLAUDE.md](./CLAUDE.md) - Architecture and conventions
- [Email Queue Documentation](../../packages/backend-base/src/plugins/queue/README.md) -
  BullMQ email processing
- [Docker Deployment Guide](../../docs/docker/deployment.md) - Container
  deployment
- [Local Setup Guide](../../docs/local-setup/local-setup.md) - Complete setup
  instructions
