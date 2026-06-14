#!/usr/bin/env bash
# Render every Otto v0.1 feature demo into out/. Run: bash demo/render-all.sh
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"

mkdir -p public out

# README hero screenshot → Remotion staticFile when present
HERO_SRC="../.github/assets/otto-desktop.png"
WALKTHROUGH_PROPS='{"hasScreenshot":false}'
if [[ -f "$HERO_SRC" ]]; then
  cp "$HERO_SRC" public/otto-desktop.png
  WALKTHROUGH_PROPS='{"hasScreenshot":true}'
  echo "hero: using $HERO_SRC"
else
  rm -f public/otto-desktop.png
  echo "hero: missing $HERO_SRC — walkthrough uses title-card fallback"
fi

render() {
  echo "── $1 → out/$2.mp4"
  bunx remotion render src/index.ts "$1" "out/$2.mp4"
}

render_walkthrough() {
  echo "── OttoV01DesktopWalkthrough → out/otto-v01-desktop-walkthrough.mp4"
  bunx remotion render src/index.ts OttoV01DesktopWalkthrough out/otto-v01-desktop-walkthrough.mp4 --props="$WALKTHROUGH_PROPS"
}

render OttoV01Charter             otto-v01-charter
render OttoV01Practices           otto-v01-practices
render OttoV01Routines            otto-v01-routines
render OttoV01Skills              otto-v01-skills
render OttoV01Standards           otto-v01-standards
render OttoV01Autonomy otto-v01-autonomy
render OttoV01Desktop             otto-v01-desktop
render OttoV01Knowledge           otto-v01-knowledge
render_walkthrough

echo "ALL_RENDERS_DONE"
ls -la out/*.mp4
