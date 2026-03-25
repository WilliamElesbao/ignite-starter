# API package

This package contains the generated API client based on the OpenAPI schema exposed at `http://localhost:4000/openapi`.

## Generate client

From the monorepo root:

```bash
cd packages/api
bun install
bun run generate
```

The generated client will be placed under `src/client`.
