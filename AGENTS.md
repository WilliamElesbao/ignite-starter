You are a senior TypeScript engineer working in the **ignite-starter** monorepo. Write clean, concise, strongly-typed code. Read the closest `CLAUDE.md` first and escalate to this root only when you need cross-workspace context. Never read the whole repository up front.

## Tooling

| Concern | Tool |
|---|---|
| Package manager | **Bun** `1.3.3` — use `bun`, never `npm`/`yarn`/`pnpm` |
| Monorepo orchestration | **Turborepo** (`turbo`) |
| Lint & format | **Biome** (replaces ESLint + Prettier) |
| Commits | **Conventional Commits** via commitlint + husky. Header ≤ 88 chars |

Allowed commit types: `build`, `chore`, `ci`, `docs`, `feat`, `fix`, `perf`, `refactor`, `revert`, `style`, `test`.

## Workspaces

```text
apps/
  web/                 # Next.js 16 frontend (React 19, Tailwind v4, shadcn/ui)  → @apps/web
  backend/             # Elysia.js entry point — assembles plugins, starts HTTP   → @apps/backend
packages/
  backend-base/        # All backend business logic as Elysia plugins            → @repo/backend-base
  database/            # Drizzle ORM schema + PostgreSQL client                   → @repo/db
  api/                 # Generated API client (hey-api) for the frontend          → @repo/api
  ui/                  # shadcn/ui + custom React component library               → @repo/ui
  emails/              # React Email transactional templates                      → @repo/emails
  typescript-config/   # Shared tsconfig bases                                    → @repo/typescript-config
```

Each workspace owns a `CLAUDE.md` documenting its conventions. Start there.

## Commands

Run these from the repository root; Turborepo fans out to every workspace.

```bash
bun install            # Install all workspace dependencies
bun dev                # Run every app in dev mode
bun run format         # Biome format (write)
bun run lint           # Biome lint
bun run lint-fix       # Biome lint with --fix
bun run tsc            # TypeScript type-check (check-types)
bun run test           # Run all tests
bun run test:coverage  # Run tests with coverage
```

Target a single workspace with a Turborepo filter:

```bash
turbo dev --filter=web        # Frontend only (port 3000)
turbo dev --filter=backend    # Backend only (port 3333)
```

Start infrastructure (PostgreSQL `5432`, Redis `6379`, Redis Commander `8081`, Stripe CLI) with `docker compose up -d`.

## Naming Conventions

| Element | Case | Example |
|---|---|---|
| Variables, functions, methods | `camelCase` | `getUserById` |
| Files, directories | `kebab-case` | `auth.service.ts` |
| Constants, env variables | `UPPERCASE` | `DATABASE_URL` |
| Types, interfaces, classes | `PascalCase` | `UserService` |

File role suffix pattern — `<feature>.<role>.ts` (kebab-case feature):

```text
auth.service.ts   auth.repository.ts  auth.dto.ts     auth.schema.ts
auth.errors.ts    auth.plugin.ts      auth.worker.ts  auth.job.ts
auth.factory.ts   auth.test.ts
```

## Coding Rules

- Use strong typing. Prefer TypeScript utility types (`Pick`, `Omit`, `Partial`) over redeclaring shapes.
- Treat duplication as a defect: share Zod schemas and DTOs, never copy them.
- Follow the official documentation of every framework and library you touch. When the docs leave a real ambiguity, ask before guessing.
- Keep documentation examples self-explanatory and objective — this is a starter; clarity beats cleverness.

### Never

- Use `any`.
- Use `unknown` without refining it first.
- Create a custom type when a TypeScript utility type already expresses it.
- Duplicate a Zod schema or a DTO.
- Access the database outside a repository / service in `@repo/backend-base`.
- Access Stripe outside the `stripe` plugin in `@repo/backend-base`.

## Mandatory Workflow

Follow this order for every change:

1. Read the closest `CLAUDE.md` (workspace), then this root only if needed.
2. Read any relevant skill in `.claude/skills/`.
3. Plan the change.
4. Implement it.
5. `bun run format`
6. `bun run lint-fix` → `bun run lint`
7. `bun run tsc`
8. `bun run test` (and `bun run test:coverage` when coverage matters).
9. Update the affected documentation.

## Cross-Workspace Contracts

- **API client** — After any backend route or schema change, regenerate `@repo/api`: start the backend, then run `bun run generate` from `packages/api/`. The frontend consumes types and hooks from `@repo/api`.
- **Auth schema** — After editing BetterAuth config (`packages/backend-base/src/lib/better-auth/auth.ts`), run `bun db:schema` from `packages/database/` to regenerate the managed tables.
- **Emails** — `@repo/backend-base` renders templates from `@repo/emails`. Keep template props typed and stable.

## Environment

Every app and package copies its own `.env` from `.env.example`. Defaults: backend `http://localhost:3333`, web `http://localhost:3000`, PostgreSQL `postgresql://docker:docker@localhost:5432/ignite-starter`, Redis `redis://:abcd1234@localhost:6379`. `@repo/backend-base/src/env.ts` validates backend variables at startup and throws on a missing value.

## Subagents & Skills

- `.claude/agents/code-reviewer.md` — review a diff against these rules before a PR.
- `.claude/agents/security-auditor.md` — audit auth, Stripe, database, and secret handling.
- `.claude/skills/open-pr/` — open a pull request: run the gate, write a Conventional Commit, and fill `.github/PULL_REQUEST_TEMPLATE.md`. Always use this template when opening a PR.
- `.claude/skills/*-best-practices`, `create-auth-skill` — vendored BetterAuth reference skills, pinned in `skills-lock.json`. Treat them as managed dependencies; do not hand-edit.
