#!/usr/bin/env bash
# Capture Otto canon into local Cognee with provenance (043)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
KINDS=""
DRY_RUN=0
APPLY=0
SINCE=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --kinds) KINDS="$2"; shift 2 ;;
    --dry-run) DRY_RUN=1; shift ;;
    --apply) APPLY=1; shift ;;
    --since) SINCE="$2"; shift 2 ;;
    *) echo "Unknown arg: $1" >&2; exit 2 ;;
  esac
done

IFS=',' read -r -a KIND_ARR <<< "${KINDS:-receipt,precedent}"
CAPTURE_DIR="$ROOT/receipts/cognee/capture"
mkdir -p "$CAPTURE_DIR"

collect_paths() {
  local kind="$1"
  case "$kind" in
    receipt)
      find "$ROOT/receipts" -type f \( -name '*.md' -o -name '*.json' \) 2>/dev/null | grep -v '/cognee/' || true
      ;;
    precedent)
      find "$ROOT/standards/precedents" -type f -name '*.md' 2>/dev/null || true
      ;;
    standard)
      find "$ROOT/standards" -maxdepth 1 -type f -name '*.md' 2>/dev/null || true
      ;;
    ticket)
      find "$ROOT/planning/hq-tickets/_Done" -type f -name '*.md' 2>/dev/null || true
      ;;
    charter)
      find "$ROOT/charters" -type f -name '*.md' 2>/dev/null || true
      ;;
    *) ;;
  esac
}

PATHS=()
for kind in "${KIND_ARR[@]}"; do
  while IFS= read -r p; do
    [[ -z "$p" ]] && continue
    if [[ "$p" == *".env"* ]] || [[ "$p" == *"secrets"* ]]; then continue; fi
    PATHS+=("$p")
  done < <(collect_paths "$kind")
done

if [[ "$DRY_RUN" -eq 1 ]]; then
  for p in "${PATHS[@]}"; do
    echo "PATH $p"
  done
  echo "COUNT ${#PATHS[@]}"
  exit 0
fi

if [[ "$APPLY" -ne 1 ]]; then
  echo "Pass --apply to ingest (dry-run only)" >&2
  exit 1
fi

ID="capture-$(date -u +%Y%m%dT%H%M%SZ)"
RECEIPT="$CAPTURE_DIR/$ID.json"
DOC_COUNT=${#PATHS[@]}

# Stub ingest — real cognee remember/cognify when CLI available
COGNEE_CLI=""
if command -v cognee-cli >/dev/null 2>&1; then
  COGNEE_CLI="$(command -v cognee-cli)"
elif command -v cognee >/dev/null 2>&1; then
  COGNEE_CLI="$(command -v cognee)"
elif [[ -x "$HOME/.otto/cognee/venv/bin/cognee-cli" ]]; then
  COGNEE_CLI="$HOME/.otto/cognee/venv/bin/cognee-cli"
fi

INGEST_MODE="stub"
if [[ -n "$COGNEE_CLI" ]]; then
  INGEST_MODE="cli"
  for p in "${PATHS[@]:0:50}"; do
    "$COGNEE_CLI" add "$p" 2>/dev/null || true
  done
  "$COGNEE_CLI" cognify 2>/dev/null || true
fi

cat >"$RECEIPT" <<EOF
{
  "id": "$ID",
  "capturedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "sourceKind": "manual",
  "paths": $(printf '%s\n' "${PATHS[@]:0:50}" | jq -R . | jq -s .),
  "docCount": $DOC_COUNT,
  "entityCount": null,
  "provenance": {
    "kinds": "$KINDS",
    "since": "$SINCE",
    "git_commit": "$(git -C "$ROOT" rev-parse --short HEAD 2>/dev/null || echo unknown)",
    "ingestMode": "$INGEST_MODE"
  }
}
EOF

echo "Wrote $RECEIPT ($DOC_COUNT paths)"
