#!/usr/bin/env bash
# Capture Otto canon into local Cognee with provenance (043)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
exec bun "$ROOT/scripts/cognee-capture-run.ts" "$@"
