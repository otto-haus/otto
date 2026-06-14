#!/usr/bin/env bash
# Apply 001_init.sql to local pgvector Postgres.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
URL="${OTTO_PGVECTOR_URL:-postgresql://otto:otto@127.0.0.1:5433/otto_recall}"
MIGRATION="$ROOT/migrations/001_init.sql"

if ! command -v psql >/dev/null 2>&1; then
  echo "psql not found — install Postgres client or run: cd $ROOT && docker compose up -d" >&2
  exit 1
fi

psql "$URL" -v ON_ERROR_STOP=1 -f "$MIGRATION"
echo "pgvector migration ok: $MIGRATION"
