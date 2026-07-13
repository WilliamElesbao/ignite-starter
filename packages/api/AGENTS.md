You are an expert in type-safe API contracts and code generation. This package (`@repo/api`) is **fully generated** — you do not author client code here, you regenerate it. Treat `generated/` as build output, never hand-edit it.

## Role

`@repo/api` turns the backend's OpenAPI spec into a typed client that `apps/web` consumes. It is the single source of truth for the frontend/backend contract.

```ts
// index.ts — the only public surface
export * from "./generated/api/@tanstack/react-query.gen"; // TanStack Query hooks
export * from "./generated/api/client";                    // typed SDK + fetch client
```

Consume it from the frontend as `@repo/api`:

```ts
import { useGetUserByIdOptions } from "@repo/api";
```

## How Generation Works

`@hey-api/openapi-ts` reads `${API_URL}/openapi/json` and writes `generated/api/`. Config lives in `openapi-ts.config.ts`.

| Plugin | Output |
|---|---|
| `@hey-api/typescript` | Types (enums emitted as JS objects, exported from root) |
| `@hey-api/sdk` | SDK request functions |
| `@hey-api/client-fetch` | Fetch client (runtime config: `src/lib/client/heyapi.ts`) |
| `@tanstack/react-query` | Query/mutation hooks |
| `@hey-api/schemas` | Runtime JSON schemas |

The pipeline runs two post-processors before Biome formats and lints the result:

| Script | Purpose |
|---|---|
| `src/scripts/fix-heyapi-headers.ts` | Repairs Hey API header callback types |
| `src/scripts/fix-unknown.ts` | Replaces generated `unknown` with `null` (honors the no-`unknown` rule) |

## Regenerate the Client

The backend **must be running** so the OpenAPI endpoint is reachable.

```bash
turbo dev --filter=backend          # 1. Start the backend (exposes /openapi/json)
cd packages/api && bun run generate # 2. Regenerate types, SDK, and hooks
```

Regenerate after **any** backend contract change: new or changed route, DTO, response shape, or error code.

## Environment

Copy `.env.example` to `.env` and set the backend URL:

```dotenv
API_URL=http://localhost:3333
```

## Conventions

| Topic | Rule |
|---|---|
| `generated/` | Build output. Never hand-edit; it is excluded from Biome linting. |
| Contract changes | Always flow backend → regenerate here → consume in `apps/web`. Never patch the client to mask a backend mismatch. |
| Runtime config | Customize the fetch client only in `src/lib/client/heyapi.ts`, never inside `generated/`. |
| Post-processing | Add new fixups as scripts under `src/scripts/` and register them in `openapi-ts.config.ts`. |
| `unknown` | Forbidden in shipped types. The `fix-unknown` script enforces this on generation. |
