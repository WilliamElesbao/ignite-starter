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
│   │   └── pr-review.yml                # PR review workflow
│   ├── PULL_REQUEST_TEMPLATE.md         # PR template
│   └── copilot-instructions.md          # GitHub Copilot context
```

## .drone.yml

**Purpose:** Main CI pipeline for type checking, linting, and testing

**Location:** Repository root

```yaml
kind: pipeline
type: docker
name: CI

clone:
  depth: 50

steps:
  - name: install
    image: oven/bun:1.3.3
    commands:
      - bun install --frozen-lockfile

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

  - name: lint
    image: oven/bun:1.3.3
    commands:
      - bun biome ci .
    depends_on:
      - install

  - name: test
    image: oven/bun:1.3.3
    commands:
      - (cd apps/web && bun test)
      - (cd packages/backend-base && bun test)
    depends_on:
      - install
```

**Key Features:**
- Parallel execution of typecheck, lint, and test after install
- Uses Bun 1.3.3 Docker image
- Shallow clone (depth: 50) for faster checkout

## sonar-project.properties

**Purpose:** SonarCloud project configuration

**Location:** Repository root

```properties
sonar.projectKey=your-org_your-repo
sonar.organization=your-org

sonar.sources=apps/web/src,apps/backend/src,packages/backend-base/src,packages/database/src,packages/emails/src,packages/ui/src

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
```

**Configuration Notes:**
- Replace `your-org_your-repo` with your SonarCloud project key
- Replace `your-org` with your SonarCloud organization key
- Adjust source paths if your monorepo structure differs

## .github/workflows/sonar.yml

**Purpose:** GitHub Actions workflow for SonarCloud analysis

**Location:** `.github/workflows/sonar.yml`

```yaml
name: SonarCloud Analysis

on:
  push:
    branches: ["**"]
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  sonarcloud:
    name: SonarCloud
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: 1.3.3

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: SonarCloud Scan
        uses: SonarSource/sonarcloud-github-action@master
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
```

**Key Features:**
- Triggers on all branches and pull requests
- Full git history for accurate analysis (fetch-depth: 0)
- Uses official SonarCloud GitHub Action

## .github/workflows/pr-review.yml

**Purpose:** Inline code quality feedback on pull requests

**Location:** `.github/workflows/pr-review.yml`

```yaml
name: PR Review

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  biome-annotations:
    name: Biome Lint
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
      checks: write

    steps:
      - uses: actions/checkout@v4

      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: 1.3.3

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Biome Check
        run: bun biome check --reporter=github .
        continue-on-error: true
```

**Key Features:**
- Only runs on pull requests
- Uses GitHub reporter for inline annotations
- Continues on error to always provide feedback

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
