<!-- @format -->

# Documentation

Central documentation hub for Ignite Starter.

## Start here

- [Local setup](./local-setup/local-setup.md)
- [Docker deployment](./docker/deployment.md)
- [CI/CD overview](./ci-cd/README.md)

## Setup and integrations

- [Google OAuth setup](./google/google-oauth-setup.md)
- [Stripe setup](./stripe/stripe-setup.md)

## CI/CD

- [CI/CD README](./ci-cd/README.md)
- [Pipeline architecture](./ci-cd/pipeline-architecture.md)
- [Drone setup](./ci-cd/drone-setup.md)
- [GitHub configuration](./ci-cd/github-configuration.md)
- [SonarCloud setup](./ci-cd/sonarcloud-setup.md)
- [Configuration files reference](./ci-cd/configuration-files.md)

## Testing and quality quick reference

```bash
# Web tests
(cd apps/web && bun run test)
(cd apps/web && bun test:coverage)

# Backend-base tests
(cd packages/backend-base && bun run test)
(cd packages/backend-base && bun test:coverage)

# i18n audit scripts
(cd apps/web && bun run locale-check)
(cd apps/web && bun run locale-unused)

# Repository quality gates
bun run check:all
```

## Package and app documentation

- `README.md` (repository root)
- `apps/backend/README.md`
- `packages/api/README.md`
- `packages/emails/readme.md`
- `apps/backend/CLAUDE.md`
- `apps/web/CLAUDE.md`
- `packages/backend-base/CLAUDE.md`
- `packages/database/CLAUDE.md`

## Notes

- This repository is intended to be a reusable starter foundation.
- Keep docs aligned with real scripts/configs before merging architecture or
  workflow changes.
