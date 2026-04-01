# Observability with SigNoz (Open Source + Docker)

This project can run a local SigNoz stack using Docker, with no paid services.

## What this sets up

- SigNoz UI at `http://localhost:8080`
- OTLP gRPC ingest at `localhost:4317`
- OTLP HTTP ingest at `localhost:4318`

## Prerequisites

- Docker + Docker Compose
- Git

## Start SigNoz

From the repo root:

```zsh
bun run observability:up
```

This script clones the official SigNoz repository into `./.observability/signoz` (ignored by git) and starts the official Docker standalone deployment from `deploy/docker`.

## Stop SigNoz

```zsh
bun run observability:down
```

## Backend env vars (`apps/backend/.env`)

Use these values to export telemetry to local SigNoz:

```dotenv
OTEL_SERVICE_NAME=backend-api
OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
OTEL_TRACES_EXPORTER=otlp
```

## Validate traces

1. Start SigNoz:

```zsh
bun run observability:up
```

2. Start backend:

```zsh
cd apps/backend
bun dev
```

3. Generate API traffic (for example):

```zsh
curl -i http://localhost:3333/openapi/json
```

4. Open SigNoz (`http://localhost:8080`) and check **APM > Services > backend-api**.

## Notes

- Keep `4317`, `4318`, and `8080` free on your machine.
- If your backend runs inside Docker, use `http://host.docker.internal:4318` for `OTEL_EXPORTER_OTLP_ENDPOINT`.
- Backend instrumentation is initialized in `apps/backend/src/instrumentation.ts` and started from `apps/backend/src/index.ts`.
- `apps/backend/src/instrumentation.ts` uses a custom `SignozListViewAttributesProcessor` to normalize span attributes for list/table views.
- Request-level spans are created automatically by `packages/backend-base/src/shared/telemetry.plugin.ts` (registered in `shared.plugin.ts`).
- Better Auth span enrichment helper lives in `packages/backend-base/src/lib/telemetry/auth-span-telemetry.ts` and is used by `packages/backend-base/src/lib/better-auth/auth.ts` hooks.
- Better Auth should be imported only after OTEL startup (already done in `apps/backend/src/index.ts` by calling `startOpenTelemetry()` before loading plugins).
- In `better-auth@1.5.6`, `options.telemetry`/`BETTER_AUTH_TELEMETRY` are product analytics controls (`@better-auth/telemetry`), not SigNoz tracing configuration.

## SigNoz list columns (`http_method` / `response_status_code`)

Some spans (especially internal/hook spans) can emit only semantic-convention keys like `http.method` and `http.response.status_code`.

To keep SigNoz list views consistent, the backend applies alias normalization on every ended span:

- Method aliases: `http.method` / `http.request.method` -> `http_method`
- Status aliases: `http.status_code` / `http.response.status_code` -> `response_status_code`

If you still see `N/A` in list rows:

1. Restart backend to ensure latest instrumentation is loaded.
2. Generate new traffic (old traces keep old attributes).
3. Confirm env vars in `apps/backend/.env` point to local OTLP HTTP (`http://localhost:4318`).
