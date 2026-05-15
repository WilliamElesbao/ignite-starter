# CLAUDE.md — packages/backend-base

## Overview

All backend business logic lives here as composable Elysia plugins. This package is consumed by `apps/backend`, which is a thin entry point that assembles plugins and starts the HTTP server. Features are organized as self-contained plugins, each with a service class, DTOs, and a typed error catalog.

---

## Package Role

`packages/backend-base` exports:
- Feature plugins: `authPlugin`, `userPlugin`, `emailPlugin`, `stripePlugin`, `queuePlugin`
- Infrastructure: `sharedPlugin`, `OpenAPI`, `subscriptionExpirationCron`
- Lib singletons: configured Stripe, Resend, Pino logger, BetterAuth instance
- Shared error utilities: `AppError`, `toErrorResponse`, `ErrorCatalog`

`apps/backend/src/index.ts` imports and composes these — it does not contain any route or business logic.

---

## Directory Structure

```
src/
├── config/         # OpenAPI documentation config
├── cron/           # Scheduled jobs (subscription expiration)
├── env.ts          # Validated environment variables (Zod)
├── lib/            # Singleton library clients (logger, stripe, resend, better-auth)
├── plugins/        # Feature plugins — one folder per domain
│   ├── auth/
│   ├── email/
│   ├── queue/      # BullMQ email queue plugin
│   ├── stripe/
│   └── user/
├── services/       # Cross-cutting services (EventService)
├── shared/         # Infrastructure: plugin base, Redis client, error system, DTOs
└── utils/          # safePromise utility
```

---

## Plugin Architecture

Each feature domain follows the same structure:

```
plugins/<feature>/
├── <feature>.plugin.ts    # Elysia plugin — routes, macros, onError handler
├── <feature>.service.ts   # Service class — business logic, DB queries
├── <feature>.errors.ts    # Typed error enum + ErrorCatalog map
└── dtos/
    ├── <response>.dto.ts  # Response shapes (Elysia t.Object)
    └── errors/
        └── <feature>-error.dto.ts  # Error response DTOs (createErrorDto)
```

### Shared Plugin — `src/shared/shared.plugin.ts`

The root plugin injected into every feature plugin. Responsibilities:
- Mounts `@elysiajs/cors` configured for `WEB_URL`.
- Injects shared state: `db`, `cache` (Redis), `stripe`, `logger`, `eventService`.
- Global `onError` handler that serializes all errors via `toErrorResponse` into `{ code, message }`.
- Graceful shutdown: closes DB connection and disconnects Redis.

### Auth Plugin — `src/plugins/auth/auth.plugin.ts`

- Mounts BetterAuth's HTTP handler at `/auth/*`.
- Exposes an `auth: true` macro. Routes decorated with `{ auth: true }` automatically resolve the session and return 401 if no session exists.
- On session resolution failure, fires a `LOGIN_SUSPICIOUS` event before returning 503.

### Feature Plugins (user, email, stripe, queue)

Each plugin:
1. Extends the shared plugin for access to `db`, `cache`, `stripe`, `logger`.
2. Instantiates its service class via Elysia's `.derive()` or constructor injection.
3. Defines typed routes with full response schemas (200, 401, 404, 500, etc.).
4. Has its own `.onError()` that calls `toErrorResponse` and sets `set.status`.
5. Uses the `auth: true` macro on protected routes.

### Queue Plugin (`src/plugins/queue/`)

The queue plugin provides BullMQ-based email processing:

- **email-queue.service.ts** - Service to enqueue email jobs to Redis
- **email-queue.worker.ts** - Worker that processes email jobs asynchronously
- **bull-board.plugin.ts** - Web UI for monitoring queues at `/admin/queues`
- **email-queue.config.ts** - Queue configuration (job options, Redis connection)

The queue plugin integrates with the email plugin to send emails asynchronously, improving reliability and performance.

See [Email Queue README](./src/plugins/queue/README.md) for complete documentation.

---

## Error System

### Contract

All API error responses must return:
```json
{ "code": "SOME_ERROR_CODE", "message": "Human-readable message" }
```

Both fields are required. This is enforced by `src/shared/dtos/error.dto.ts`.

### Components

| File | Role |
|---|---|
| `shared/errors/error-catalog.ts` | `ErrorCatalog<TCode>` type — maps string codes to `{ message, status }` |
| `shared/errors/app-error.ts` | `AppError extends Error` — `fromCatalog()`, `fromUnknown()` |
| `shared/errors/to-error-response.ts` | Normalizes any error to `{ status, body: { code, message } }` |
| `shared/errors/shared.errors.ts` | Shared infra codes: `INTERNAL_SERVER_ERROR` (500), `REQUEST_VALIDATION_FAILED` (422) |
| `shared/dtos/error.dto.ts` | `createErrorDto(codes)` — Elysia DTO with enum-constrained `code` |

### Per-Feature Error Files

Each feature owns an `<feature>.errors.ts` with:
1. An `enum <Feature>ErrorCode` — string enum values in the format `FEATURE_CONTEXT_FAILURE`.
2. A `<FEATURE>_ERROR_MAP: ErrorCatalog<<Feature>ErrorCode>` mapping codes to `{ message, status }`.

Never add feature errors to shared enums.

### Layer Responsibilities

**Service layer** — throws `AppError.fromCatalog(...)` for expected domain failures (not found, provider errors). Never returns `{ error: ... }` ad-hoc objects.

**Plugin/route layer** — throws typed errors for auth/guard failures. Relies on global `onError` for HTTP serialization. Avoids repetitive try/catch.

