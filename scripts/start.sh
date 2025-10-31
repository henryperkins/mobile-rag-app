#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$ROOT_DIR"

if [ ! -d node_modules ]; then
  echo "Installing dependencies (node_modules missing)…"
  npm install
fi

echo "Starting Expo development server…"
npm run start -- "$@"
