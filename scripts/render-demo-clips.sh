#!/usr/bin/env bash
# Remotion demo render stub (064) — no live daemon required
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEMO="$ROOT/demo"
OUT="$DEMO/out"
RECEIPT_DIR="$ROOT/receipts/otto-v01"

usage() {
  cat <<'EOF'
Usage: scripts/render-demo-clips.sh [composition]

Renders Remotion clips to demo/out/ (gitignored). Placeholder receipt path:
  receipts/otto-v01/<feature>.md

Compositions (default: desktop walkthrough):
  OttoV01DesktopWalkthrough   staging UI walkthrough (064)
  OttoV01Curation             curation inbox demo (064)
  OttoV01Tickets              tickets / Ticketcraft demo (064)
  OttoV01Charter              charter demo
  OttoV01Practices            practices demo
  all                         render-all.sh (v0.1 demos + walkthrough)

Examples:
  bash scripts/render-demo-clips.sh
  bash scripts/render-demo-clips.sh OttoV01DesktopWalkthrough
  bash scripts/render-demo-clips.sh all
EOF
}

COMP="${1:-OttoV01DesktopWalkthrough}"

mkdir -p "$OUT" "$RECEIPT_DIR"

if [[ ! -d "$DEMO/node_modules" ]]; then
  echo "Installing demo dependencies…" >&2
  (cd "$DEMO" && bun install)
fi

case "$COMP" in
  all)
    (cd "$DEMO" && bash render-all.sh)
    ;;
  OttoV01DesktopWalkthrough)
    (cd "$DEMO" && bunx remotion render src/index.ts OttoV01DesktopWalkthrough "$OUT/otto-v01-desktop-walkthrough.mp4")
    ;;
  OttoV01Curation)
    (cd "$DEMO" && bunx remotion render src/index.ts OttoV01Curation "$OUT/otto-v01-curation.mp4")
    ;;
  OttoV01Tickets)
    (cd "$DEMO" && bunx remotion render src/index.ts OttoV01Tickets "$OUT/otto-v01-tickets.mp4")
    ;;
  OttoV01Charter)
    (cd "$DEMO" && bunx remotion render src/index.ts OttoV01Charter "$OUT/otto-v01-charter.mp4")
    ;;
  OttoV01Practices)
    (cd "$DEMO" && bunx remotion render src/index.ts OttoV01Practices "$OUT/otto-v01-practices.mp4")
    ;;
  -h|--help)
    usage
    exit 0
    ;;
  *)
    echo "Unknown composition: $COMP" >&2
    usage
    exit 2
    ;;
esac

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
RECEIPT="$RECEIPT_DIR/demo-render-$STAMP.md"
cat >"$RECEIPT" <<EOF
# Demo render receipt

- **At:** $(date -u +%Y-%m-%dT%H:%M:%SZ)
- **Composition:** $COMP
- **Output dir:** demo/out/
- **Command:** bash scripts/render-demo-clips.sh $COMP

Honest scope: faithful re-enactments — not live screen capture. Tried/Approved pending Sebastian.
EOF

echo "Wrote placeholder receipt: $RECEIPT"
echo "Outputs: $OUT/"
