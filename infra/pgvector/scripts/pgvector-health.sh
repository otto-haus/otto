#!/usr/bin/env bash
# Exit 0 when local pgvector Postgres is up and the vector extension is present.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
URL="${OTTO_PGVECTOR_URL:-postgresql://otto:otto@127.0.0.1:5433/otto_recall}"

if ! command -v psql >/dev/null 2>&1; then
  echo "psql not found — install Postgres client or run: cd $ROOT && docker compose up -d" >&2
  exit 1
fi

psql "$URL" -v ON_ERROR_STOP=1 -c "SELECT 1" >/dev/null
if ! psql "$URL" -v ON_ERROR_STOP=1 -tAc "SELECT 1 FROM pg_extension WHERE extname = 'vector'" | grep -q 1; then
  "$ROOT/scripts/pgvector-migrate.sh"
fi
psql "$URL" -v ON_ERROR_STOP=1 -tAc "SELECT 1 FROM pg_extension WHERE extname = 'vector'" | grep -q 1 \
  || { echo "pgvector extension missing after migrate" >&2; exit 1; }

echo "pgvector health ok: $URL"
