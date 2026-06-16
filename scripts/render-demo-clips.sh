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
  OttoV01Channels             channels contract demo (#512)
  OttoV01FieldNote            field-note practice capture (#512)
  OttoProductDemo             OpenAI-inspired product hero (~54s)
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
  OttoV01Channels)
    (cd "$DEMO" && bunx remotion render src/index.ts OttoV01Channels "$OUT/otto-v01-channels.mp4")
    ;;
  OttoV01FieldNote)
    (cd "$DEMO" && bunx remotion render src/index.ts OttoV01FieldNote "$OUT/otto-v01-field-note.mp4")
    ;;
  OttoProductDemo)
    (cd "$DEMO" && bunx remotion render src/index.ts OttoProductDemo "$OUT/otto-product-demo.mp4")
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

GIT_SHA="$(git -C "$ROOT" rev-parse HEAD 2>/dev/null || echo unknown)"
GIT_SHORT="$(git -C "$ROOT" rev-parse --short HEAD 2>/dev/null || echo unknown)"

# Duration + tier from composition metadata (see demo/src/features.tsx).
case "$COMP" in
  OttoProductDemo) FRAMES=1620; FPS=30; TIER=ship ;;
  OttoV01DesktopWalkthrough) FRAMES=1320; FPS=30; TIER=ship ;;
  OttoV01Channels|OttoV01Tickets|OttoV01Practices) FRAMES=455; FPS=30; TIER=ship ;;
  OttoV01FieldNote|OttoV01Curation|OttoV01Charter) FRAMES=455; FPS=30; TIER=proposed ;;
  *) FRAMES=0; FPS=30; TIER=unknown ;;
esac
if [[ "$FRAMES" -gt 0 ]]; then
  DURATION_SEC=$((FRAMES / FPS))
else
  DURATION_SEC=unknown
fi

MP4=""
case "$COMP" in
  OttoProductDemo) MP4="$OUT/otto-product-demo.mp4" ;;
  OttoV01DesktopWalkthrough) MP4="$OUT/otto-v01-desktop-walkthrough.mp4" ;;
  OttoV01Curation) MP4="$OUT/otto-v01-curation.mp4" ;;
  OttoV01Tickets) MP4="$OUT/otto-v01-tickets.mp4" ;;
  OttoV01Charter) MP4="$OUT/otto-v01-charter.mp4" ;;
  OttoV01Practices) MP4="$OUT/otto-v01-practices.mp4" ;;
  OttoV01Channels) MP4="$OUT/otto-v01-channels.mp4" ;;
  OttoV01FieldNote) MP4="$OUT/otto-v01-field-note.mp4" ;;
esac
MP4_BYTES=""
if [[ -n "$MP4" && -f "$MP4" ]]; then
  MP4_BYTES="$(wc -c <"$MP4" | tr -d ' ')"
fi

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
RECEIPT="$RECEIPT_DIR/demo-render-$STAMP.md"
cat >"$RECEIPT" <<EOF
# Demo render receipt

- **At:** $(date -u +%Y-%m-%dT%H:%M:%SZ)
- **Git sha:** \`$GIT_SHORT\` ($GIT_SHA)
- **Composition:** $COMP
- **v0.1 tier badge:** $TIER
- **Duration:** ${DURATION_SEC}s (${FRAMES} frames @ ${FPS}fps)
- **Output dir:** demo/out/
- **MP4:** ${MP4:-n/a}${MP4_BYTES:+ ($MP4_BYTES bytes)}
- **Command:** bash scripts/render-demo-clips.sh $COMP
- **Smoke verify:** bash scripts/demo-smoke-frame.sh $COMP

Honest scope: faithful re-enactments — not live screen capture. Shell mocks use no mock operational data. Tried/Approved pending Sebastian.
EOF

echo "Wrote receipt: $RECEIPT"
echo "Outputs: $OUT/"
