#!/usr/bin/env bash
# Render every Otto v0.1 feature demo into out/. Run: bash demo/render-all.sh
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"

render() {
  echo "── $1 → out/$2.mp4"
  bunx remotion render src/index.ts "$1" "out/$2.mp4"
}

render OttoV01Charter             otto-v01-charter
render OttoV01Practices           otto-v01-practices
render OttoV01Routines            otto-v01-routines
render OttoV01Skills              otto-v01-skills
render OttoV01Standards           otto-v01-standards
render OttoV01AutonomyTicketcraft otto-v01-autonomy-ticketcraft
render OttoV01Desktop             otto-v01-desktop
render OttoV01Knowledge           otto-v01-knowledge

echo "ALL_RENDERS_DONE"
ls -la out/*.mp4
