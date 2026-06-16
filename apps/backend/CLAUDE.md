You are an expert backend and architecture engineer. This app is a **thin Elysia HTTP entry point** with no business logic — it assembles plugins from `@repo/backend-base` and starts the server. Every route, service, DTO, and error handler lives in `packages/backend-base`.

---

## Entry Point — `src/index.ts`

The only source file. Its sole responsibilities are:

1. Mount the OpenAPI documentation plugin (Scalar UI at `/openapi`).
2. Register plugins imported from `@repo/backend-base`.
3. Start the HTTP server on `process.env.PORT` (default `3333`).

```ts
const app = new Elysia()
  .use(openapi({ provider: "scalar", documentation: { ... } }))
  .use(subscriptionExpirationCron)
  .use(userPlugin)
  .use(emailPlugin)
  .use(stripePlugin)
  .use(queuePlugin); // BullMQ email queue

app.listen(process.env.PORT ?? 3333);
```

---

## Adding a New Feature

New features are never implemented here. The workflow is:

1. Build the feature plugin in `packages/backend-base/src/plugins/<feature>/`.
2. Export the plugin from `packages/backend-base` (via its package index).
3. Import and register it in `apps/backend/src/index.ts` with `.use(newPlugin)`.
4. Add its tag group to the OpenAPI documentation config if needed.

---

## OpenAPI / API Client

The backend exposes its OpenAPI spec at `GET /openapi/json`. After any route change in `packages/backend-base`, regenerate the frontend API client:

```bash
# 1. Start the backend
turbo dev --filter=backend

# 2. From packages/api/
bun run generate
```

This regenerates TypeScript types, SDK functions, and TanStack Query hooks used by `apps/web`.

---

## Environment

Copy `.env.example` to `.env` before running. Required variables:

| Variable | Purpose |
|---|---|
| `PORT` | HTTP port (default `3333`) |
| `WEB_URL` | CORS allowed origin |
| `DATABASE_URL` | PostgreSQL connection |
| `REDIS_URL` | Redis connection (required for BullMQ email queue and BetterAuth session caching) |
| `BETTER_AUTH_SECRET` / `BETTER_AUTH_URL` | BetterAuth config |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth |
| `RESEND_API_KEY` / `EMAIL_FROM` / `EMAIL_TO` / `AUDIENCE_ID` | Resend email |
| `STRIPE_API_KEY` / `STRIPE_WEBHOOK_SECRET` | Stripe payments |

All validation of these variables happens at startup inside `packages/backend-base/src/env.ts` — the app will throw on launch if any required variable is missing.

---

## Development

```bash
turbo dev --filter=backend    # Run with hot reload (bun --watch)
docker compose up -d          # Required: starts PostgreSQL, Redis, Stripe CLI forwarder
```

For local Stripe webhook testing, the `stripe` service in `docker-compose.yml` forwards Stripe events to `http://host.docker.internal:3333/stripe/webhook` automatically.

---

## Email Queue Worker

The backend includes a BullMQ-based email queue worker that processes email jobs asynchronously:

- **Queue Service** - Enqueues email jobs to Redis
- **Worker** - Processes email jobs using the EmailService
- **Bull Board** - Web UI for monitoring at `http://localhost:3333/admin/queues`

The worker starts automatically with the API in development mode. For production, consider running the worker as a separate process for better scaling.

See [Email Queue Documentation](../../packages/backend-base/src/plugins/queue/README.md) for complete details.

---

## Key Conventions

| Topic | Rule |
|---|---|
| Business logic | Never add routes, services, or DTOs here. All of that goes in `packages/backend-base`. |
| New plugins | Build in `backend-base`, export, register here with a single `.use()` call. |
| API client | Regenerate `packages/api` after any route or schema change in backend-base. |
| Port | Configured via `PORT` env var; defaults to `3333`. |
