# Ignite Starter
Ignite Starter is a scalable fullstack monorepo starter for teams that want to bootstrap new products with a production-oriented baseline.
It provides a ready-to-extend foundation for web, API, database, email, testing, and CI workflows.

## Project overview
Use this repository as a boilerplate to launch new applications quickly while keeping architecture and quality standards consistent from day one.
The project is structured so business features can be added without rewriting core platform concerns.

# Screenshots

## Authentication Flow

| Sign In | Sign Up | Welcome Toast |
| --- | --- | --- |
| ![sign-in](docs/1.png) | ![sign-up](docs/2.png) | ![welcome-toast](docs/3.png) |

---

## Email & Theme

| Light Theme | Send Email Action | Email Template |
| --- | --- | --- |
| ![light-theme](docs/4.png) | ![send-email-action](docs/5.png) | ![email-template](docs/6.png) |

---

## Billing & Stripe

| Plans | Redirecting to Stripe | Stripe Checkout |
| --- | --- | --- |
| ![plans](docs/7.png) | ![redirecting-to-stripe](docs/8.png) | ![stripe-checkout](docs/9.png) |

| Cancel Subscription Dialog | Subscription Canceled Toast |
| --- | --- |
| ![cancel-subscription-dialog](docs/10.png) | ![subscription-canceled-toast](docs/11.png) |

---

## Infrastructure & Observability

<table>
  <tr>
    <th>Backend API (ElysiaJS)</th>
    <th>Database (Drizzle ORM)</th>
    <th>Queue (Bull Board / BullMQ)</th>
    <th colspan="2">Telemetry & Monitoring (SigNoz)</th>
  </tr>

  <tr>
    <td><img src="docs/12.png" /></td>
    <td><img src="docs/13.png" /></td>
    <td><img src="docs/14.png" /></td>
    <td><img src="docs/15.png" /></td>
    <td><img src="docs/16.png" /></td>
  </tr>
</table>



## Architecture overview
- `apps/web`: Next.js frontend (App Router) with i18n and shared UI consumption
- `apps/backend`: thin API runtime entry point
- `packages/backend-base`: backend business logic (plugins, services, DTOs, queue)
- `packages/database`: Drizzle schema, migrations, and shared DB client
- `packages/api`: generated API client from backend OpenAPI
- `packages/emails`: React Email templates
- `packages/ui`: shared UI package

## Tech stack
- Frontend: Next.js 16, React 19, Tailwind CSS v4, next-intl
- Backend: Elysia + Bun
- Data: PostgreSQL + Drizzle ORM
- Auth: BetterAuth (email/password + Google OAuth)
- Queue: BullMQ + Redis (email jobs)
- Email: Resend + React Email templates
- Testing: Vitest + coverage (v8)
- Quality: Biome + TypeScript
- CI: Drone CI + GitHub Actions + SonarCloud
- Infra: Docker Compose (database, redis, stripe webhook forwarder, jaeger)

## Monorepo structure
```text
apps/
  backend/
  web/
packages/
  api/
  backend-base/
  database/
  emails/
  typescript-config/
  ui/
docs/
```

## Development workflow
1. Install dependencies.
2. Configure environment files.
3. Start infrastructure with Docker.
4. Run database migrations.
5. Start the apps in dev mode.

```bash
bun install
cp apps/backend/.env.example apps/backend/.env
cp apps/web/.env.example apps/web/.env
cp packages/database/.env.example packages/database/.env
cp packages/backend-base/.env.example packages/backend-base/.env
cp packages/api/.env.example packages/api/.env
docker compose up -d
(cd packages/database && bun db:migrate)
bun dev
```

## Core commands
```bash
# Monorepo
bun dev
bun build
bun check-types
bun lint
bun format
bun check:all

# API client generation (backend must be running)
(cd packages/api && bun run generate)

# i18n audit (web)
(cd apps/web && bun run locale-check)
(cd apps/web && bun run locale-unused)
```

## Testing strategy
Unit tests run with Vitest in:
- `apps/web` (including sign-in and email hook tests)
- `packages/backend-base` (including auth, email service, and BullMQ worker tests)

```bash
(cd apps/web && bun run test)
(cd apps/web && bun test:coverage)
(cd packages/backend-base && bun run test)
(cd packages/backend-base && bun test:coverage)
```

## Docker support
The repository includes Dockerfiles for web and backend, with:
- Next.js standalone runtime image for web
- Non-root container execution
- Backend image dependency on `packages/database` build artifacts

See `docs/docker/deployment.md` for the complete build and run flow.

## CI/CD overview
- Drone CI (`.drone.yml`): install, i18n audit, typecheck, lint, tests, and build pipeline
- GitHub Actions:
  - `.github/workflows/sonar.yml` (SonarCloud scan)
  - `.github/workflows/pr-review.yml` (Biome annotations)
- SonarCloud project config in `sonar-project.properties`

## Environment setup
Environment files are per app/package, not global:
- `apps/backend/.env`
- `apps/web/.env`
- `packages/database/.env`
- `packages/backend-base/.env`
- `packages/api/.env`

Use `*.env.example` in each location as the base template.

## Features
### Ready
- [x] Next.js web app
- [x] Backend API
- [x] Database package with Drizzle
- [x] Shared API client package
- [x] Shared UI package
- [x] Email templates package
- [x] BetterAuth authentication (email/password) + Google OAuth
- [x] Stripe integration
- [x] BullMQ email queue with Redis
- [x] Unit tests with Vitest
- [x] Test coverage setup
- [x] Sign-in unit tests
- [x] Email service and queue unit tests
- [x] i18n audit scripts
- [x] Docker infrastructure
- [x] Backend and frontend Docker images
- [x] Standalone Next.js build strategy
- [x] Non-root container execution
- [x] CI pipeline (Drone + GitHub Actions + SonarCloud)
- [x] Database build dependency flow in container pipeline
- [x] Documentation for setting up observability tools such as Jaeger and SigNoz

### Planned / In progress
- [ ] E2E tests with Playwright
- [ ] Continuous Deployment (CD)

## Documentation
- `docs/README.md`
- `docs/local-setup/local-setup.md`
- `docs/docker/deployment.md`
- `docs/ci-cd/README.md`
- `docs/google/google-oauth-setup.md`
- `docs/stripe/stripe-setup.md`
