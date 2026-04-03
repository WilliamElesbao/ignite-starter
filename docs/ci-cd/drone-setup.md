# Drone CI Setup (Self-Hosted)

## Overview

Drone CI is a self-hosted continuous integration platform that executes the main pipeline for type checking, linting, and testing.

## Prerequisites

- Docker and Docker Compose installed
- GitHub account with repository access
- Server or local machine to host Drone (can use localhost for development)

## Step 1: Create GitHub OAuth App

1. Navigate to `GitHub → Settings → Developer settings → OAuth Apps`
2. Click **"New OAuth App"**
3. Fill in the details:
   - **Application name:** `Drone CI - Self-Hosted`
   - **Homepage URL:** `https://your-drone-url.com` (or `http://localhost:8080` for local)
   - **Authorization callback URL:** `https://your-drone-url.com/login`
4. Click **"Register application"**
5. Copy the **Client ID**
6. Click **"Generate a new client secret"** and copy the **Client Secret**

## Step 2: Create Drone Docker Compose Configuration

Create a file named `drone-docker-compose.yml`:

```yaml
version: "3.8"

services:
  drone-server:
    image: drone/drone:2
    container_name: drone-server
    ports:
      - "8080:80"
    volumes:
      - drone-data:/data
    environment:
      - DRONE_GITHUB_CLIENT_ID=your_github_client_id
      - DRONE_GITHUB_CLIENT_SECRET=your_github_client_secret
      - DRONE_RPC_SECRET=your_random_secret_here
      - DRONE_SERVER_HOST=your-drone-url.com
      - DRONE_SERVER_PROTO=https
      - DRONE_USER_CREATE=username:your_github_username,admin:true
    restart: unless-stopped

  drone-runner:
    image: drone/drone-runner-docker:1
    container_name: drone-runner
    depends_on:
      - drone-server
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      - DRONE_RPC_PROTO=http
      - DRONE_RPC_HOST=drone-server
      - DRONE_RPC_SECRET=your_random_secret_here
      - DRONE_RUNNER_CAPACITY=2
      - DRONE_RUNNER_NAME=docker-runner
    restart: unless-stopped

volumes:
  drone-data:
```

### Configuration Values

Replace the following placeholders:

- `your_github_client_id` - OAuth App Client ID from Step 1
- `your_github_client_secret` - OAuth App Client Secret from Step 1
- `your_random_secret_here` - Generate with: `openssl rand -hex 16`
- `your-drone-url.com` - Your public Drone URL
- `your_github_username` - Your GitHub username (will be admin)

## Step 3: Expose Drone Server (For Local Development)

If running locally, you need to expose the server to a public URL for GitHub webhooks.

### Using Cloudflare Tunnel

```bash
# Install cloudflared
brew install cloudflared

# Expose local Drone server
cloudflared tunnel --url http://localhost:8080
```

This will provide a public URL like `https://held-fax-councils-reid.trycloudflare.com`

Update your `drone-docker-compose.yml` with this URL:

```yaml
- DRONE_SERVER_HOST=held-fax-councils-reid.trycloudflare.com
- DRONE_SERVER_PROTO=https
```

Also update the GitHub OAuth App callback URL to match.

## Step 4: Start Drone Server

```bash
docker compose -f drone-docker-compose.yml up -d
```

Verify the services are running:

```bash
docker ps
```

You should see `drone-server` and `drone-runner` containers running.

## Step 5: Activate Repository

1. Navigate to your Drone URL (e.g., `https://your-drone-url.com`)
2. Log in with GitHub
3. Click **"SYNC"** to refresh repository list
4. Find your repository and click **"ACTIVATE"**
5. Drone will automatically create a webhook in your GitHub repository

## Step 6: Verify Webhook (Optional)

If the webhook wasn't created automatically:

1. Go to `GitHub repo → Settings → Webhooks`
2. Click **"Add webhook"**
3. Configure:
   - **Payload URL:** `https://your-drone-url.com/hook`
   - **Content type:** `application/json`
   - **Events:** Select "Push" and "Pull requests"
4. Click **"Add webhook"**

## Step 7: Test the Pipeline

Push a commit to your repository and verify:

1. Drone dashboard shows the build
2. GitHub shows the "CI" status check
3. Build completes successfully

## Troubleshooting

### Build doesn't start

- Check webhook delivery in GitHub: `Settings → Webhooks → Recent Deliveries`
- Verify repository is activated in Drone dashboard
- Check Drone server logs: `docker logs drone-server`

### Build fails at install step

- Ensure `bun.lock` is committed and up to date
- Check Drone runner logs: `docker logs drone-runner`

### Cannot access Drone UI

- Verify the server is running: `docker ps`
- Check if the port is accessible: `curl http://localhost:8080`
- For Cloudflare tunnel, ensure the tunnel is still running
