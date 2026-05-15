# Configuration Files Reference

## Overview

This document provides a reference for all CI/CD configuration files, their purpose, and minimal functional configurations.

## File Structure

```
.
├── .drone.yml                           # Drone CI pipeline
├── sonar-project.properties             # SonarCloud configuration
├── .github/
│   ├── workflows/
│   │   ├── sonar.yml                    # SonarCloud analysis workflow
│   │   └── pr-review.yml                # Biome linting workflow
│   ├── PULL_REQUEST_TEMPLATE.md         # PR template
│   └── copilot-instructions.md          # GitHub Copilot context
```

## .drone.yml

**Purpose:** Main CI pipeline for type checking and linting

**Location:** Repository root

```yaml
kind: pipeline
type: docker
name: CI

platform:
  arch: arm64

clone:
  depth: 100

trigger:
  branch:
    - main
  event:
    - push
    - pull_request
    - tag

steps:
  - name: install
    image: oven/bun:1.3.3
    commands:
      - bun install

  - name: typecheck
    image: oven/bun:1.3.3
    commands:
      - (cd apps/web && bun tsc --noEmit)
      - (cd apps/backend && bun tsc --noEmit)
      - (cd packages/backend-base && bun tsc --noEmit)
      - (cd packages/database && bun tsc --noEmit)
      - (cd packages/emails && bun tsc --noEmit)
      - (cd packages/api && bun tsc --noEmit)
      - (cd packages/ui && bun tsc --noEmit)
    depends_on:
      - install

  - name: test
    image: oven/bun:1.3.3
    commands:
      - (cd apps/web && bun test:run)
      - (cd packages/backend-base && bun test:run)
    depends_on:
      - typecheck

  - name: lint
    image: oven/bun:1.3.3
    commands:
      - bun biome ci .
    depends_on:
      - test
```

**Key Features:**
- Sequential execution: install → typecheck → test → lint
- Uses Bun 1.3.3 Docker image
- Shallow clone (depth: 100) for faster checkout
- ARM64 platform support
- Vitest unit tests for web and backend-base packages

## sonar-project.properties

**Purpose:** SonarCloud project configuration

**Location:** Repository root

```properties
sonar.projectKey=your-org_your-repo
sonar.organization=your-org

# Sources
sonar.sources=\
  apps/web/src,\
  apps/backend/src,\
  packages/backend-base/src,\
  packages/database/src,\
  packages/emails/src,\
  packages/ui/src

# Exclusions
sonar.exclusions=\
  **/node_modules/**,\
  **/generated/**,\
  **/.next/**,\
  **/dist/**,\
  **/build/**,\
  **/*.gen.ts,\
  **/*.test.ts,\
  **/*.test.tsx,\
  **/*.spec.ts,\
  **/*.spec.tsx

sonar.tests=apps/web/src,packages/backend-base/src
sonar.test.inclusions=**/*.test.ts,**/*.test.tsx,**/*.spec.ts,**/*.spec.tsx

# Test Coverage (optional - enable when coverage reporting is configured)
# sonar.coverage.exclusions=**/*
# sonar.javascript.lcov.reportPaths=apps/web/coverage/lcov.info,packages/backend-base/coverage/lcov.info
```

**Configuration Notes:**
- Replace `your-org_your-repo` with your SonarCloud project key
- Replace `your-org` with your SonarCloud organization key
- Adjust source paths if your monorepo structure differs
- Test paths are configured for apps/web and packages/backend-base
- Uncomment coverage lines when ready to enable coverage reporting

## .github/workflows/sonar.yml

**Purpose:** GitHub Actions workflow for SonarCloud analysis

**Location:** `.github/workflows/sonar.yml`

```yaml
name: SonarCloud

on:
  push:
  pull_request:

jobs:
  sonar:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: 1.3.3

      - name: Install dependencies
        run: bun install

      - name: SonarCloud Scan
        uses: SonarSource/sonarqube-scan-action@v5.0.0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
```

**Key Features:**
- Triggers on all pushes and pull requests
- Full git history for accurate analysis (fetch-depth: 0)
- Uses official SonarCloud GitHub Action
- Simplified configuration without validation step

## .github/workflows/pr-review.yml

**Purpose:** Inline code quality feedback on pull requests

**Location:** `.github/workflows/pr-review.yml`

```yaml
name: Biome

on:
  pull_request:

jobs:
  lint:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: 1.3.3

      - run: bun install

      - run: bun biome check --reporter=github .
        continue-on-error: true
```

**Key Features:**
- Only runs on pull requests
- Uses GitHub reporter for inline annotations
- Continues on error to always provide feedback
- Minimal configuration for fast execution

## .github/PULL_REQUEST_TEMPLATE.md

**Purpose:** Standardized pull request template

**Location:** `.github/PULL_REQUEST_TEMPLATE.md`

```markdown
# Reference

[Add any relevant link (issue, ticket, doc, etc)]

## Changes

- **Added:**
  - ...
- **Updated:**
  - ...
- **Fixed:**
  - ...

## Considerations

[Any considerations about the code changes (remove section if not used)]

## Screenshots

[Any screenshots of changes (remove if not applied)]
```

## .github/copilot-instructions.md

**Purpose:** Project context for GitHub Copilot

**Location:** `.github/copilot-instructions.md`

This file provides GitHub Copilot with project-specific context including:
- Technology stack
- Code conventions
- Architecture patterns
- Common commands
- Best practices

See [copilot-instructions.md](../../.github/copilot-instructions.md) for the full content.

## Maintenance

### Updating Configuration

When updating configuration files:

1. Test changes in a feature branch first
2. Verify all checks pass before merging
3. Update documentation if behavior changes
4. Communicate changes to the team

### Version Pinning

- Bun version: `1.3.3` (update in all workflow files)
- GitHub Actions: Use major version tags (e.g., `@v4`)
- Docker images: Use specific versions for reproducibility
