---
name: git-workflow
description: Branch naming, commit messages, and PR process for this project
---

# Git Workflow

Keep history clean and every change traceable: branch by type, commit in the imperative, gate the merge on green CI, and squash to a single readable commit on the way into `main`.

## Branch Naming

```
{type}/{short-kebab-description}
```

| Type | When |
|---|---|
| `feat` | New feature |
| `fix` | Bug fix |
| `chore` | Maintenance, dependency updates |
| `refactor` | Code restructure, no behavior change |
| `docs` | Documentation only |
| `test` | Tests only |
| `ci` | CI/CD pipeline changes |

**Examples:**
```
feat/stripe-subscription-cancel
fix/auth-redirect-loop
chore/update-prisma-6
refactor/dashboard-extract-chart
docs/feature-architecture
test/subscription-action-coverage
ci/add-sonarcloud-step
```

## Commit Messages (commitlint)

Format: `type(scope): description in imperative mood`

```
feat(auth): add Google OAuth sign-in
fix(stripe): handle webhook signature verification failure
chore(deps): update Prisma to 6.x
test(actions): add cancelSubscription action tests
refactor(dashboard): extract ChartAreaInteractive to component
docs(ci): update Drone pipeline configuration
ci(github): add SonarCloud quality gate step
```

**Valid scopes:** `auth`, `stripe`, `dashboard`, `i18n`, `email`, `db`, `api`, `ci`, `deps`, `middleware`

## PR Process

```
1. Branch from main
2. Implement with tests (TDD — see rules/testing.md)
3. Run pre-push checks (see below)
4. Open PR with description + issue link
5. Address review comments (see skills/address-pr-comment.md)
6. Squash merge after approval
```

## Pre-Push Checklist

```bash
bun run lint            # Biome — lint + format check
bun tsc                 # TypeScript strict check
bun run test            # Vitest — all tests
bun run locale-check    # Validate i18n key parity
bun run locale-unused   # Detect orphan i18n keys
```

All checks must pass before pushing — CI runs the same gates and will block the merge otherwise.

## Common Commands

```bash
# Start feature
git checkout main && git pull origin main
git checkout -b feat/my-feature

# Stage interactively (never `git add .`)
git add -p

# Commit
git commit -m "feat(auth): add email verification flow"

# Sync with main (prefer rebase over merge)
git fetch origin
git rebase origin/main

# Push
git push origin feat/my-feature

# Amend last commit (before push only)
git commit --amend --no-edit
```

## Merge Strategy

| Branch type | Strategy |
|---|---|
| Feature → main | Squash merge (clean linear history) |
| Release → main | Merge commit |
| Hotfix → main | Squash merge |

- **Never force-push to `main`**
- **Never merge without passing CI**
