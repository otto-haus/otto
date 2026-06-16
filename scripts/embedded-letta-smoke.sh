#!/usr/bin/env bash
# 076 / #672 / #678 — embedded Letta release-gate smoke.
# Verifies a packaged otto.app ships a resolvable bundled letta.js (embedded "This Mac" mode),
# carries the Letta Code LICENSE (Apache-2.0 §4 attribution), and contains no blocking copyleft
# license in its shipped dependency tree (#671 guard). Does not launch Electron or mutate live
# /Applications/otto.app.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEFAULT_STAGING="/Applications/otto-staging.app"
DEFAULT_BUILT="$ROOT/apps/desktop/dist-app/mac-arm64/otto.app"

APP="${OTTO_EMBEDDED_APP:-}"
if [[ -z "$APP" ]]; then
  if [[ -d "$DEFAULT_STAGING" ]]; then
    APP="$DEFAULT_STAGING"
  elif [[ -d "$DEFAULT_BUILT" ]]; then
    APP="$DEFAULT_BUILT"
  else
    echo "error: no packaged otto.app — set OTTO_EMBEDDED_APP or run:" >&2
    echo "  bun run --cwd apps/desktop app:dir" >&2
    echo "  bash apps/desktop/scripts/deploy-staging.sh" >&2
    exit 1
  fi
fi

RESOURCES="$APP/Contents/Resources"
APP_NM="$RESOURCES/app/node_modules"
BUNDLED="$APP_NM/@letta-ai/letta-code/letta.js"
LICENSE="$APP_NM/@letta-ai/letta-code/LICENSE"
DESKTOP_CLI="/Applications/Letta.app/Contents/Resources/app.asar.unpacked/node_modules/@letta-ai/letta-code/letta.js"

echo "embedded-letta-smoke"
echo "  app=$APP"
echo "  resources=$RESOURCES"

if [[ ! -f "$BUNDLED" ]]; then
  echo "FAIL: bundled letta.js missing at expected path:" >&2
  echo "  $BUNDLED" >&2
  echo "Add @letta-ai/letta-code to apps/desktop dependencies and rebuild (asar:false → app/node_modules)." >&2
  exit 1
fi

echo "  bundled_letta=$BUNDLED (exists)"

# Apache-2.0 §4 attribution: the engine LICENSE must ship alongside letta.js (#671).
if [[ ! -f "$LICENSE" ]]; then
  echo "FAIL: Letta Code LICENSE missing from bundle (Apache-2.0 attribution required):" >&2
  echo "  $LICENSE" >&2
  exit 1
fi
echo "  bundled_license=$LICENSE (exists)"

# License gate guard (#671): no GPL/AGPL/SSPL in the shipped tree.
echo "  running license guard against shipped tree (#671)..."
node "$ROOT/scripts/gen-third-party-notices.mjs" --check --root "$APP_NM"

# resolveCli('embedded') must pick Resources path, never Letta.app first.
RESULT="$(cd "$ROOT" && OTTO_SMOKE_RESOURCES="$RESOURCES" OTTO_SMOKE_DESKTOP_CLI="$DESKTOP_CLI" bun -e "
  process.resourcesPath = process.env.OTTO_SMOKE_RESOURCES;
  delete process.env.LETTA_CLI_PATH;
  const fs = require('fs');
  const { resolveCli } = await import('./apps/desktop/electron/runtime-transport/runtime-common.ts');
  const embedded = resolveCli('embedded');
  const existing = resolveCli('existing');
  console.log(JSON.stringify({ embedded, existing, desktopCliExists: fs.existsSync(process.env.OTTO_SMOKE_DESKTOP_CLI) }));
")"

CLI_PATH="$(echo "$RESULT" | bun -e "const j=JSON.parse(await Bun.stdin.text()); console.log(j.embedded.cliPath);")"
CLI_RESOLVED="$(echo "$RESULT" | bun -e "const j=JSON.parse(await Bun.stdin.text()); console.log(j.embedded.cliResolved);")"
EXISTING_PATH="$(echo "$RESULT" | bun -e "const j=JSON.parse(await Bun.stdin.text()); console.log(j.existing.cliPath);")"

