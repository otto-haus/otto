# Receipt — Charter (Otto v0.1)

- **What changed:** Renamed to Otto across `extension/charter.ts`, `skill/SKILL.md`,
  `practices/charter/practice.yaml`, docs. Runtime default `~/.otto`; gates overlay intact.
- **Demo:** `demo/out/otto-v01-charter.mp4`
- **Test command/output:** No automated test for the extension. `bun run typecheck` → exit 0
  (core types Charter relies on). Charter spec validates via `bun packages/practices/src/cli.ts`.
- **Manual verification:** `./scripts/install.sh` → `/reload` in Letta Code → `/charter propose <intent>`
  → `/charter step` → trigger a one-way door (e.g. push) and confirm the gate blocks → `/charter complete`.
- **Known limitations:** Extension command flow is not unit-tested; demo terminal is a faithful re-enactment, not a live capture.
- **Approval status:** ☐ pending Sebastian (Tried + Approved).
