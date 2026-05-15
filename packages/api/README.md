# `@repo/api`
This package contains the generated TypeScript API client used by `apps/web`.

## Purpose
- Generate client types and SDK methods from backend OpenAPI
- Provide typed request functions and TanStack Query integrations
- Keep frontend/backend contracts synchronized

## Source of truth
- OpenAPI endpoint: `http://localhost:3333/openapi/json`
- Generator config: `packages/api/openapi-ts.config.ts`
- Output directory: `packages/api/generated/api`

## Environment
Create `packages/api/.env` from `.env.example`:
```dotenv
API_URL=http://localhost:3333
```

## Generate client
Backend must be running before generation.

```bash
(cd packages/api && bun run generate)
```

The generation pipeline also runs post-processing scripts and Biome formatting/linting.

## When to regenerate
Regenerate after any backend API contract change, including:
- Route additions/removals
- Request/response DTO changes
- Error schema changes

## Consuming the package
Frontend imports from `@repo/api` and should not call generated files via deep relative paths.
