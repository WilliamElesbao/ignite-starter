You are an expert in relational data modeling with Drizzle and PostgreSQL. This package (`@repo/db`) owns the schema, the database client, and migration artifacts. It is a pure data-access layer — business logic never belongs here.

---

## Package Exports

```ts
// index.ts
export { db } from "./src/client";   // Drizzle database client
export * from "./src/schema";        // All table definitions and types
```

Import in other packages as:
```ts
import { db, users, events } from "@repo/db";
```

---

## Database Client — `src/client.ts`

Single Drizzle client instance configured with:
- `casing: "snake_case"` — TypeScript fields are camelCase; database columns are automatically snake_case. Never manually write snake_case column names in queries.
- `schema` — the full schema object is injected for relational queries.

```ts
export const db = drizzle(env.DATABASE_URL, { schema, casing: "snake_case" });
```

---

## Schema — `src/schema/`

All table definitions live here. The `schema` object exported from `src/schema/index.ts` aggregates all tables and is passed to the Drizzle client.

### Tables

| Table | Purpose |
|---|---|
| `users` | Core user record extended with `stripeSubscriptionId` |
| `accounts` | OAuth / password provider accounts (BetterAuth managed) |
| `sessions` | Active user sessions (BetterAuth managed) |
| `verifications` | Email verification tokens (BetterAuth managed) |
| `events` | Business event audit log (domain-level, not technical logs) |

### Conventions

- Primary keys use `randomUUIDv7()` from Bun — text type, not UUID/serial.
- All tables have `createdAt` (defaultNow) and `updatedAt` where applicable.
- Foreign keys use `cascade` delete (e.g., deleting a user removes their accounts and sessions).
- Indexes are placed on foreign keys and frequently queried fields (e.g., `userId`, `identifier`).
- `users` and `accounts` tables include BetterAuth's base schema — do not remove BetterAuth fields; run `bun db:schema` to regenerate when auth config changes.

### Events Table

The `events` table is an append-only audit log for business domain events. It is distinct from application logs (Pino). Use it for events that have business significance (e.g., `STRIPE_PAYMENT_FAILED`, `SUBSCRIPTION_CANCELED`, `LOGIN_SUSPICIOUS`).

```ts
// events schema fields
id         // text PK (randomUUIDv7)
type       // string — event type identifier
userId     // nullable, no FK (user may not exist at event time)
payload    // jsonb (unknown) — event-specific data
createdAt  // defaultNow
```

---

## Migrations — `migrations/`

Managed with Drizzle Kit. Never hand-edit migration SQL files.

```bash
# From packages/database/
bun db:generate  # Generate migration from schema changes
bun db:migrate   # Apply pending migrations
bun db:studio    # Open Drizzle Studio (requires DATABASE_URL in .env)
```

After changing the BetterAuth config in `packages/backend-base/src/lib/better-auth/auth.ts`, run `bun db:schema` to regenerate BetterAuth-managed table definitions before generating migrations.

---

## Environment

Validated at startup via Zod in `env.ts`:

```ts
const envSchema = z.object({
  DATABASE_URL: z.url().startsWith("postgresql://"),
});
```

Copy `.env.example` to `.env` and set `DATABASE_URL` before running any database commands.

---

## Adding a New Table

1. Create `src/schema/<table>.ts` following the existing conventions (UUID v7 PK, snake_case via casing, appropriate indexes).
2. Export from `src/schema/index.ts` and add to the `schema` object.
3. Run `bun db:generate` to create the migration file.
4. Run `bun db:migrate` to apply it.
5. Re-export from `index.ts` if the table should be available to other packages.

---

## Key Conventions

| Topic | Rule |
|---|---|
| Casing | TypeScript camelCase fields → automatic snake_case columns. Never write raw column names. |
| Primary keys | Always `text` with `randomUUIDv7()` from Bun. Never serial/integer PKs. |
| Migrations | Always generated via `bun db:generate`. Never hand-edited. |
| Business events | Use the `events` table, not `console.log` or Pino, for domain-level audit records. |
| No business logic | This package is data access only. Queries and mutations belong in service classes in `packages/backend-base`. |
