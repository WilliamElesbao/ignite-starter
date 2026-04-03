# Pipeline Architecture

## Overview

The CI/CD pipeline is designed with separation of concerns, ensuring each workflow has a specific responsibility without redundancy.

## Pipeline Execution Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     GitHub Event                             │
│              (Push or Pull Request)                          │
└────────────────────┬────────────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌──────────────────┐
│   Drone CI      │    │ GitHub Actions   │
│   (.drone.yml)  │    │  (2 workflows)   │
└────────┬────────┘    └────────┬─────────┘
         │                      │
         │                      ├─────────────────┐
         │                      │                 │
         ▼                      ▼                 ▼
┌─────────────────┐    ┌──────────────┐  ┌──────────────┐
│  Install Step   │    │  SonarCloud  │  │  PR Review   │
│  (bun install)  │    │   Workflow   │  │   Workflow   │
└────────┬────────┘    └──────┬───────┘  └──────┬───────┘
         │                    │                  │
    ┌────┴────┬────┬─────┐    │                  │
    ▼         ▼    ▼     ▼    ▼                  ▼
┌────────┐ ┌────┐ ┌────┐ ┌────────────┐  ┌──────────────┐
│Typecheck│ │Lint│ │Test│ │ SonarCloud │  │    Biome     │
│ (7 pkg) │ │    │ │(2p)│ │  Analysis  │  │ Annotations  │
└────┬────┘ └─┬──┘ └─┬──┘ └─────┬──────┘  └──────┬───────┘
     │        │      │          │                 │
     └────────┴──────┴──────────┴─────────────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │  GitHub Commit Status │
          │  ✓ CI                 │
          │  ✓ SonarCloud         │
          │  ✓ Biome Lint         │
          └──────────────────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │ Branch Protection    │
          │ Allows/Blocks Merge  │
          └──────────────────────┘
```

## Component Responsibilities

### Drone CI (.drone.yml)

**Purpose:** Primary CI pipeline for code validation

**Responsibilities:**
- Install dependencies
- Run TypeScript type checking across all packages
- Execute Biome linting
- Run unit tests

**Triggers:** Push events and pull requests

**Parallelization:** Type checking, linting, and testing run in parallel after dependency installation

### SonarCloud Workflow (.github/workflows/sonar.yml)

**Purpose:** Code quality and security analysis

**Responsibilities:**
- Analyze code quality metrics
- Track technical debt
- Identify security vulnerabilities
- Monitor code coverage trends

**Triggers:** Push events and pull requests

**Note:** Does NOT duplicate Drone CI checks - focuses solely on quality analysis

### PR Review Workflow (.github/workflows/pr-review.yml)

**Purpose:** Inline code quality feedback on pull requests

**Responsibilities:**
- Run Biome checks with GitHub reporter
- Add inline annotations to PR diff
- Provide immediate feedback on code quality issues

**Triggers:** Pull request events only (opened, synchronize, reopened)

**Note:** Uses `--reporter=github` to provide inline comments without duplicating the full lint check

## Separation of Concerns

| Check | Drone CI | SonarCloud | PR Review |
|-------|----------|------------|-----------|
| Type Checking | ✅ | ❌ | ❌ |
| Linting (CI mode) | ✅ | ❌ | ❌ |
| Linting (Annotations) | ❌ | ❌ | ✅ |
| Unit Tests | ✅ | ❌ | ❌ |
| Code Quality Analysis | ❌ | ✅ | ❌ |
| Security Analysis | ❌ | ✅ | ❌ |

## Workflow Optimization

- **No Redundancy:** Each workflow has a distinct purpose
- **Parallel Execution:** Drone CI runs checks in parallel after dependency installation
- **Fast Feedback:** PR Review provides immediate inline feedback
- **Comprehensive Analysis:** SonarCloud provides deep quality insights without blocking on test failures
