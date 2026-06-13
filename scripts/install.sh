#!/usr/bin/env bash
# Install Vinny OS into Letta Code:
#  - symlink the Charter and Routine extensions into ~/.letta/extensions/
#  - install the skills into the agent's memory skills dir
#  - scaffold the Charter runtime under $CHARTER_HOME/charters/ (default ~/.charter)
#
# Files = truth (runtime), Memory = lessons. Run /reload in Letta Code afterward.
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EXT_DIR="${HOME}/.letta/extensions"
CHARTER_HOME="${CHARTER_HOME:-${HOME}/.charter}"

echo "Vinny OS / Charter repo: ${REPO_DIR}"

# 1. Extension (symlink so the repo stays source of truth)
mkdir -p "${EXT_DIR}"
ln -sf "${REPO_DIR}/extension/charter.ts" "${EXT_DIR}/charter.ts"
echo "linked  ${EXT_DIR}/charter.ts -> ${REPO_DIR}/extension/charter.ts"
ln -sf "${REPO_DIR}/extension/routine.ts" "${EXT_DIR}/routine.ts"
echo "linked  ${EXT_DIR}/routine.ts -> ${REPO_DIR}/extension/routine.ts"

# 2. Skill (copy into the agent memory skills dir if MEMORY_DIR is set)
if [[ -n "${MEMORY_DIR:-}" ]]; then
  mkdir -p "${MEMORY_DIR}/skills/charter" "${MEMORY_DIR}/skills/routine"
  cp "${REPO_DIR}/skill/SKILL.md" "${MEMORY_DIR}/skills/charter/SKILL.md"
  cp "${REPO_DIR}/skill/routine/SKILL.md" "${MEMORY_DIR}/skills/routine/SKILL.md"
  echo "copied  ${MEMORY_DIR}/skills/charter/SKILL.md"
  echo "copied  ${MEMORY_DIR}/skills/routine/SKILL.md"
else
  echo "WARN: MEMORY_DIR not set; skipping skill install."
  echo "      Copy skill/SKILL.md into your agent's skills/charter/ manually."
  echo "      Copy skill/routine/SKILL.md into your agent's skills/routine/ manually."
fi

# 3. Runtime scaffold (Files = truth, NOT in Letta memory)
mkdir -p "${CHARTER_HOME}/charters"
if [[ ! -f "${CHARTER_HOME}/charters/active.json" ]]; then
  printf '{ "slug": null }\n' > "${CHARTER_HOME}/charters/active.json"
  echo "wrote   ${CHARTER_HOME}/charters/active.json"
fi
echo "runtime ${CHARTER_HOME}/charters/"

echo "Done. Run /reload in Letta Code."
