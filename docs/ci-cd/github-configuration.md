# GitHub Configuration

## Overview

This guide covers GitHub-specific configuration including secrets, branch protection rules, and workflow setup.

## GitHub Secrets

### Required Secrets

| Secret Name | Description | Where to Get |
|-------------|-------------|--------------|
| `SONAR_TOKEN` | SonarCloud authentication token | [SonarCloud Setup](./sonarcloud-setup.md) |

### Adding Secrets

1. Navigate to your repository on GitHub
2. Go to **Settings → Secrets and variables → Actions**
3. Click **"New repository secret"**
4. Enter the secret name and value
5. Click **"Add secret"**

**Note:** `GITHUB_TOKEN` is automatically provided by GitHub Actions and doesn't need manual configuration.

## Branch Protection Rules

Branch protection ensures code quality by requiring all checks to pass before merging.

### Step 1: Create Protection Rule

1. Navigate to **Settings → Branches**
2. Under **"Branch protection rules"**, click **"Add rule"**
3. **Branch name pattern:** `main`

### Step 2: Configure Required Checks

Enable the following options:

#### Require status checks to pass before merging

- ✅ Check this box
- Click **"Add checks"** and select:
  - `CI` (Drone CI pipeline)
  - `SonarCloud` (SonarCloud analysis)
  - `Biome Lint (inline PR comments)` (PR review workflow)
- ✅ **Require branches to be up to date before merging**

#### Require a pull request before merging

- ✅ **Require approvals:** Set to `1` (minimum)
- ✅ **Dismiss stale pull request approvals when new commits are pushed**

#### Require conversation resolution before merging

- ✅ Ensures all PR comments are resolved

#### Do not allow bypassing the above settings

- ✅ Enforces rules for all users including administrators

### Step 3: Save Protection Rule

Click **"Create"** or **"Save changes"** at the bottom of the page.

## GitHub Workflows

The repository includes two GitHub Actions workflows:

### 1. SonarCloud Analysis (.github/workflows/sonar.yml)

**Purpose:** Code quality and security analysis

**Triggers:**
- Push to any branch
- Pull request events

**Requirements:**
- `SONAR_TOKEN` secret must be configured
- `sonar-project.properties` must exist in repository root

### 2. PR Review (.github/workflows/pr-review.yml)

**Purpose:** Inline code quality feedback on pull requests

**Triggers:**
- Pull request opened
- Pull request synchronized (new commits)
- Pull request reopened

**Features:**
- Adds inline annotations to PR diff
- Uses Biome's GitHub reporter
- No additional secrets required

## Webhook Configuration

### Drone CI Webhook

Automatically created when you activate the repository in Drone. If manual setup is needed:

1. Go to **Settings → Webhooks → Add webhook**
2. Configure:
   - **Payload URL:** `https://your-drone-url.com/hook`
   - **Content type:** `application/json`
   - **Events:** Select "Push" and "Pull requests"
3. Click **"Add webhook"**

## Verification Checklist

- [ ] `SONAR_TOKEN` secret added
- [ ] Branch protection rule created for `main`
- [ ] Required status checks configured (CI, SonarCloud, Biome Lint)
- [ ] Pull request approval requirement enabled
- [ ] Conversation resolution requirement enabled
- [ ] Drone CI webhook active (check Settings → Webhooks)
- [ ] GitHub Actions workflows enabled (check Actions tab)

## Troubleshooting

### Status checks not appearing

- Push a commit to trigger workflows
- Verify workflows are enabled in Actions tab
- Check workflow files for syntax errors

### Cannot merge despite passing checks

- Ensure all conversations are resolved
- Update branch with latest `main`
- Verify required approvals are met

### Webhook delivery failures

- Check webhook delivery logs in Settings → Webhooks
- Verify Drone server is accessible from GitHub
- Ensure webhook URL is correct