if [[ "$CLI_RESOLVED" != "true" ]]; then
  echo "FAIL: resolveCli('embedded').cliResolved !== true" >&2
  echo "$RESULT" >&2
  exit 1
fi

if [[ "$CLI_PATH" != "$BUNDLED" ]]; then
  echo "FAIL: embedded mode did not prefer bundled Resources path" >&2
  echo "  got:      $CLI_PATH" >&2
  echo "  expected: $BUNDLED" >&2
  exit 1
fi

# When Letta Desktop is installed, existing mode should prefer it over bundled.
if [[ -f "$DESKTOP_CLI" && "$EXISTING_PATH" != "$DESKTOP_CLI" ]]; then
  echo "WARN: Letta.app present but resolveCli('existing') did not pick desktop CLI" >&2
  echo "  got: $EXISTING_PATH" >&2
fi

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
RECEIPT_ROOT="${OTTO_RECEIPT_DIR:-$ROOT/receipts/otto-v01}"
RECEIPT="$RECEIPT_ROOT/embedded-letta-smoke-$STAMP.md"
mkdir -p "$RECEIPT_ROOT"
cat >"$RECEIPT" <<EOF
# Embedded Letta CLI smoke (076)

- **At:** $(date -u +%Y-%m-%dT%H:%M:%SZ)
- **App:** $APP
- **Bundled path:** $BUNDLED
- **resolveCli(embedded):** cliResolved=true, cliPath matches bundled
- **Command:** bash scripts/embedded-letta-smoke.sh

Honest scope: path resolution only — use \`otto-staging-076-bootstrap-proof.cjs\` for init + chat turn, or \`OTTO_BOOTSTRAP_PROOF=1\` to chain both.
EOF

JSON_RECEIPT="$RECEIPT_ROOT/embedded-letta-smoke-$STAMP.json"
cat >"$JSON_RECEIPT" <<EOF
{
  "at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "app": "$APP",
  "cliResolved": true,
  "cliPath": "$CLI_PATH",
  "bootstrapTurnCompleted": false,
  "fullBootstrapProof": "scripts/otto-staging-076-bootstrap-proof.cjs"
}
EOF

if [[ "${OTTO_BOOTSTRAP_PROOF:-}" == "1" ]]; then
  echo "  chaining bootstrap proof (076)..."
  if NODE_PATH="${NODE_PATH:-$HOME/.codex/admin/node_modules}" node "$ROOT/scripts/otto-staging-076-bootstrap-proof.cjs"; then
    BOOT_JSON="$(ls -t "$ROOT/docs/receipts/staging"/staging-076-bootstrap-proof-*.json 2>/dev/null | head -1)"
    if [[ -n "$BOOT_JSON" && -f "$BOOT_JSON" ]]; then
      BOOT_OK="$(bun -e "const j=JSON.parse(await Bun.file(process.argv[1]).text()); console.log(j.bootstrapTurnCompleted===true?'true':'false');" "$BOOT_JSON")"
      if [[ "$BOOT_OK" == "true" ]]; then
        OTTO_JSON_RECEIPT="$JSON_RECEIPT" OTTO_BOOT_JSON="$BOOT_JSON" bun -e "
          const fs = require('fs');
          const sidecar = process.env.OTTO_JSON_RECEIPT;
          const boot = JSON.parse(fs.readFileSync(process.env.OTTO_BOOT_JSON, 'utf8'));
          const merged = {
            ...JSON.parse(fs.readFileSync(sidecar, 'utf8')),
            bootstrapTurnCompleted: true,
            bootstrapProofJson: process.env.OTTO_BOOT_JSON,
          };
          fs.writeFileSync(sidecar, JSON.stringify(merged, null, 2) + '\n');
        "
      fi
    fi
  else
    echo "WARN: bootstrap proof failed — sidecar keeps bootstrapTurnCompleted=false" >&2
  fi
fi

echo "PASS: resolveCli('embedded') → $CLI_PATH"
echo "Receipt: $RECEIPT"
echo "JSON: $JSON_RECEIPT"
