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

for f in index.html pricing.html style.css brand/otto-pfp.png og.png; do
  [[ -f "$SITE/$f" ]] || { echo "missing $SITE/$f" >&2; exit 1; }
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
FAVICON_HEADERS="$(curl -sI "$BASE/brand/otto-pfp.png")"
OG_HEADERS="$(curl -sI "$BASE/og.png")"
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

check_body "index" "$INDEX_BODY" "Capability is solved. Conduct isn't." "The human ratifies" "Culture is a test suite." "Built to be installed by an agent"
check_body "pricing" "$PRICING_BODY" "Managed private pilot" "Letta" "Request pilot"

META_OK="false"
if grep -qi 'viewport' <<<"$INDEX_BODY" && grep -qi 'charset' <<<"$INDEX_BODY"; then
  META_OK="true"
fi

FAVICON_OK="false"
if grep -q 'brand/otto-pfp.png' <<<"$INDEX_BODY" && grep -qi '^HTTP/.* 200' <<<"$FAVICON_HEADERS"; then
  FAVICON_OK="true"
fi

OG_OK="false"
if grep -q 'https://otto.haus/og.png' <<<"$INDEX_BODY" && grep -qi '^HTTP/.* 200' <<<"$OG_HEADERS"; then
  OG_OK="true"
fi

FORBIDDEN_OK="true"
for bad in "autonomous SaaS" "sign up" "free trial workspace"; do
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
- **URL:** $BASE/ (local preview of the \`otto.haus\` static site)
- **Command:** bash site/deploy-staging.sh

## curl checks

- \`GET /\` → $(echo "$INDEX_HEADERS" | head -1 | tr -d '\r')
- \`GET /pricing.html\` → $(echo "$PRICING_HEADERS" | head -1 | tr -d '\r')
- \`GET /brand/otto-pfp.png\` → $(echo "$FAVICON_HEADERS" | head -1 | tr -d '\r')
- \`GET /og.png\` → $(echo "$OG_HEADERS" | head -1 | tr -d '\r')
- index hero + thesis + boundary copy: present
- pricing pilot copy: present
- pricing forbidden phrases: $FORBIDDEN_OK
- viewport + charset meta: $META_OK
- favicon link + asset: $FAVICON_OK
- og image meta + asset: $OG_OK

## Lighthouse

- $LH_NOTE

## Cloudflare Pages production deploy

1. Project root: \`site/\` — no build command
2. Production project: \`otto-haus\`
3. Custom domain: \`otto.haus\`

Honest status: **local preview verified** — live apex still requires Cloudflare deployment + redirect-rule proof.
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
