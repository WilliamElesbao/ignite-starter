# Pipeline Architecture

## Overview

The CI/CD pipeline is designed with separation of concerns, ensuring each workflow has a specific responsibility without redundancy. The simplified architecture focuses on essential checks while maintaining code quality.

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
│  Install Step   │    │  SonarCloud  │  │  Biome Lint  │
│  (bun install)  │    │   Workflow   │  │   Workflow   │
└────────┬────────┘    └──────┬───────┘  └──────┬───────┘
         │                    │                  │
    ┌────┴────┐               │                  │
    ▼         ▼               ▼                  ▼
┌────────┐ ┌────┐    ┌────────────┐  ┌──────────────┐
│Typecheck│ │Test│    │ SonarCloud │  │    Biome     │
│ (7 pkg) │ │    │    │  Analysis  │  │ Annotations  │
└────┬────┘ └─┬──┘    └─────┬──────┘  └──────┬───────┘
     │        │             │                 │
     └───┬────┴─────────────┴─────────────────┘
         ▼
    ┌────────┐
    │  Lint  │
    │        │
    └───┬────┘
        │
        ▼
┌──────────────────────┐
│  GitHub Commit Status │
│  ✓ CI                 │
│  ✓ SonarCloud         │
│  ✓ Biome              │
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
- Execute Vitest unit tests for web and backend-base packages
- Execute Biome linting

**Triggers:** Push events and pull requests to main branch

**Execution Flow:** Sequential (install → typecheck → test → lint)

**Platform:** ARM64 architecture support

### SonarCloud Workflow (.github/workflows/sonar.yml)

**Purpose:** Code quality and security analysis

**Responsibilities:**
- Analyze code quality metrics
- Track technical debt
- Identify security vulnerabilities
- Monitor code coverage trends (when enabled)

**Triggers:** All push events and pull requests

**Note:** Does NOT duplicate Drone CI checks - focuses solely on quality analysis

### Biome Lint Workflow (.github/workflows/pr-review.yml)

**Purpose:** Inline code quality feedback on pull requests

**Responsibilities:**
- Run Biome checks with GitHub reporter
- Add inline annotations to PR diff
- Provide immediate feedback on code quality issues

**Triggers:** Pull request events only

**Note:** Uses `--reporter=github` to provide inline comments without duplicating the full lint check

## Separation of Concerns

| Check | Drone CI | SonarCloud | Biome Lint |
|-------|----------|------------|------------|
| Type Checking | ✅ | ❌ | ❌ |
| Unit Tests | ✅ | ❌ | ❌ |
| Linting (CI mode) | ✅ | ❌ | ❌ |
| Linting (Annotations) | ❌ | ❌ | ✅ |
| Code Quality Analysis | ❌ | ✅ | ❌ |
| Security Analysis | ❌ | ✅ | ❌ |
| Technical Debt Tracking | ❌ | ✅ | ❌ |

## Workflow Optimization

- **No Redundancy:** Each workflow has a distinct purpose
- **Sequential Execution:** Drone CI runs checks sequentially for clarity
- **Fast Feedback:** Biome Lint provides immediate inline feedback on PRs
- **Comprehensive Analysis:** SonarCloud provides deep quality insights
- **Minimal Configuration:** Simplified setup reduces maintenance overhead

## Execution Times (Approximate)

| Workflow | Typical Duration | Blocking |
|----------|-----------------|----------|
| Drone CI | 3-5 minutes | Yes |
| SonarCloud | 1-3 minutes | Yes |
| Biome Lint | 30-60 seconds | No (continue-on-error) |

## Architecture Decisions

### Why Sequential in Drone CI?

While parallel execution is faster, sequential execution provides:
- Clearer error messages (know exactly which step failed)
- Better resource utilization on self-hosted runners
- Simpler dependency management
- Easier debugging

### Why Separate Biome Workflows?

- **Drone CI**: Runs `biome ci` for strict validation (fails on errors)
- **GitHub Actions**: Runs `biome check --reporter=github` for inline annotations (continues on error)

This separation allows:
- Strict validation in CI pipeline
- Helpful inline feedback without blocking PRs
- Different reporting formats for different purposes

### Why Test Step in Drone CI?

Tests are now included in the Drone CI pipeline:
- Vitest unit tests run for `apps/web` and `packages/backend-base`
- Test step runs after typecheck and before lint
- Coverage reporting can be enabled in SonarCloud when ready
- Test files use `__tests__/` directories alongside source code

## Future Enhancements

When the project grows, consider:

1. **Enable Test Coverage Reporting**
   - Configure coverage reporting to SonarCloud
   - Set coverage thresholds
   - Add coverage badges to README

## Monitoring and Debugging

### Viewing Pipeline Status

- **Drone CI**: Access your Drone dashboard at your configured URL
- **GitHub Actions**: Go to repository → Actions tab
- **SonarCloud**: Visit your SonarCloud project dashboard

### Common Issues

| Issue | Likely Cause | Solution |
|-------|--------------|----------|
| Drone CI not triggering | Webhook not configured | Check GitHub webhook settings |
| SonarCloud fails | Missing SONAR_TOKEN | Add secret to GitHub repository |
| Biome annotations missing | Wrong reporter | Ensure using `--reporter=github` |
| Type check fails | Outdated dependencies | Run `bun install` locally |

### Debug Commands

```bash
# Test Biome locally
bun biome ci .

# Test type checking locally
cd apps/web && bun tsc --noEmit
cd apps/backend && bun tsc --noEmit

# Test unit tests locally
cd apps/web && bun run test
cd packages/backend-base && bun run test

# Test full CI pipeline locally (requires Docker)
docker run -v $(pwd):/workspace -w /workspace oven/bun:1.3.3 bun install
docker run -v $(pwd):/workspace -w /workspace oven/bun:1.3.3 bun biome ci .
```

## References

- [Drone CI Documentation](https://docs.drone.io/)
- [SonarCloud Documentation](https://docs.sonarcloud.io/)
- [Biome Documentation](https://biomejs.dev/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
