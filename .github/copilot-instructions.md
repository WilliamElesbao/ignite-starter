# GitHub Copilot Instructions

## Project Overview

Turborepo monorepo using Bun as runtime and package manager, with Biome for linting/formatting and Drizzle as ORM.

### Monorepo Structure

#### Apps

- `apps/web` — Next.js 16, React 19, Tailwind v4, shadcn/ui (port 3000)
- `apps/backend` — Elysia.js entry point that mounts plugins and starts HTTP server (port 3333)

#### Packages

- `packages/backend-base` — All backend logic (Elysia plugins, services, DTOs, error catalogs)
- `packages/database` — Drizzle ORM + PostgreSQL client with schema and migrations
- `packages/api` — Auto-generated API client (Hey API + TanStack Query hooks)
- `packages/ui` — Shared React component library (Storybook on port 6006)
- `packages/emails` — Transactional email templates (React Email, preview on port 3001)
- `packages/typescript-config` — Shared TypeScript configurations

## Technology Stack

### Core

- **Runtime & Package Manager**: Bun v1.3.3 — always use `bun`, never `npm`, `yarn`, or `pnpm`
- **Monorepo**: Turborepo for task orchestration and caching
- **Linting & Formatting**: Biome — replaces ESLint and Prettier
- **TypeScript**: Strict mode in all packages
- **Database**: PostgreSQL via Docker (port 5432)
- **Cache**: Redis via Docker (port 6379)

### Backend

- **Framework**: Elysia.js with plugin architecture
- **ORM**: Drizzle with `casing: "snake_case"` (camelCase in TS, snake_case in DB)
- **Authentication**: BetterAuth with email/password and Google OAuth
- **Payments**: Stripe with webhooks and subscription management
- **Observability**: OpenTelemetry + SigNoz (port 8080)
- **API Docs**: OpenAPI spec at `/openapi/json`

### Frontend

- **Framework**: Next.js 16 with React 19
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **API Client**: Auto-generated with @hey-api/openapi-ts
- **State Management**: TanStack Query (React Query)

### DevOps

- **CI/CD**: Drone CI (self-hosted) + GitHub Actions
- **Code Quality**: SonarCloud
- **Commits**: Conventional Commits via commitlint + husky
- **Containers**: Docker Compose for PostgreSQL, Redis, Stripe CLI

## Code Conventions

### Package Manager

```bash
# Correct
bun install
bun add <package>
bun run dev
```

### Linting & Formatting

```bash
# Correct
bun biome check .
bun biome check --write .
turbo run lint
turbo run format
```

### TypeScript Casing

```ts
// Correct - camelCase in TypeScript
const user = await db.select().from(users).where(eq(users.userId, id));

// Correct - snake_case in database (Drizzle converts automatically)
export const users = pgTable("users", {
  userId: text("user_id").primaryKey(),
  createdAt: timestamp("created_at").defaultNow(),
});
```

### Commits (Conventional Commits)

```bash
# Correct
git commit -m "feat: add user profile endpoint"
git commit -m "fix: resolve authentication token expiration"
git commit -m "refactor: extract email service to separate module"

# Incorrect
git commit -m "updated stuff"
git commit -m "WIP"

# Allowed types
feat, fix, refactor, perf, docs, test, ci, chore, build, style, revert

# Rules
- Max header length: 88 characters
- Format: <type>(<scope>): <description>
- Scope is optional
```

## Backend Architecture (Plugin System)

### Plugin Structure

Each feature domain is a plugin in `packages/backend-base/src/plugins/<name>/`:

```
plugins/
  <name>/
    <name>.plugin.ts   # Registers routes and handlers
    <name>.service.ts  # Business logic
    <name>.dto.ts      # Input/output validation (Elysia.t)
    <name>.errors.ts   # Typed error catalog
```

### Base Plugin (shared.plugin.ts)

All plugins inherit from `shared.plugin.ts` which injects:

- `db` — Drizzle client
- `cache` — Redis client
- `stripe` — Stripe client
- Configured CORS

### Plugin Example

```ts
// user.plugin.ts
import { Elysia } from "elysia";
import { sharedPlugin } from "../shared.plugin";
import { UserService } from "./user.service";
import { userDto } from "./user.dto";

export const userPlugin = new Elysia({ prefix: "/users" })
  .use(sharedPlugin)
  .state((state) => ({
    ...state,
    userService: new UserService(state.db, state.logger),
  }))
  .get(
    "/:id",
    async ({ params, userService }) => {
      return userService.getUserById(params.id);
    },
    {
      auth: true, // Requires authentication
      params: userDto.params,
      response: userDto.response,
    },
  );
```

### Authentication

```ts
// Protected route
.get('/profile', async ({ session }) => {
  // session is automatically resolved when auth: true
  return { userId: session.user.id };
}, { auth: true })

// Public route
.get('/health', () => ({ status: 'ok' }))
```

### Register Plugin

```ts
// apps/backend/src/index.ts
import { userPlugin } from "@repo/backend-base/plugins/user";

const app = new Elysia()
  .use(authPlugin)
  .use(userPlugin) // Add here
  .listen(3333);
```

