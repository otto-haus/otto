#!/usr/bin/env bash
# Smoke-check otto.haus marketing domains (Pages production).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RECEIPT_DIR="${OTTO_RECEIPT_DIR:-$ROOT/docs/receipts/staging}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
RECEIPT="$RECEIPT_DIR/337-otto-haus-domains-${STAMP}.json"
mkdir -p "$RECEIPT_DIR"

check_url() {
  local label="$1"
  local url="$2"
  local headers body status ctype
  headers="$(curl -sSI -L --max-time 20 "$url" || true)"
  status="$(printf '%s\n' "$headers" | awk 'toupper($1) ~ /^HTTP/ { code=$2 } END { print code+0 }')"
  ctype="$(printf '%s\n' "$headers" | awk -F': ' 'tolower($1)=="content-type" { print $2; exit }' | tr -d '\r')"
  body="$(curl -sSL --max-time 20 "$url" || true)"
  if [[ "$status" -lt 200 || "$status" -ge 400 ]]; then
    echo "FAIL: $label $url → HTTP $status" >&2
    return 1
  fi
  if [[ "$ctype" != *"text/html"* ]]; then
    echo "FAIL: $label $url → unexpected content-type: $ctype" >&2
    return 1
  fi
  if ! grep -qi '<html' <<<"$body"; then
    echo "FAIL: $label $url → body is not HTML" >&2
    return 1
  fi
  echo "PASS: $label $url → HTTP $status $ctype"
}

fail=0
check_url apex "https://otto.haus/" || fail=1
check_url www "https://www.otto.haus/" || fail=1
check_url pages "https://otto-haus.pages.dev/" || fail=1

python3 - "$RECEIPT" "$fail" <<'PY'
import json, subprocess, sys
from datetime import datetime, timezone

receipt_path, fail = sys.argv[1], int(sys.argv[2])
urls = [
    "https://otto.haus/",
    "https://www.otto.haus/",
    "https://otto-haus.pages.dev/",
]
rows = []
for url in urls:
    proc = subprocess.run(
        ["curl", "-sSI", "-L", "--max-time", "20", url],
        capture_output=True,
        text=True,
    )
    status = 0
    for line in proc.stdout.splitlines():
        if line.upper().startswith("HTTP/"):
            status = int(line.split()[1])
    rows.append({"url": url, "status": status, "ok": 200 <= status < 400})

payload = {
    "issue": 337,
    "checked_at": datetime.now(timezone.utc).isoformat(),
    "pass": fail == 0,
    "urls": rows,
    "notes": [
        "Pages project otto-haus; custom domains otto.haus + www.otto.haus",
        "Production branch main; deploy via site/deploy-pages.sh",
    ],
}
with open(receipt_path, "w", encoding="utf-8") as fh:
    json.dump(payload, fh, indent=2)
    fh.write("\n")
print(f"receipt: {receipt_path}")
PY

if [[ "$fail" -ne 0 ]]; then
  exit 1
fi

echo "PASS: all marketing domains verified"
