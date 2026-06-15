#!/usr/bin/env bash
# 065 / 115 — local marketing-site staging checks (no apex DNS required).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SITE="$ROOT/site"
PORT="${OTTO_SITE_PORT:-4321}"
BASE="http://127.0.0.1:${PORT}"
SERVE_PID=""
RECEIPT_DIR="$ROOT/docs/receipts/staging"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
RECEIPT="$RECEIPT_DIR/065-site-staging-$STAMP.md"

cleanup() {
  if [[ -n "$SERVE_PID" ]] && kill -0 "$SERVE_PID" 2>/dev/null; then
    kill "$SERVE_PID" 2>/dev/null || true
    wait "$SERVE_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

for f in index.html pricing.html style.css owl.png og.png CNAME robots.txt sitemap.xml; do
  [[ -e "$SITE/$f" ]] || { echo "missing $SITE/$f" >&2; exit 1; }
done

mkdir -p "$RECEIPT_DIR"

cd "$ROOT"
bunx --bun serve "$SITE" -l "$PORT" >/dev/null 2>&1 &
SERVE_PID=$!

for _ in {1..30}; do
  if curl -sf -o /dev/null "$BASE/"; then break; fi
  sleep 0.2
done

curl -sf -o /dev/null "$BASE/" || { echo "serve failed on $BASE" >&2; exit 1; }

INDEX_HEADERS="$(curl -sI "$BASE/")"
PRICING_HEADERS="$(curl -sI "$BASE/pricing.html")"
INDEX_BODY="$(curl -sL "$BASE/")"
PRICING_BODY="$(curl -sL "$BASE/pricing.html")"

check_body() {
  local label="$1"
  local body="$2"
  shift 2
  for needle in "$@"; do
    if ! grep -q "$needle" <<<"$body"; then
      echo "FAIL: $label missing: $needle" >&2
      exit 1
    fi
  done
}

check_body "index" "$INDEX_BODY" "otto makes agent behavior compound" "docs.otto.haus" "Install with an agent" "#compound" "brand/otto-avatar.png"
check_body "pricing" "$PRICING_BODY" "Managed private pilot" "Letta" "Request pilot" "index.html#compound" "docs.otto.haus"

META_OK="false"
if grep -qi 'viewport' <<<"$INDEX_BODY" && grep -qi 'charset' <<<"$INDEX_BODY"; then
  META_OK="true"
fi

FORBIDDEN_OK="true"
for bad in "Start free trial" "Sign up now" "Create workspace"; do
  if grep -qi "$bad" <<<"$PRICING_BODY"; then
    FORBIDDEN_OK="false"
    echo "WARN: pricing contains forbidden phrase: $bad" >&2
  fi
done

LH_NOTE="not run"
if command -v npx >/dev/null 2>&1; then
  if npx --yes lighthouse "$BASE/" --only-categories=accessibility --quiet --chrome-flags='--headless' \
    --output=json --output-path=/tmp/otto-lh-065.json 2>/dev/null; then
    LH_NOTE="accessibility scan → /tmp/otto-lh-065.json"
  fi
fi

mkdir -p "$RECEIPT_DIR"
cat >"$RECEIPT" <<EOF
# Marketing site local staging (065 / 115)

- **At:** $(date -u +%Y-%m-%dT%H:%M:%SZ)
- **URL:** $BASE/ (local only — apex \`otto.haus\` / Cloudflare Pages pending Sebastian DNS)
- **Command:** bash site/deploy-staging.sh

## curl checks

- \`GET /\` → $(echo "$INDEX_HEADERS" | head -1 | tr -d '\r')
- \`GET /pricing.html\` → $(echo "$PRICING_HEADERS" | head -1 | tr -d '\r')
- index boundary copy: present
- pricing pilot copy: present
- pricing forbidden phrases: $FORBIDDEN_OK
- viewport + charset meta: $META_OK

## Lighthouse

- $LH_NOTE

## Cloudflare Pages (when DNS approved)

1. Project root: \`site/\` — no build command
2. Preview URL → verify mobile width
3. CNAME \`staging.otto.haus\` when Sebastian approves

Honest status: **local preview verified** — not live on apex.
EOF

echo "PASS: marketing site staging checks"
echo "  url=$BASE/"
echo "  receipt=$RECEIPT"

# Optional phone-width screenshots (065 rev10): OTTO_CAPTURE_SCREENSHOTS=1
if [[ "${OTTO_CAPTURE_SCREENSHOTS:-}" == "1" ]]; then
  WIDTH="${OTTO_CAPTURE_WIDTH:-390}"
  HEIGHT="${OTTO_CAPTURE_HEIGHT:-844}"
  echo "Capturing ${WIDTH}x${HEIGHT} screenshots…" >&2
  NODE_PATH="${NODE_PATH:-$HOME/.codex/admin/node_modules}" node "$ROOT/site/capture-screenshots.cjs" "$WIDTH" "$HEIGHT"
fi
