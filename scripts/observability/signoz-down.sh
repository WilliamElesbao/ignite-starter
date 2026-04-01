#!/usr/bin/env zsh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
DEPLOY_DIR="$ROOT_DIR/.observability/signoz/deploy/docker"

if [[ ! -d "$DEPLOY_DIR" ]]; then
  echo "[info] SigNoz deploy folder not found. Nothing to stop."
  exit 0
fi

cd "$DEPLOY_DIR"
docker compose down

echo "[ok] SigNoz stack stopped"
