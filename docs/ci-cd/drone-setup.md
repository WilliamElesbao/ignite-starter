<!-- @format -->

# Drone CI Setup (Self-Hosted)

## Overview

This guide explains how to provision and configure a self-hosted Drone CI
instance for the repository pipeline defined in `.drone.yml`.

The pipeline is responsible for:

- Type checking
- Linting
- Running tests
- Build validation for backend, database, and web applications

## Prerequisites

Before starting, ensure you have:

- Docker and Docker Compose installed
- A GitHub account with repository admin access
- A server or local machine to host Drone
- A public URL (or tunnel) reachable by GitHub webhooks

> Localhost can be used for development if exposed through a tunnel.

---

# 1) Create GitHub OAuth App

Navigate to:

`GitHub → Settings → Developer settings → OAuth Apps`

Click **"New OAuth App"** and configure:

- **Application name:** `Drone CI - Self-Hosted`
- **Homepage URL:** `https://your-drone-url.com`
- **Authorization callback URL:** `https://your-drone-url.com/login`

For local development, you can temporarily use:

- `http://localhost:8080`
- `http://localhost:8080/login`

After creating the application:

1. Copy the **Client ID**
2. Generate and copy the **Client Secret**

You will use both values in the Drone server configuration.

---

# 2) Create Drone Docker Compose Configuration

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
      - DRONE_GITHUB_CLIENT_ID=<github-client-id>
      - DRONE_GITHUB_CLIENT_SECRET=<github-client-secret>
      - DRONE_RPC_SECRET=<random-secret>
      - DRONE_SERVER_HOST=<drone-host>
      - DRONE_SERVER_PROTO=https
      - DRONE_USER_CREATE=username:<github-username>,admin:true
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
      - DRONE_RPC_SECRET=<random-secret>
      - DRONE_RUNNER_CAPACITY=2
      - DRONE_RUNNER_NAME=docker-runner
    restart: unless-stopped

volumes:
  drone-data:
```

## Configuration Values

Replace the placeholders with real values:

| Placeholder              | Description                                       |
| ------------------------ | ------------------------------------------------- |
| `<github-client-id>`     | GitHub OAuth App Client ID                        |
| `<github-client-secret>` | GitHub OAuth App Client Secret                    |
| `<random-secret>`        | Shared RPC secret between Drone server and runner |
| `<drone-host>`           | Public Drone hostname                             |
| `<github-username>`      | GitHub username to grant Drone admin access       |

Generate a secure RPC secret:

```bash
openssl rand -hex 16
```

---

# 3) Expose Drone Server (Local Development)

If Drone is running locally, GitHub webhooks cannot reach `localhost`.

You must expose Drone using a public tunnel.

## Option: Cloudflare Tunnel

Install Cloudflare Tunnel:

```bash
brew install cloudflared
```

Start the tunnel:

```bash
cloudflared tunnel --url http://localhost:8080
```

Example generated URL:

```txt
https://example-name.trycloudflare.com
```

Update your Docker Compose configuration:

```yaml
- DRONE_SERVER_HOST=example-name.trycloudflare.com
- DRONE_SERVER_PROTO=https
```

Also update the GitHub OAuth callback URL to match the new public URL.

### Important

Cloudflare temporary URLs change whenever the tunnel restarts.

Whenever the URL changes:

1. Update `DRONE_SERVER_HOST`
2. Restart Drone services
3. Update GitHub OAuth callback URL
4. Re-activate the repository in Drone to recreate webhooks

Restart services:

```bash
docker compose -f drone-docker-compose.yml restart
```

---

# 4) Start Drone Services

Start the Drone server and runner:

```bash
docker compose -f drone-docker-compose.yml up -d
```

Verify containers are running:

```bash
docker ps
```

Expected containers:

- `drone-server`
- `drone-runner`

---

# 5) Activate Repository in Drone

1. Open the Drone UI
2. Login with GitHub
3. Click **"SYNC"** to refresh repositories
4. Locate the repository
5. Click **"ACTIVATE"**

Drone should automatically create the GitHub webhook.

---

# 6) Verify Webhook (Optional)

If Drone does not automatically create the webhook:

Navigate to:

`GitHub Repository → Settings → Webhooks`

Create a new webhook with:

| Setting      | Value                             |
| ------------ | --------------------------------- |
| Payload URL  | `https://your-drone-url.com/hook` |
| Content type | `application/json`                |
| Events       | Push + Pull Requests              |

Save the webhook.

---

# 7) Validate Pipeline Execution

Push a commit or open a pull request and verify the following stages execute
successfully in Drone:

- `install`
- `i18n-audit`
- `typecheck`
- `lint`
- `test-backend`
- `test-web`
- `build-database`
- `build-backend`
- `build-web`

Also confirm:

- The Drone dashboard shows build execution
- GitHub displays CI status checks correctly

---

# Troubleshooting

## No builds triggered

Possible causes:

- Webhook delivery failure
- Repository not activated in Drone
- Invalid webhook URL

Verify webhook deliveries:

`GitHub → Repository Settings → Webhooks → Recent Deliveries`

---

## Build fails immediately

Inspect runner logs:

```bash
docker logs drone-runner
```

Common issues:

- Docker socket permissions
- Invalid RPC secret
- Missing environment variables

---

## Build fails during install step

Verify:

- `bun.lock` is committed
- Dependencies install locally
- Build commands match repository structure

---

## OAuth login fails

Verify:

- OAuth callback URL
- `DRONE_SERVER_HOST`
- `DRONE_SERVER_PROTO`

All values must match the public Drone URL exactly.

---

## Cannot access Drone UI

Verify:

- Containers are running
- Port `8080` is exposed
- Tunnel is active (if using local setup)

Test locally:

```bash
curl http://localhost:8080
```

Inspect server logs:

```bash
docker logs drone-server
```
