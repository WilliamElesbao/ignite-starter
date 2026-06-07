# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Package Manager & Tooling

- **Package manager**: Bun (v1.3.3) — use `bun` instead of `npm`/`yarn`/`pnpm`
- **Monorepo orchestration**: Turborepo (`turbo`)
- **Linting & formatting**: Biome (replaces ESLint + Prettier)
- **Commit convention**: Conventional Commits enforced via commitlint + husky. Allowed types: `build`, `chore`, `ci`, `docs`, `feat`, `fix`, `perf`, `refactor`, `revert`, `style`, `test`. Max header length: 88 chars.

## Commands

### Development

```bash
bun install                         # Install all workspace dependencies
bun dev                             # Run all apps in dev mode
turbo dev --filter=web              # Run only the Next.js frontend (port 3000)
turbo dev --filter=backend          # Run only the Elysia backend (port 3333)
cd packages/emails && bun dev       # Preview email templates (port 3001)
cd packages/ui && bun run storybook # Run Storybook (port 6006)
```

### Build, Lint, Typecheck

```bash
bun build                # Build all apps
turbo run lint           # Lint all packages
turbo run lint -- --fix  # Lint with auto-fix
turbo run format         # Format all packages
turbo run check-types    # TypeScript type-check all packages
bun run check:all        # Format + lint + typecheck all packages sequentially
```

### Database (run from `packages/database/`)

```bash
bun db:generate  # Generate Drizzle migration files from schema changes
bun db:migrate   # Apply pending migrations to the database
bun db:studio    # Open Drizzle Studio (requires DATABASE_URL in .env)
bun db:schema    # Regenerate BetterAuth schema (reads from packages/backend-base/src/lib/better-auth/auth.ts)
```

### API Client Regeneration (run from `packages/api/`)

```bash
bun run generate  # Regenerate TypeScript client from backend OpenAPI spec (requires backend running at API_URL)
```

### Tests

```bash
cd apps/web && bun test                         # Run web frontend tests (Vitest)
cd packages/backend-base && bun test:watch      # Watch mode for backend-base tests
```

### Infrastructure

```bash
docker compose up -d  # Start PostgreSQL (5432), Redis (6379), Redis Commander (8081), Stripe CLI
```

## Environment Setup

Each app/package has its own `.env` copied from `.env.example`. Key files to create before running:

| File | Key variables |
|---|---|
| `apps/backend/.env` | `PORT`, `DATABASE_URL`, `REDIS_URL`, `WEB_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_TO`, `AUDIENCE_ID`, `STRIPE_API_KEY`, `STRIPE_WEBHOOK_SECRET` |
| `apps/web/.env` | `API_URL`, `NEXT_PUBLIC_BASE_URL` |
| `packages/database/.env` | `DATABASE_URL` |
| `packages/backend-base/.env` | `DATABASE_URL`, `WEB_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `STRIPE_API_KEY`, `STRIPE_WEBHOOK_SECRET` |
| `packages/api/.env` | `API_URL` |

Default local values (from `.env.example`): backend on `http://localhost:3333`, web on `http://localhost:3000`, PostgreSQL `postgresql://docker:docker@localhost:5432/ignite-starter`, Redis `redis://:abcd1234@localhost:6379`.

The `apps/backend/.env` is also read by `docker-compose.yml` for Redis configuration.

## Architecture

### Monorepo Structure

```
apps/
  web/        # Next.js 16 frontend (React 19, Tailwind v4, shadcn/ui)
  backend/    # Elysia.js entry point — assembles plugins and starts HTTP server
packages/
  backend-base/     # All backend business logic as Elysia plugins
  database/         # Drizzle ORM schema + PostgreSQL client
  api/              # Auto-generated API client for the frontend
  ui/               # Shared React component library
  emails/           # React Email transactional email templates
  typescript-config/ # Shared tsconfig bases
```

### Backend Plugin Architecture

`apps/backend/src/index.ts` is a thin entry point that imports and composes Elysia plugins from `packages/backend-base`. All route logic, services, and DTOs live in `packages/backend-base/src/plugins/`:

