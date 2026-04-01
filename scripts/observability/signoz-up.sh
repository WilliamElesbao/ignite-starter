#!/usr/bin/env zsh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
SIGNOZ_DIR="$ROOT_DIR/.observability/signoz"
DEPLOY_DIR="$SIGNOZ_DIR/deploy/docker"

if ! command -v git >/dev/null 2>&1; then
  echo "[error] git is required to clone SigNoz"
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "[error] docker is required"
  exit 1
fi

if [[ ! -d "$SIGNOZ_DIR/.git" ]]; then
  mkdir -p "$ROOT_DIR/.observability"
  git clone -b main https://github.com/SigNoz/signoz.git "$SIGNOZ_DIR"
fi

cd "$DEPLOY_DIR"
docker compose up -d --remove-orphans

echo "[ok] SigNoz is running at http://localhost:8080"
echo "[info] OTLP gRPC: localhost:4317 | OTLP HTTP: localhost:4318"
