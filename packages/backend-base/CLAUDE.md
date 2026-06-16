You are a senior backend and architecture engineer. All backend business logic lives here as composable Elysia plugins; `apps/backend` only assembles them. Organize every feature as a self-contained plugin with a service class, DTOs, and a typed error catalog. Use TDD — colocate `*.test.ts` with the code it covers.

## Exports

`@repo/backend-base` exports feature plugins (`authPlugin`, `userPlugin`, `emailPlugin`, `stripePlugin`, `queuePlugin`), infrastructure (`sharedPlugin`, `OpenAPI`, `subscriptionExpirationCron`), lib singletons (Stripe, Resend, Pino, BetterAuth), and the error utilities (`AppError`, `toErrorResponse`, `ErrorCatalog`).

## Directory Structure

```text
src/
├── config/    # OpenAPI documentation config
├── cron/      # Scheduled jobs (@elysiajs/cron)
├── env.ts     # Zod-validated environment variables
├── lib/       # Singleton clients (logger, stripe, resend, better-auth)
├── plugins/   # Feature plugins — one folder per domain
├── services/  # Cross-cutting services (EventService)
├── shared/    # Plugin base, Redis client, error system, shared DTOs
└── utils/     # safePromise
```

## Plugin Anatomy

Each feature domain follows the role-suffixed file pattern:

```text
plugins/<feature>/
├── <feature>.plugin.ts    # Routes, macros, onError handler
├── <feature>.service.ts   # Business logic + DB queries
├── <feature>.errors.ts    # Error enum + ErrorCatalog map
├── <feature>.test.ts      # Tests (TDD)
└── dtos/                   # Response DTOs + dtos/errors/ error DTOs
```

- **`shared/shared.plugin.ts`** — root plugin injected everywhere. Mounts CORS, injects `db`, `cache` (Redis), `stripe`, `logger`, `eventService`, serializes all errors via global `onError`, and handles graceful shutdown.
- **`plugins/auth/auth.plugin.ts`** — mounts BetterAuth at `/auth/*` and exposes the `auth: true` macro, which resolves the session and returns 401 when absent.
- **Feature plugins** — extend the shared plugin, instantiate their service, define fully typed routes (200/401/404/500…), and own an `.onError()` that delegates to `toErrorResponse`.
- **`plugins/queue/`** — BullMQ email pipeline: `email-queue.service.ts` (enqueue), `email-queue.worker.ts` (process), `bull-board.plugin.ts` (UI at `/admin/queues`), `email-queue.config.ts`.

## Error System

Every API error response returns exactly `{ code, message }` — both required, enforced by `shared/dtos/error.dto.ts`.

| File | Role |
|---|---|
| `shared/errors/error-catalog.ts` | `ErrorCatalog<TCode>` — maps codes to `{ message, status }` |
| `shared/errors/app-error.ts` | `AppError` — `fromCatalog()`, `fromUnknown()` |
| `shared/errors/to-error-response.ts` | Normalizes any error to `{ status, body }` |
| `shared/dtos/error.dto.ts` | `createErrorDto(codes)` — enum-constrained `code` for OpenAPI |

Each feature owns `<feature>.errors.ts` with an `enum <Feature>ErrorCode` (format `FEATURE_CONTEXT_FAILURE`) and a `<FEATURE>_ERROR_MAP`. Never add feature codes to shared enums.

```ts
// 1. feature.errors.ts
export enum BillingErrorCode {
  BILLING_INVOICE_NOT_FOUND = "BILLING_INVOICE_NOT_FOUND",
}
export const BILLING_ERROR_MAP: ErrorCatalog<BillingErrorCode> = {
  [BillingErrorCode.BILLING_INVOICE_NOT_FOUND]: { message: "Invoice not found", status: 404 },
};

// 2. service — throw typed errors, never return { error } objects
throw AppError.fromCatalog({ code: BillingErrorCode.BILLING_INVOICE_NOT_FOUND, catalog: BILLING_ERROR_MAP });

// 3. plugin response schema
response: { 404: billingInvoiceNotFoundErrorDto }
```

**Layers:** services throw `AppError.fromCatalog(...)` for expected domain failures; plugins throw for auth/guard failures; the global `onError` serializes everything. Model expected business states (e.g. "no subscription") as `200` payloads, not 4xx.

## Service Classes

Services encapsulate every DB query and third-party call, with dependencies injected via constructor. Use `safePromise` (a Go-style `[value, error]` tuple) instead of try/catch.

