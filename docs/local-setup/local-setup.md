<!-- @format -->

# Local Setup Guide for Origin Starter

This guide describes the complete step-by-step process to run the project
**locally** using Docker, Drizzle, and Bun/Node.

> Follow the steps in order. At the end, you should be able to run `bun dev` and
> test the app at `http://localhost:3000`.

---

## 1. Prerequisites

Before starting, make sure you have installed on your machine:

- **Git**
- **Node.js 22+** (recommended if using `npm`/`npx`)
- **[Bun](https://bun.sh/)** (recommended for this project)
- **[Docker Desktop](https://www.docker.com/products/docker-desktop/)** (with
  Docker Compose)
- **[Stripe CLI](https://stripe.com/docs/stripe-cli)** (for webhooks, if you
  want to run outside the container)

Quick verification:

```bash
node -v
bun -v
docker --version
stripe --version
```

---

## 2. Clone repository and install dependencies

```bash
# 1) Clone the project
git clone git@github.com:WilliamElesbao/ignite-starter.git
cd ignite-starter

# 2) Install dependencies (recommended)
bun install

# (Optional) If you prefer npm
# npm install
```

---

## 3. Configure environment variables

The project already has an example file: `.env.example`.

1. Create the `.env` file at the root from the example:

```bash
cp .env.example .env
```

2. Open `.env` and fill in the values marked as `<your secret>`:

```dotenv
# Base URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/starter

# BetterAuth
BETTER_AUTH_SECRET=<generate a strong secret>
BETTER_AUTH_URL=http://localhost:3000

# Google
GOOGLE_CLIENT_ID=<copy from Google Cloud Console>
GOOGLE_CLIENT_SECRET=<copy from Google Cloud Console>

# Email (optional for local environment)
RESEND_API_KEY=<if you have one>
EMAIL_FROM=delivered@resend.dev
EMAIL_TO=example@mail.com
AUDIENCE_ID=<if you have one>

# Stripe
STRIPE_API_KEY=<copy from Stripe account (test key)>
STRIPE_WEBHOOK_SECRET=<copy from Stripe CLI after configuring webhook>
```

> How to get **Google** and **Stripe** variables is detailed in:
>
> - `docs/google/google-oauth-setup.md`
> - `docs/stripe/stripe-setup.md`

---

## 4. Start Docker containers

The project already contains a `docker-compose.yml` with:

- `postgres` – PostgreSQL database
- `redis` – Redis cache
- `redis-commander` – Redis web UI
- `stripe` – Stripe CLI in "listen" mode for webhooks (can be adjusted to use
  your own account)
- `jaeger` – Distributed tracing for observability

To start the infrastructure services:

```bash
# At the project root
docker compose up -d

# (If your Docker uses the old command)
# docker-compose up -d
```

This will expose:

- PostgreSQL at `localhost:5432`
- Redis at `localhost:6379`
- Redis Commander at `http://localhost:8081`
- Jaeger UI at `http://localhost:16686`

Verify that containers are running:

```bash
docker ps
```

You should see something like:

- `postgres`
- `redis`
- `redis-commander`
- `stripe-webhook`
- `jaeger`

### 4.1. Docker Volumes

Data persistence is handled via Docker volumes in `./.docker/`:

- `./.docker/postgres` - PostgreSQL data directory
- `./.docker/redis` - Redis data directory

These volumes ensure your data persists across container restarts. To reset data:

```bash
# Stop containers
docker compose down

# Remove volumes
rm -rf ./.docker/postgres
rm -rf ./.docker/redis

# Restart containers
docker compose up -d
```

## 5. Configure and run Drizzle (migrations + view tables)

The project uses Drizzle with PostgreSQL. The database URL is read from
`DATABASE_URL` in `.env`.

### 5.1. Ensure database is active

Confirm that the `postgres` container is running:

```bash
docker ps | grep postgres
```

If not, run again:

```bash
docker compose up -d postgres
```

### 5.2. Run migrations

With Docker and `.env` configured, apply migrations to the local database:

```bash
# Using Bun
cd packages/database
bun db:migrate

# (Alternative with npx)
# npx drizzle-kit migrate
```

This will:

- Create tables defined in `packages/database/src/schema/` in the `starter`
  database
- Update the `packages/database/drizzle` folder

### 5.3. View tables with Drizzle Studio

Open Drizzle Studio to view and edit database tables:

```bash
# Using Bun (from packages/database/)
bun db:studio

# (or with npx)
# npx drizzle-kit studio
```

By default, it will use the URL from `DATABASE_URL` in your `.env` and open at
`http://localhost:4983`.

---

## 6. Configure Google OAuth

For Google login, you need the variables:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

The complete step-by-step is in `docs/google/google-oauth-setup.md`, including:

- Creating the project in **Google Cloud Console**
- Configuring the OAuth consent screen
- Creating OAuth 2.0 credentials (Client ID / Secret)
- Configuring **redirect URIs** for local environment

After obtaining the values, update your `.env`.

---

## 7. Configure Stripe (test mode + webhook)

For Stripe integration, you need in `.env`:

- `STRIPE_API_KEY` (secret **test** key)
- `STRIPE_WEBHOOK_SECRET` (webhook secret generated by Stripe CLI)

The detailed step-by-step is in `docs/stripe/stripe-setup.md`, including:

- Create/use a Stripe account in **Test** mode
- Find and copy the `STRIPE_API_KEY`
- Run Stripe CLI (local or via Docker) with:

  ```bash
  stripe listen --forward-to http://host.docker.internal:3333/stripe/webhook
  ```

- Copy the `whsec_...` value to `STRIPE_WEBHOOK_SECRET`
- Generate test events (`stripe trigger ...`) to validate the flow

---

## 8. Run Tests

The project uses Vitest for unit testing with coverage reporting.

### 8.1. Run Tests Locally

```bash
# Run tests for web frontend
cd apps/web
bun run test

# Run tests with coverage
bun test:coverage

# Run tests for backend
cd packages/backend-base
bun run test

# Run tests with coverage
bun test:coverage
```

### 8.2. Test Files

Test files are located in `__tests__/` directories next to the code they test:

---

## 9. Run the project locally

With everything configured:

1. Docker containers running (`postgres`, `redis`, `jaeger`, `stripe-webhook`)
2. `.env` filled with Google/Stripe/DB/BetterAuth
3. Migrations executed with Drizzle

Run the development server:

```bash
# Recommended
bun dev

# Alternatives
# npm run dev
# pnpm dev
# yarn dev
```

Then open:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:3333`

You should be able to:

- Access the dashboard/login
- Start Google login flow (if configured)
- Perform actions that trigger Stripe calls (if configured)
- View distributed traces in Jaeger UI at `http://localhost:16686`

---

## 10. References

- **Next.js**: https://nextjs.org/docs
- **Docker Desktop**: https://docs.docker.com/desktop/
- **PostgreSQL**: https://www.postgresql.org/docs/
- **Drizzle ORM**: https://orm.drizzle.team/docs/overview
- **Drizzle Kit**: https://orm.drizzle.team/kit-docs/overview
- **Stripe Docs**: https://stripe.com/docs
- **Stripe CLI**: https://stripe.com/docs/stripe-cli
- **Google Cloud Console**: https://console.cloud.google.com/
- **Jaeger**: https://www.jaegertracing.io/docs/
- **Vitest**: https://vitest.dev/
