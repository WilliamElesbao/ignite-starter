# SonarCloud Setup

## Overview

SonarCloud provides automated code quality and security analysis for your repository.

## Step 1: Create SonarCloud Account

1. Navigate to [sonarcloud.io](https://sonarcloud.io)
2. Click **"Log in"** → **"With GitHub"**
3. Authorize SonarCloud to access your GitHub account

## Step 2: Create Organization

1. Click **"+"** (top-right) → **"Analyze new project"**
2. Click **"Create an organization"**
3. Select your GitHub account or organization
4. Choose an organization key (e.g., `your-org-name`)
5. Select **"Free plan"** for public repositories
6. Click **"Create Organization"**

## Step 3: Import Repository

1. From the organization page, click **"Analyze new project"**
2. Select your repository from the list
3. Click **"Set Up"**
4. Choose **"With GitHub Actions"** as the analysis method
5. Note the generated project key (format: `org-name_repo-name`)

## Step 4: Generate SONAR_TOKEN

1. Click your profile icon (top-right) → **"My Account"**
2. Navigate to **"Security"** tab
3. Under **"Generate Tokens"**:
   - **Name:** `GitHub Actions - your-repo-name`
   - **Type:** `Global Analysis Token`
   - **Expires in:** `90 days` (recommended) or `No expiration`
4. Click **"Generate"**
5. **Copy the token immediately** (you won't see it again)

The token format is a 40-character hexadecimal string.

## Step 5: Configure sonar-project.properties

Create or update `sonar-project.properties` in your repository root:

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

Replace `your-org_your-repo` and `your-org` with your actual values from Step 3.

## Step 6: Add SONAR_TOKEN to GitHub

1. Navigate to your repository on GitHub
2. Go to **Settings → Secrets and variables → Actions**
3. Click **"New repository secret"**
4. Fill in:
   - **Name:** `SONAR_TOKEN`
   - **Secret:** Paste the token from Step 4
5. Click **"Add secret"**

## Step 7: Verify Configuration

1. Push a commit to trigger the workflow
2. Check GitHub Actions tab for the "SonarCloud Analysis" workflow
3. Verify the workflow completes successfully
4. Visit your SonarCloud dashboard to see the analysis results

## Understanding SonarCloud Metrics

- **Bugs:** Potential runtime errors
- **Vulnerabilities:** Security issues
- **Code Smells:** Maintainability issues
- **Coverage:** Test coverage percentage (if configured)
- **Duplications:** Duplicated code blocks

## Troubleshooting

### Workflow fails with "401 Unauthorized"

- Verify `SONAR_TOKEN` is correctly added to GitHub secrets
- Regenerate token in SonarCloud if expired
- Ensure token has correct permissions

### Analysis shows no data

- Verify `sonar-project.properties` paths are correct
- Check that source files exist in specified paths
- Review SonarCloud logs in GitHub Actions workflow

### Project key mismatch

- Ensure `sonar.projectKey` in `sonar-project.properties` matches the key in SonarCloud
- Check `sonar.organization` matches your organization key