## Error Handling Pattern

### Typed Error Catalog

```ts
// user.errors.ts
import { ErrorCatalog } from "../../shared/errors/error-catalog";

export const userErrors = {
  USER_NOT_FOUND: {
    message: "User not found",
    status: 404,
  },
  INVALID_EMAIL: {
    message: "Invalid email format",
    status: 400,
  },
  UNAUTHORIZED: {
    message: "Unauthorized access",
    status: 401,
  },
} satisfies ErrorCatalog<string>;

export type UserErrorCode = keyof typeof userErrors;
```

### Throwing Errors

```ts
// Correct - use AppError.fromCatalog
import { AppError } from "../../shared/errors/app-error";
import { userErrors } from "./user.errors";

if (!user) {
  throw AppError.fromCatalog({
    code: "USER_NOT_FOUND",
    catalog: userErrors,
  });
}

// Incorrect - don't use generic Error
throw new Error("User not found");
throw { message: "User not found", status: 404 };
```

### Error Handler in Plugin

```ts
// user.plugin.ts
export const userPlugin = new Elysia({ prefix: "/users" })
  .use(sharedPlugin)
  .onError(({ code, error, set }) => {
    if (error instanceof AppError) {
      return toErrorResponse(error, set);
    }
    // Fallback for unhandled errors
    set.status = 500;
    return { error: "Internal server error" };
  });
```

## Database (Drizzle)

### Schema

```ts
// packages/database/src/schema/users.ts
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

### Migrations

```bash
# After schema changes
cd packages/database
bun db:generate  # Generate migration files
bun db:migrate   # Apply migrations to database
bun db:studio    # Open Drizzle Studio (requires DATABASE_URL)
```

### Queries

```ts
// Correct - use Drizzle query builder
import { db } from "@repo/database";
import { users } from "@repo/database/schema";
import { eq } from "drizzle-orm";

const user = await db.select().from(users).where(eq(users.id, userId));

// Incorrect - don't use raw SQL unnecessarily
const user = await db.execute(sql`SELECT * FROM users WHERE id = ${userId}`);
```

## Frontend (Next.js)

### API Client

```ts
// Correct - use generated hooks
import { useGetUsers, useCreateUser } from "@repo/api";

function UserList() {
  const { data, isLoading } = useGetUsers();
  const createUser = useCreateUser();

  // ...
}
```

### Regenerate API Client

```bash
# After backend changes
cd packages/api
bun run generate  # Backend must be running at API_URL
```

### Components

```tsx
// Correct - reusable components in packages/ui
// packages/ui/src/button.tsx
export function Button({ children, ...props }: ButtonProps) {
  return <button {...props}>{children}</button>;
}

// Correct - app-specific components in apps/web
// apps/web/src/components/user-profile.tsx
import { Button } from "@repo/ui";

export function UserProfile() {
  return <Button>Edit Profile</Button>;
}

// Incorrect - don't duplicate components between apps/web and packages/ui
```

## Prohibited Practices

### ❌ DO NOT

1. **Console.log in production**

```ts
// Incorrect
console.log("User created:", user);

// Correct - use appropriate logger
import { logger } from "./logger";
logger.info({ user }, "User created");
```

2. **Modify generated files**

```ts
// Incorrect - don't manually edit
packages/api/generated/api/types.gen.ts
packages/api/generated/api/sdk.gen.ts

// Correct - regenerate via bun run generate
```

3. **Use process.env directly**

```ts
// Incorrect
const apiUrl = process.env.API_URL;

// Correct - validate with zod
import { z } from "zod";

const envSchema = z.object({
  API_URL: z.string().url(),
});

const env = envSchema.parse(process.env);
const apiUrl = env.API_URL;
```

4. **Use npm/yarn/pnpm**

```bash
# Correct
bun install
bun add package
```

## Useful Commands

### Development

```bash
bun install                         # Install dependencies
bun dev                             # Run all apps
turbo dev --filter=web              # Run only frontend
turbo dev --filter=backend          # Run only backend
```

### Build & Quality

```bash
bun build                           # Build all apps
turbo run lint                      # Lint all packages
turbo run lint -- --fix             # Lint with auto-fix
turbo run format                    # Format all packages
turbo run check-types               # TypeScript check
bun run check:all                   # Format + lint + typecheck
```

### Database

```bash
cd packages/database
bun db:generate                     # Generate migrations
bun db:migrate                      # Apply migrations
bun db:studio                       # Open Drizzle Studio
bun db:schema                       # Regenerate BetterAuth schema
```

### Infrastructure

```bash
docker compose up -d                # PostgreSQL, Redis, Stripe CLI
```

## CI/CD

### Pipeline Checks

- **Typecheck**: `bun tsc --noEmit` in all packages
- **Lint**: `bun biome ci .` in root
- **SonarCloud**: Code quality and security analysis

### Required Status Checks

- CI (Drone)
- SonarCloud
- Biome Lint
