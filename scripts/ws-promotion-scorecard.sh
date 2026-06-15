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
transport_unit_ok=0

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
    if [[ "$id" == "transport_unit" ]]; then transport_unit_ok=1; fi
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

# Promotion dimensions — unit-proven rows when transport tests pass; live rows stay pending
dim_status() {
  local key="$1"
  if [[ "$transport_unit_ok" -eq 1 ]]; then
    case "$key" in
      abort|reconnect|safety|fallback) echo pass ;;
      approval_roundtrip) echo partial ;;
      *) echo pending ;;
    esac
  else
    echo pending
  fi
}

dim_notes() {
  local key="$1"
  case "$key" in
    abort) echo "unit: ws-runtime-transport.test.ts abort_message" ;;
    reconnect) echo "unit: ws-runtime-transport.test.ts socket close → ready=false" ;;
    safety) echo "unit: smokeMode guard + ws-runtime-transport.test.ts" ;;
    fallback) echo "unit: runtime-supervisor.test.ts + ws-promotion-gate.test.ts" ;;
    approval_roundtrip) echo "unit: control_response only; live round-trip pending LETTA_API_KEY" ;;
    *) echo "live WS smoke pending LETTA_API_KEY" ;;
  esac
}

dimensions=(
  'init_ready:Init → ready'
  'send_first_token:Send → first token'
  'full_turn:Full disposable turn'
  'approval_roundtrip:Approval round-trip'
  'abort:Abort mid-turn'
  'reconnect:Reconnect / no false connected'
  'trace_receipt:Trace + receipt mappable'
  'safety:No conversation=default in smoke'
  'fallback:auto shows transportFallbackReason'
)

dim_json="["
first_dim=1
for row in "${dimensions[@]}"; do
  IFS=':' read -r key label <<< "$row"
  status="$(dim_status "$key")"
  notes="$(dim_notes "$key")"
  [[ $first_dim -eq 1 ]] || dim_json+=","
  first_dim=0
  dim_json+=$(printf '{"key":"%s","label":"%s","status":"%s","tracePath":null,"receiptPath":null,"latencyMs":null,"notes":%s}' "$key" "$label" "$status" "$(printf '%s' "$notes" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))')")
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
