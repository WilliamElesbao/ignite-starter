# Docker deployment
This guide documents the containerized build and run flow for frontend (`ignite-web`) and backend (`ignite-api`).

## Prerequisites
- Docker running locally
- Infrastructure dependencies available (local PostgreSQL + Redis), usually via `docker compose up -d`
- Environment configured in `apps/backend/.env` and `apps/web/.env`

## Frontend Docker
From the project root:

Build image:
```bash
docker build -t ignite-web -f apps/web/Dockerfile .
```

Run container:
```bash
docker run --name ignite-web \
  -e API_URL=http://host.docker.internal:3333 \
  -e NEXT_PUBLIC_BASE_URL=http://localhost:3000 \
  -p 3000:3000 \
  ignite-web
```

Notes:
- `API_URL` points to the backend running on the host.
- `NEXT_PUBLIC_BASE_URL` is the public base URL used by web auth/navigation flows.
- The web Dockerfile uses a standalone Next.js build output and runs as non-root.

## Backend Docker
Before building backend image:
- Build database package
- Build backend app

```bash
(cd packages/database && bun build)
(cd apps/backend && bun build)
```

The backend image copies `packages/database/dist` and `packages/database/migrations` so Drizzle/database runtime code is available inside the container.

Build backend image:
```bash
docker build -t ignite-backend -f apps/backend/Dockerfile .
```

Run backend container:
```bash
docker run --name ignite-backend \
  --env-file apps/backend/.env \
  -e DATABASE_URL=postgresql://docker:docker@host.docker.internal:5432/ignite-starter \
  -e REDIS_URL=redis://:abcd1234@host.docker.internal:6379 \
  -p 3333:3333 \
  ignite-backend
```

Notes:
- `--env-file` loads base backend settings.
- `DATABASE_URL` and `REDIS_URL` are overridden to connect from container to host services.
- Backend container also runs as non-root.

## Connecting with local database and Redis
Use `host.docker.internal` in container env vars when dependencies run on the host machine.
For this repository, local infrastructure defaults are:
- PostgreSQL: `postgresql://docker:docker@localhost:5432/ignite-starter`
- Redis: `redis://:abcd1234@localhost:6379`

## Docker volumes
Stateful services are managed by `docker-compose.yml` and persist data with:
- `./.docker/postgres` for PostgreSQL
- `./.docker/redis` for Redis

The `ignite-web` and `ignite-backend` runtime containers are stateless and do not need named volumes for app data.

## Useful commands
```bash
docker logs ignite-web
docker logs ignite-backend
docker stop ignite-web ignite-backend
docker rm ignite-web ignite-backend
```
