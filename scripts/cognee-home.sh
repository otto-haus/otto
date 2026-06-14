#!/usr/bin/env bash
# Cognee local sidecar — start/stop/health (041)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PID_FILE="${OTTO_COGNEE_PID_FILE:-$HOME/.otto/cognee/cognee.pid}"
LOG_DIR="${OTTO_COGNEE_LOG_DIR:-$ROOT/receipts/cognee}"
VENV_DIR="${OTTO_COGNEE_VENV:-$HOME/.otto/cognee/venv}"
BASE_URL="${OTTO_COGNEE_BASE_URL:-http://127.0.0.1:8000}"
ENABLED="${OTTO_COGNEE_ENABLED:-0}"
PORT="${OTTO_COGNEE_PORT:-8000}"

mkdir -p "$(dirname "$PID_FILE")" "$LOG_DIR" "$HOME/.otto/cognee/databases"

json() {
  printf '%s\n' "$1"
}

resolve_cognee_cli() {
  if [[ -n "${OTTO_COGNEE_PYTHON:-}" && -x "${OTTO_COGNEE_PYTHON}" ]]; then
    echo "${OTTO_COGNEE_PYTHON}"
    return 0
  fi
  if [[ -x "$VENV_DIR/bin/cognee-cli" ]]; then
    echo "$VENV_DIR/bin/cognee-cli"
    return 0
  fi
  if command -v cognee-cli >/dev/null 2>&1; then
    command -v cognee-cli
    return 0
  fi
  if command -v cognee >/dev/null 2>&1; then
    command -v cognee
    return 0
  fi
  return 1
}

resolve_python() {
  if [[ -n "${OTTO_COGNEE_PYTHON:-}" && -x "${OTTO_COGNEE_PYTHON}" ]]; then
    echo "${OTTO_COGNEE_PYTHON}"
    return 0
  fi
  if [[ -x "$VENV_DIR/bin/python" ]]; then
    echo "$VENV_DIR/bin/python"
    return 0
  fi
  if command -v python3 >/dev/null 2>&1; then
    command -v python3
    return 0
  fi
  return 1
}

health_probe() {
  if [[ "$ENABLED" != "1" && "$ENABLED" != "true" ]]; then
    json '{"ok":false,"status":"disabled","baseUrl":null,"error":"OTTO_COGNEE_ENABLED is off"}'
    return 0
  fi
  if ! command -v curl >/dev/null 2>&1; then
    json "{\"ok\":false,\"status\":\"error\",\"baseUrl\":\"$BASE_URL\",\"error\":\"curl required for health probe\"}"
    return 1
  fi
  if curl -fsS --max-time 2 "$BASE_URL/health" >/dev/null 2>&1 || curl -fsS --max-time 2 "$BASE_URL/" >/dev/null 2>&1; then
    json "{\"ok\":true,\"status\":\"ready\",\"baseUrl\":\"$BASE_URL\"}"
    return 0
  fi
  json "{\"ok\":false,\"status\":\"stopped\",\"baseUrl\":\"$BASE_URL\",\"error\":\"Cognee not reachable on loopback\"}"
  return 1
}

write_smoke_receipt() {
  local health_json="$1"
  local receipt_dir="$ROOT/receipts/cognee"
  mkdir -p "$receipt_dir"
  local id="otto-041-local-home-smoke-$(date -u +%Y%m%dT%H%M%SZ)"
  local path="$receipt_dir/$id.json"
  cat >"$path" <<EOF
{
  "id": "$id",
  "ticket": "041-cognee-local-home",
  "at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "health": $health_json,
  "script": "scripts/cognee-home.sh"
}
EOF
  echo "Wrote $path"
}

start_daemon() {
  local python_bin
  python_bin="$(resolve_python || true)"
  if [[ -n "$python_bin" ]]; then
    nohup "$python_bin" -m uvicorn cognee.api.client:app \
      --host 127.0.0.1 --port "$PORT" >>"$LOG_DIR/cognee-api.log" 2>&1 &
    echo $! >"$PID_FILE"
    sleep 2
    return 0
  fi
  local cli
  if cli="$(resolve_cognee_cli)"; then
    nohup "$cli" api --host 127.0.0.1 --port "$PORT" >>"$LOG_DIR/cognee-api.log" 2>&1 &
    echo $! >"$PID_FILE"
    sleep 2
    return 0
  fi
  echo "Cognee not installed — pip install cognee into ~/.otto/cognee/venv (see docs/cognee.md)" >&2
  return 1
}

cmd="${1:-status}"
case "$cmd" in
  health)
    health_probe
    ;;
  status)
    health_probe >/dev/null && exit 0 || exit 1
    ;;
  start)
    if [[ "$ENABLED" != "1" && "$ENABLED" != "true" ]]; then
      echo "Cognee disabled (set OTTO_COGNEE_ENABLED=1)" >&2
      exit 1
    fi
    if health_probe | grep -q '"ok":true'; then
      echo "Cognee already ready at $BASE_URL"
      health_probe
      exit 0
    fi
    start_daemon
    sleep 1
    result="$(health_probe)"
    echo "$result"
    if echo "$result" | grep -q '"ok":true'; then
      write_smoke_receipt "$result"
    fi
    ;;
  stop)
    if [[ -f "$PID_FILE" ]]; then
      kill "$(cat "$PID_FILE")" 2>/dev/null || true
      rm -f "$PID_FILE"
    fi
    json "{\"ok\":true,\"status\":\"stopped\",\"baseUrl\":\"$BASE_URL\"}"
    ;;
  *)
    echo "Usage: $0 {start|stop|status|health}" >&2
    exit 2
    ;;
esac
