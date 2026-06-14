#!/usr/bin/env bash
# 039 — WS promotion scorecard runner (disposable smoke checklist + JSON template).
# Staging-only runtime proof. Never touches /Applications/otto.app.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
OUT="${OTTO_SCORECARD_OUT:-$ROOT/docs/receipts/staging/039-scorecard-template.json}"
RUN_ID="$(date -u +%Y%m%dT%H%M%SZ)"
GIT_HEAD="$(git rev-parse --short HEAD 2>/dev/null || echo unknown)"

mkdir -p "$(dirname "$OUT")"

pass=0
fail=0
skip=0
checks=()

record() {
  local id="$1" ok="$2" detail="$3"
  if [[ "$ok" == "pass" ]]; then pass=$((pass + 1)); fi
  if [[ "$ok" == "fail" ]]; then fail=$((fail + 1)); fi
  if [[ "$ok" == "skip" ]]; then skip=$((skip + 1)); fi
  checks+=("{\"id\":\"$id\",\"result\":\"$ok\",\"detail\":$(printf '%s' "$detail" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))')}")
}

run_cmd() {
  local id="$1"
  shift
  if "$@" >/tmp/otto-scorecard-"$id".log 2>&1; then
    record "$id" pass "ok — see /tmp/otto-scorecard-${id}.log"
  else
    record "$id" fail "failed — see /tmp/otto-scorecard-${id}.log"
  fi
}

# Static / unit checklist (always safe)
run_cmd typecheck bun run --cwd apps/desktop typecheck
run_cmd electron_typecheck bun run --cwd apps/desktop electron:typecheck
run_cmd transport_unit bun test ./apps/desktop/electron/runtime-transport/*.test.ts
run_cmd verify_v0 bun run verify:v0

# Optional disposable CLI smokes (require LETTA_AGENT_ID + local Letta)
for mode in sdk ws auto; do
  if [[ -n "${LETTA_AGENT_ID:-}" ]] && command -v task >/dev/null 2>&1; then
    if OTTO_RUNTIME_TRANSPORT="$mode" OTTO_SMOKE=1 task smoke:cli >/tmp/otto-scorecard-smoke-"$mode".log 2>&1; then
      record "smoke_cli_${mode}" pass "OTTO_RUNTIME_TRANSPORT=$mode disposable CLI smoke"
    else
      record "smoke_cli_${mode}" fail "OTTO_RUNTIME_TRANSPORT=$mode — see /tmp/otto-scorecard-smoke-${mode}.log"
    fi
  else
    record "smoke_cli_${mode}" skip "Set LETTA_AGENT_ID and install task to run disposable CLI smoke"
  fi
done

# Optional staging CDP capture (staging app must be running)
if [[ "${OTTO_RUN_STAGING_CAPTURE:-0}" == "1" ]]; then
  if node scripts/otto-staging-proof-capture.cjs >/tmp/otto-scorecard-staging.log 2>&1; then
    record staging_capture pass "otto-staging-proof-capture.cjs"
  else
    record staging_capture fail "see /tmp/otto-scorecard-staging.log"
  fi
else
  record staging_capture skip "Set OTTO_RUN_STAGING_CAPTURE=1 after deploy-staging.sh"
fi

# Promotion dimensions — fill trace/receipt paths after WS smokes land
dimensions=(
  'init_ready:Init → ready:pending'
  'send_first_token:Send → first token:pending'
  'full_turn:Full disposable turn:pending'
  'approval_roundtrip:Approval round-trip:pending'
  'abort:Abort mid-turn:pending'
  'reconnect:Reconnect / no false connected:pending'
  'trace_receipt:Trace + receipt mappable:pending'
  'safety:No conversation=default in smoke:pending'
  'fallback:auto shows transportFallbackReason:pending'
)

dim_json="["
first_dim=1
for row in "${dimensions[@]}"; do
  IFS=':' read -r key label status <<< "$row"
  [[ $first_dim -eq 1 ]] || dim_json+=","
  first_dim=0
  dim_json+=$(printf '{"key":"%s","label":"%s","status":"%s","tracePath":null,"receiptPath":null,"latencyMs":null,"notes":null}' "$key" "$label" "$status")
done
dim_json+="]"

checks_json="[$(IFS=,; echo "${checks[*]}")]"

cat >"$OUT" <<EOF
{
  "schema": "otto.ws-promotion-scorecard.v1",
  "ticket": "039-cathedral-ws-runtime-transport",
  "runId": "$RUN_ID",
  "gitHead": "$GIT_HEAD",
  "defaultTransport": "sdk",
  "promotionGate": "WS default only after reviewer +1 on filled scorecard",
  "summary": {
    "checksPass": $pass,
    "checksFail": $fail,
    "checksSkip": $skip
  },
  "checks": $checks_json,
  "dimensions": $dim_json,
  "stagingOnly": true,
  "liveAppForbidden": "/Applications/otto.app",
  "stagingApp": "/Applications/otto-staging.app",
  "smokeLauncher": "/Users/seb/.codex/admin/otto-staging/launch-otto-staging-smoke.sh"
}
EOF

echo "Wrote $OUT (pass=$pass fail=$fail skip=$skip)"
[[ "$fail" -eq 0 ]] || exit 1
