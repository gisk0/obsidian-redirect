#!/usr/bin/env bash
# scripts/build.sh — Bundle the worker for Terraform deployment
#
# Runs wrangler in dry-run mode to produce dist/index.js without deploying.
# Terraform then picks up the bundle via content_file = "../dist/index.js".
#
# Usage: ./scripts/build.sh

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

echo "Building worker bundle..."
bun run wrangler deploy --dry-run --outdir=dist 2>&1

if [[ ! -f dist/index.js ]]; then
  echo "Error: dist/index.js not found after build" >&2
  exit 1
fi

echo "✅ Built: dist/index.js ($(du -sh dist/index.js | cut -f1))"