**Global `onError`** — catches all thrown errors, calls `toErrorResponse`, sets status and returns `{ code, message }`.

### Adding a New Error

```ts
// 1. feature.errors.ts
export enum BillingErrorCode {
  BILLING_INVOICE_NOT_FOUND = "BILLING_INVOICE_NOT_FOUND",
}
export const BILLING_ERROR_MAP: ErrorCatalog<BillingErrorCode> = {
  [BillingErrorCode.BILLING_INVOICE_NOT_FOUND]: { message: "Invoice not found", status: 404 },
};

// 2. service
throw AppError.fromCatalog({ code: BillingErrorCode.BILLING_INVOICE_NOT_FOUND, catalog: BILLING_ERROR_MAP });

// 3. plugin response schema
response: { 404: billingInvoiceNotFoundErrorDto }

// 4. dtos/errors/billing-error.dto.ts
export const billingInvoiceNotFoundErrorDto = createErrorDto([BillingErrorCode.BILLING_INVOICE_NOT_FOUND]);
```

### Error Naming Convention

`<FEATURE>_<CONTEXT>_<FAILURE_TYPE>` — e.g., `STRIPE_SUBSCRIPTION_RETRIEVE_FAILED`, `USER_FETCH_FAILED`.

---

## Service Classes

Service classes encapsulate all database queries and third-party API calls. They are instantiated with their dependencies injected via constructor (logger, db, stripe, eventService as needed).

```ts
class UserService {
  constructor(private readonly db: DB, private readonly logger: Logger) {}

  async getUserById(id: string) {
    const [user, error] = await safePromise(
      this.db.select().from(users).where(eq(users.id, id))
    );
    if (error) throw AppError.fromCatalog({ code: UserErrorCode.USER_FETCH_FAILED, catalog: USER_ERROR_MAP });
    return user[0] ?? null;
  }
}
```

Services use `safePromise` from `src/utils/safe-promise.ts` — a Go-style `[value, error]` tuple — instead of try/catch.

---

## DTOs

All route request bodies, response shapes, and error formats are defined as Elysia `t.Object()` schemas. DTOs live in `plugins/<feature>/dtos/`. Error DTOs live in `dtos/errors/` and use `createErrorDto([...codes])` to generate enum-constrained `code` fields for OpenAPI accuracy.

Never define DTOs inline inside plugin route definitions — always import from the `dtos/` folder.

---

## Logging and Events

Two separate systems — never conflate them:

| System | Tool | When to use |
|---|---|---|
| Technical logs | Pino (`src/lib/logger/`) | Runtime failures, DB errors, provider errors, lifecycle events |
| Business events | `EventService` + `events` table | Domain-significant events (payment failed, subscription canceled, suspicious login) |

Use `logger` for debugging and operations. Use `EventService.createEvent(...)` for audit records. When relevant, write both.

`EventService.createEvent` is fire-and-forget — errors are logged but not thrown, so a failed event write never breaks the main request flow.

---

## Cron Jobs — `src/cron/`

Scheduled tasks use `@elysiajs/cron`. The `subscriptionExpirationCron` runs every hour, fetches users with active `stripeSubscriptionId`, checks subscription status via Stripe, and nullifies the `stripeSubscriptionId` for expired/canceled subscriptions.

Cron errors are logged but do not throw — they use `Promise.allSettled` to process users in parallel without a single failure aborting the batch.

---

## Infrastructure Singletons — `src/lib/`

| Path | What it exports |
|---|---|
| `lib/better-auth/auth.ts` | Configured `betterAuth` instance + `SessionResponse` type |
| `lib/logger/index.ts` | Pino logger (pretty in dev, JSON in prod) |
| `lib/stripe/index.ts` | Stripe client (API version pinned) |
| `lib/resend/index.ts` | Resend email client (validated at startup) |

All singletons validate required env vars at module load time and throw if missing.

---

## Redis Client — `src/shared/redis.client.ts`

`RedisClient` wraps the `redis` npm package with:
- Lazy connect on first use (3-second timeout).
- Exponential backoff reconnect (up to 10 retries, max 3s delay).
- Typed `get<T>` (JSON.parse) and `set(key, value, ttl)` (JSON.stringify + PX expiry via `ms()`).
- All events piped to Pino logger.

Used as BetterAuth's secondary storage (session caching) and available in all plugins via `store.cache`.

---

## Adding a New Feature Plugin

1. Create `src/plugins/<feature>/` with the structure: `<feature>.plugin.ts`, `<feature>.service.ts`, `<feature>.errors.ts`, `dtos/`.
2. Define the error enum and catalog in `<feature>.errors.ts`.
3. Implement the service class in `<feature>.service.ts`.
4. Define response and error DTOs in `dtos/`.
5. Create the Elysia plugin in `<feature>.plugin.ts` using `sharedPlugin` as base.
6. Export from `packages/backend-base/src/index.ts` (or the package's main export).
7. Register the plugin in `apps/backend/src/index.ts`.

---

## Key Conventions

| Topic | Rule |
|---|---|
| Error format | Always `{ code, message }`. Never optional. Never raw strings. |
| Error ownership | Each feature owns its error codes. Never add to shared enums. |
| Service failures | Throw `AppError.fromCatalog(...)`. Never return `{ error }` objects. |
| Expected states | Model expected business states (e.g., "no subscription") as `200` payloads, not 4xx errors. |
| DTOs | Always defined in `dtos/`. Never inline in plugin route definitions. |
| Logging | Pino for technical diagnostics. `EventService` for business audit records. |
| `safePromise` | Preferred over try/catch in service layer. |
| Auth guard | Use `auth: true` macro on routes that require authentication. |
