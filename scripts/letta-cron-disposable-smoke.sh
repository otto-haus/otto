#!/usr/bin/env bash
# Disposable Letta cron / reminder scheduling smoke (#296).
# Creates a one-shot scheduled task on a disposable conversation, lists it,
# verifies prompt/agent/conversation binding, then deletes it.
# Never uses conversation=default or official app bundles.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEFAULT_LETTA_CLI="/Applications/Letta.app/Contents/Resources/app.asar.unpacked/node_modules/@letta-ai/letta-code/letta.js"
RECEIPT_DIR="${OTTO_RECEIPT_DIR:-$ROOT/docs/receipts/staging}"
RUN_ID="$(date -u +%Y%m%d%H%M%S)"

fail() {
  local capability="$1"
  local next="$2"
  printf 'FAIL: %s\n' "$capability" >&2
  printf 'Next: %s\n' "$next" >&2
  exit 1
}

AGENT_ID="${OTTO_AGENT_ID:-${LETTA_AGENT_ID:-}}"
if [[ -z "$AGENT_ID" ]]; then
  printf '%s\n' 'SKIP letta-cron-disposable-smoke: OTTO_AGENT_ID or LETTA_AGENT_ID is not set.'
  printf '%s\n' 'Run OTTO_AGENT_ID=<agent-id> task smoke:cron after you have a real local Letta agent.'
  exit 0
fi

CLI_PATH="${LETTA_CLI_PATH:-$DEFAULT_LETTA_CLI}"
if [[ ! -f "$CLI_PATH" ]]; then
  fail \
    'Letta CLI path resolution' \
    "Install or repair Letta Desktop / Letta Code, or set LETTA_CLI_PATH=/path/to/letta.js. Missing: $CLI_PATH"
fi

cron_cli() {
  node "$CLI_PATH" cron "$@"
}

STAMP="$(date +%s)"
CONVERSATION_ID="otto-cron-smoke-${STAMP}"
TASK_NAME="otto-cron-smoke-${STAMP}"
PROMPT_MARKER="OTTO_CRON_SMOKE_${STAMP}"
TASK_ID=""

cleanup() {
  if [[ -n "$TASK_ID" ]]; then
    cron_cli delete "$TASK_ID" >/dev/null 2>&1 || true
  fi
}

trap cleanup EXIT

mkdir -p "$RECEIPT_DIR"

ADD_JSON="$(cron_cli add \
  --agent "$AGENT_ID" \
  --conversation "$CONVERSATION_ID" \
  --name "$TASK_NAME" \
  --description "otto disposable cron smoke" \
  --prompt "$PROMPT_MARKER" \
  --at "in 45m" \
  --once)" || fail \
  'letta cron add (reminder create)' \
  'Confirm Letta is running and cron add accepts --name, --description, --conversation, --at in 45m --once.'

TASK_ID="$(printf '%s' "$ADD_JSON" | bun -e "
  const j = JSON.parse(await Bun.stdin.text());
  const id = j.id ?? j.task_id ?? '';
  if (!id) throw new Error('cron add JSON missing id');
  console.log(id);
")" || fail \
  'letta cron add response parse' \
  'Inspect raw cron add JSON; Letta CLI may have changed output shape.'

LIST_JSON="$(cron_cli list --agent "$AGENT_ID" --conversation "$CONVERSATION_ID")" || fail \
  'letta cron list' \
  'Verify Letta cron list works for the disposable conversation filter.'

FOUND="$(printf '%s' "$LIST_JSON" | bun -e "
  const marker = ${PROMPT_MARKER@Q};
  const agentId = ${AGENT_ID@Q};
  const convId = ${CONVERSATION_ID@Q};
  const taskId = ${TASK_ID@Q};
  const rows = JSON.parse(await Bun.stdin.text());
  const match = rows.find((row) => row.id === taskId);
  if (!match) {
    console.error('task not found in list');
    process.exit(1);
  }
  if (match.prompt !== marker) {
    console.error('prompt mismatch');
    process.exit(1);
  }
  if (match.agent_id !== agentId) {
    console.error('agent_id mismatch');
    process.exit(1);
  }
  if (match.conversation_id !== convId) {
    console.error('conversation_id mismatch');
    process.exit(1);
  }
  console.log('ok');
")" || fail \
  'letta cron list binding verification (prompt/agent/conversation)' \
  'Cron task was created but list/get did not echo the expected prompt and bindings.'

GET_JSON="$(cron_cli get "$TASK_ID")" || fail \
  'letta cron get' \
  'Verify letta cron get works for the created task id.'

printf '%s' "$GET_JSON" | bun -e "
  const marker = ${PROMPT_MARKER@Q};
  const agentId = ${AGENT_ID@Q};
  const convId = ${CONVERSATION_ID@Q};
  const taskId = ${TASK_ID@Q};
  const row = JSON.parse(await Bun.stdin.text());
  if (row.id !== taskId || row.prompt !== marker || row.agent_id !== agentId || row.conversation_id !== convId) {
    console.error('get binding mismatch');
    process.exit(1);
  }
" || fail \
  'letta cron get binding verification' \
  'Cron get did not return the expected prompt/agent/conversation for the created task.'

DELETE_JSON="$(cron_cli delete "$TASK_ID")" || fail \
  'letta cron delete' \
  'Verify letta cron delete works for the disposable task id.'

DELETED_TASK_ID="$TASK_ID"
TASK_ID=""
trap - EXIT

AFTER_JSON="$(cron_cli list --agent "$AGENT_ID" --conversation "$CONVERSATION_ID")" || fail \
  'letta cron list after delete' \
  'Verify cron list still works after delete.'

printf '%s' "$AFTER_JSON" | bun -e "
  const taskId = ${DELETED_TASK_ID@Q};
  const rows = JSON.parse(await Bun.stdin.text());
  if (rows.some((row) => row.id === taskId)) {
    console.error('task still listed after delete');
    process.exit(1);
  }
" || fail \
  'letta cron delete cleanup' \
  'Cron task still appears in list after delete; inspect Letta cron store manually.'

RECEIPT_PATH="$RECEIPT_DIR/letta-cron-smoke-${RUN_ID}.json"
cat >"$RECEIPT_PATH" <<EOF
{
  "schema": "otto.letta-cron-disposable-smoke.v1",
  "runId": "${RUN_ID}",
  "ok": true,
  "agentId": "${AGENT_ID}",
  "conversationId": "${CONVERSATION_ID}",
  "taskName": "${TASK_NAME}",
  "promptMarker": "${PROMPT_MARKER}",
  "deletedTaskId": "${DELETED_TASK_ID}",
  "receiptDir": "${RECEIPT_DIR}",
  "command": "OTTO_AGENT_ID=<agent-id> task smoke:cron"
}
EOF

printf '%s\n' "PASS: letta cron create → list → get → delete on disposable conversation ${CONVERSATION_ID}"
printf '%s\n' "Receipt: $RECEIPT_PATH"
