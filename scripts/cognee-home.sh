#!/usr/bin/env bash
# Cognee local sidecar — start/stop/health (041)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PID_FILE="${OTTO_COGNEE_PID_FILE:-$HOME/.otto/cognee/cognee.pid}"
LOG_DIR="${OTTO_COGNEE_LOG_DIR:-$ROOT/receipts/cognee}"
BASE_URL="${OTTO_COGNEE_BASE_URL:-http://127.0.0.1:8000}"
ENABLED="${OTTO_COGNEE_ENABLED:-0}"

mkdir -p "$(dirname "$PID_FILE")" "$LOG_DIR"

json() {
  printf '%s\n' "$1"
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
      exit 0
    fi
    if ! command -v cognee >/dev/null 2>&1; then
      echo "cognee CLI not installed — pip install cognee (see docs/cognee.md)" >&2
      exit 1
    fi
    nohup cognee api --host 127.0.0.1 --port "${OTTO_COGNEE_PORT:-8000}" >>"$LOG_DIR/cognee.log" 2>&1 &
    echo $! >"$PID_FILE"
    sleep 1
    health_probe
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