- **`shared.plugin.ts`** — Base plugin injected into every other plugin. Sets up CORS, and registers `db` (Drizzle), `cache` (Redis), and `stripe` into Elysia's store.
- **`auth.plugin.ts`** — Mounts BetterAuth's handler and exposes an `auth: true` macro for guarding routes. Routes with `{ auth: true }` resolve the session automatically.
- **`user.plugin.ts`**, **`email.plugin.ts`**, **`stripe.plugin.ts`** — Feature plugins, each with a service class, DTOs, and typed error catalog.

To add a new feature domain, create a new plugin in `packages/backend-base/src/plugins/<name>/` and register it in `apps/backend/src/index.ts`.

### Error Handling Pattern

All errors use a typed catalog pattern:

1. Define an `ErrorCatalog<TCode>` (see `shared/errors/error-catalog.ts`) mapping string codes to `{ message, status }`.
2. Throw with `AppError.fromCatalog({ code, catalog })`.
3. Each plugin has a `.onError()` handler that calls `toErrorResponse()` and sets the response status.

### Authentication

BetterAuth (`packages/backend-base/src/lib/better-auth/auth.ts`) is configured with:
- Email/password (using Bun's native `Bun.password` hashing)
- Google OAuth (`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`)
- Redis as secondary storage for session caching and API key storage
- Drizzle adapter for persistent user/session/account storage
- `apiKey` plugin for programmatic API access

BetterAuth schema must be regenerated when auth config changes (`bun db:schema` from `packages/database/`).

### Database

`packages/database/src/schema/` contains Drizzle table definitions. The client (`src/client.ts`) uses `casing: "snake_case"` — TypeScript fields are camelCase, DB columns are snake_case. The `users` table extends BetterAuth's base schema with a `stripeSubscriptionId` field.

Migrations are managed with Drizzle Kit: schema changes → `bun db:generate` → `bun db:migrate`.

### Frontend API Client (`packages/api/`)

The backend exposes an OpenAPI spec at `GET /openapi/json` (via `@elysiajs/openapi`). The `packages/api` package uses `@hey-api/openapi-ts` to generate:
- TypeScript types (`generated/api/types.gen.ts`)
- SDK functions (`generated/api/sdk.gen.ts`)
- TanStack React Query hooks (`generated/api/@tanstack/react-query.gen.ts`)

The frontend imports from `@repo/api`. After any backend route change, regenerate the client: start the backend, then run `bun run generate` from `packages/api/`. The `generated/` directory is excluded from Biome linting.

### Stripe Integration

Stripe subscription lifecycle is managed in `packages/backend-base/src/plugins/stripe/`. A cron job (`src/cron/subscription-expiration.cron.ts`) handles expiration logic. Webhooks are received at `POST /stripe/webhook`. For local development, the `stripe` service in `docker-compose.yml` forwards Stripe events to `http://host.docker.internal:3333/stripe/webhook`.

### Observability (SigNoz)

SigNoz runs as a separate Docker Compose stack (it ships its own config files for ClickHouse, ZooKeeper, and the OTel Collector).

**First-time setup** (run once, outside this repo):

```bash
git clone -b main https://github.com/SigNoz/signoz.git
cd signoz/deploy/docker
docker compose up -d --remove-orphans
```

**SigNoz UI:** `http://localhost:8080`

**OTLP Collector endpoints:**
- HTTP: `http://localhost:4318` (used by the backend — matches `OTEL_EXPORTER_OTLP_ENDPOINT`)
- gRPC: `localhost:4317`

The backend's `apps/backend/.env` already has the correct values:

```
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
OTEL_SERVICE_NAME=ignite-backend
```

After starting both SigNoz and the backend, make any HTTP request and traces will appear in the SigNoz UI under the `ignite-backend` service. The OpenTelemetry plugin is configured in `apps/backend/src/instrumentation.ts` and preloaded via `apps/backend/bunfig.toml`.