```ts
class UserService {
  constructor(private readonly db: DB, private readonly logger: Logger) {}

  async getUserById(id: string) {
    const [rows, error] = await safePromise(
      this.db.select().from(users).where(eq(users.id, id)),
    );
    if (error) throw AppError.fromCatalog({ code: UserErrorCode.USER_FETCH_FAILED, catalog: USER_ERROR_MAP });
    return rows[0] ?? null;
  }
}
```

## DTOs

Define every request body, response, and error shape as an Elysia `t.Object()` in `plugins/<feature>/dtos/`. Error DTOs live in `dtos/errors/` via `createErrorDto([...codes])`. Never declare a DTO inline in a route.

## Logging vs Events

Keep the two systems separate:

| System | Tool | Use for |
|---|---|---|
| Technical logs | Pino (`lib/logger/`) | Runtime/DB/provider failures, lifecycle |
| Business events | `EventService` + `events` table | Domain-significant events (payment failed, suspicious login) |

`EventService.createEvent` is fire-and-forget: it logs write failures but never throws, so it cannot break the request flow.

## Infrastructure

- **`lib/`** singletons (BetterAuth, Pino, Stripe, Resend) validate required env vars at module load and throw if any is missing.
- **`shared/redis.client.ts`** — `RedisClient` with lazy connect, exponential-backoff reconnect, typed `get<T>`/`set(key, value, ttl)`. Backs BetterAuth session caching and is available as `store.cache`.
- **`cron/`** — `subscriptionExpirationCron` runs hourly via `Promise.allSettled`; errors are logged, never thrown.

## Queue & Workers

BullMQ (`plugins/queue/`) offloads work from the request path. A producer **service** enqueues a job; a **worker** consumes it. Reach for this deliberately, not by default.

### When a feature should use a queue

Queue work that is slow, I/O-bound, retryable, or not needed for the HTTP response:

- Outbound side effects: transactional email, webhooks to third parties, push notifications.
- Calls to rate-limited or flaky providers that benefit from retry + backoff.
- Heavy or batch work (report generation, media processing, bulk writes).
- Scheduled or delayed actions (a reminder some hours later).

Keep work **inline** (no queue) when the caller needs the result synchronously, when it must commit in the same transaction, or when it is fast and local. Use `cron/` for fixed-schedule sweeps, a queue for per-event jobs.

### The correct senior pattern

The `email` queue is an illustrative example and cuts corners a production feature should not. Build new queues like this:

- **Type the job contract.** Define one discriminated map of `jobName → payload` shared by the producer and the worker, so both agree at compile time. Do not type the producer as `addJob(jobType: string, data: T)` — that lets producer and consumer drift (the email example does this).
- **Forward the payload.** The worker must pass `job.data` to the service. The example calls `sendWelcomeEmail()` with no arguments, so the recipient is ignored — always thread the typed data through.
- **Make jobs idempotent.** Workers retry; design handlers to be safe on re-run, and pass a deterministic `jobId` to dedupe instead of a `fallback-${Date.now()}` id.
- **Follow repo error rules.** Use `safePromise` and throw typed `AppError` in the producer rather than `try/catch`. Let BullMQ `attempts` + exponential `backoff` own retries; do not swallow failures.
- **Source config from `env.ts`.** Build the Redis connection from validated env — never re-parse `REDIS_URL` with a hardcoded password fallback (another example shortcut).
- **Worker connection** needs `maxRetriesPerRequest: null`; size `concurrency` to the downstream limit, not an arbitrary constant.
- **Run workers as separate processes in production** for independent scaling; in dev they start with the API. Monitor via Bull Board at `/admin/queues`.

## Adding a Feature Plugin

1. Create `plugins/<feature>/` with `<feature>.plugin.ts`, `<feature>.service.ts`, `<feature>.errors.ts`, `dtos/`, and `<feature>.test.ts`.
2. Define the error enum + catalog, then write tests, then implement the service.
3. Define response/error DTOs and the Elysia plugin (extend `sharedPlugin`).
4. Export from `src/index.ts` and register it in `apps/backend/src/index.ts`.

## Key Conventions

| Topic | Rule |
|---|---|
| Error format | Always `{ code, message }`. Never optional, never a raw string. |
| Error ownership | Each feature owns its codes. Never add to shared enums. |
| Service failures | Throw `AppError.fromCatalog(...)`. Never return `{ error }`. |
| DB & Stripe access | Only inside services / the `stripe` plugin. Never elsewhere. |
| DTOs | Always in `dtos/`. Never inline. |
| `safePromise` | Preferred over try/catch in services. |
| Auth guard | Use the `auth: true` macro on protected routes. |
| Queues | Type the `jobName → payload` map; thread `job.data` through; idempotent handlers; Redis from `env.ts`. |
