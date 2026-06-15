# 160 - Electron Bun Cache Preflight

Owner: Codex
Priority: P1
Depends on: 159
Release bucket: fresh-user-install-readme

## Outcome

A fresh macOS user who follows the README path can run `task electron` after `bun install`
even when Bun leaves Electron's macOS bundle partially extracted.

## Critique

The README makes `task electron` the development desktop launch path. In a clean profile,
that command built the main/preload outputs and started the renderer server, then failed
before opening Electron with `Error: Electron uninstall`. A new user has no actionable
next step from that message.

The underlying state was worse than missing `path.txt`: after writing the expected
Electron path by hand, the app failed on a missing `Electron Framework.framework`.
The local Electron cache zip was intact, but Bun's postinstall extraction produced a
partial macOS bundle. Direct `/usr/bin/unzip` from the same cache restored the bundle.

## Scope

- Add a narrow preflight before `task electron`.
- Detect whether Electron resolves and, on macOS, whether the framework symlink/binary exists.
- If broken, repair from the already-downloaded Electron cache zip.
- Tell README and agent-install readers that `task electron` runs the preflight.

## Out of scope

- `task refresh` or `/Applications/otto.app`.
- Live Letta runtime setup or agent creation.
- Provider/model credential setup.
- Electron version changes.
- Replacing Bun or changing the package manager.
- `task smoke:cli` behavior.

## Done when

- A clean-profile `task electron` no longer stops at `Error: Electron uninstall`.
- The repair path handles the observed partial macOS Electron bundle from Bun's cache.
- `task electron` still starts the development app path, not the installed app path.
- README and `INSTALL_FOR_AGENTS.md` route users through `task electron` so the preflight is not bypassed.
- Focused verification and before/after proof are recorded in this ticket.

## Verification

Commands/checks to run:

```sh
git clone --depth 1 --branch docs/fresh-user-skill-install-boundary https://github.com/otto-haus/otto.git "$tmp/repo"
HOME="$tmp/home" CHARTER_HOME="$tmp/charter" OTTO_HOME="$tmp/otto-home" XDG_CONFIG_HOME="$tmp/xdg-config" XDG_DATA_HOME="$tmp/xdg-data" XDG_CACHE_HOME="$tmp/xdg-cache" bun install
HOME="$tmp/home" CHARTER_HOME="$tmp/charter" MEMORY_DIR="$tmp/memory" OTTO_HOME="$tmp/otto-home" XDG_CONFIG_HOME="$tmp/xdg-config" XDG_DATA_HOME="$tmp/xdg-data" XDG_CACHE_HOME="$tmp/xdg-cache" task electron
rg -n "ensure-electron-ready|Electron install preflight|partial Electron|repaired Electron|task electron|electron:dev" Taskfile.yml README.md INSTALL_FOR_AGENTS.md scripts/ensure-electron-ready.mjs
git diff --check
bun run --cwd apps/desktop typecheck
```

## Blocker log

## Execution receipt

- repo path: `/Users/seb/Code/otto-fresh-user-skill-install-boundary`
- branch: `docs/fresh-user-skill-install-boundary`
- clean pre-fix clone used for discovery: `/var/folders/22/fzs3nrw505z_m71cghqjc7j80000gn/T/otto-fresh-user-loop.XXXXXX.7syVzxTZcn/repo`
- clean after-fix clone used for verification: `/var/folders/22/fzs3nrw505z_m71cghqjc7j80000gn/T/otto-fresh-user-afterfix.XXXXXX.VpvHgpeB0o/repo`
- isolated profile paths used in after-fix verification:
  - `HOME=/var/folders/22/fzs3nrw505z_m71cghqjc7j80000gn/T/otto-fresh-user-afterfix.XXXXXX.VpvHgpeB0o/home`
  - `CHARTER_HOME=/var/folders/22/fzs3nrw505z_m71cghqjc7j80000gn/T/otto-fresh-user-afterfix.XXXXXX.VpvHgpeB0o/charter`
  - `MEMORY_DIR=/var/folders/22/fzs3nrw505z_m71cghqjc7j80000gn/T/otto-fresh-user-afterfix.XXXXXX.VpvHgpeB0o/memory`
  - `OTTO_HOME=/var/folders/22/fzs3nrw505z_m71cghqjc7j80000gn/T/otto-fresh-user-afterfix.XXXXXX.VpvHgpeB0o/otto-home`
  - `XDG_CONFIG_HOME=/var/folders/22/fzs3nrw505z_m71cghqjc7j80000gn/T/otto-fresh-user-afterfix.XXXXXX.VpvHgpeB0o/xdg-config`
  - `XDG_DATA_HOME=/var/folders/22/fzs3nrw505z_m71cghqjc7j80000gn/T/otto-fresh-user-afterfix.XXXXXX.VpvHgpeB0o/xdg-data`
  - `XDG_CACHE_HOME=/var/folders/22/fzs3nrw505z_m71cghqjc7j80000gn/T/otto-fresh-user-afterfix.XXXXXX.VpvHgpeB0o/xdg-cache`
- first blocker found:
  - In the clean candidate-branch clone, `task electron` built main/preload and started the renderer server, then failed with `error during start dev server and electron app: Error: Electron uninstall`.
  - The clean install had `dist/Electron.app` but no `path.txt`; after manually writing `path.txt`, Electron failed with `dyld: Library not loaded: @rpath/Electron Framework.framework/Electron Framework`.
  - The Electron cache zip contained the full framework entries, while the extracted Bun postinstall output was partial.
- files changed:
  - `scripts/ensure-electron-ready.mjs`
  - `Taskfile.yml`
  - `README.md`
  - `INSTALL_FOR_AGENTS.md`
  - `planning/hq-tickets/160-electron-bun-cache-preflight.md`
- implemented:
  - `task electron` now runs `node ../../scripts/ensure-electron-ready.mjs` before `bun run electron:dev`.
  - The preflight resolves Electron from `apps/desktop`, checks Electron readiness, and on macOS repairs a partial bundle by unzipping the cached Electron archive and writing `path.txt`.
  - README and `INSTALL_FOR_AGENTS.md` now route users through `task electron` so the preflight runs.
- commands run:
  - pre-fix clean clone: `bun install`
  - pre-fix clean clone: `bun run install-extension`
  - pre-fix clean clone: `MEMORY_DIR=... bun run install-extension`
  - pre-fix clean clone: `task --list`
  - pre-fix clean clone: `task electron` with PID `54666`; startup log captured, PID tree stopped, no scoped remaining processes.
  - diagnosis: `node -e "console.log(require('electron'))"` from `apps/desktop`, which failed with `Electron failed to install correctly`.
  - diagnosis: manually wrote `Electron.app/Contents/MacOS/Electron` to `path.txt`, then reran `task electron`; startup reached `starting electron app...` and failed on missing `Electron Framework.framework`, confirming partial bundle extraction.
  - diagnosis: direct `/usr/bin/unzip` of the cached Electron archive restored symlinks and Electron resolution.
  - after-fix clean clone: `bun install`
  - after-fix clean clone: `bun run install-extension`
  - after-fix clean clone: `MEMORY_DIR=... bun run install-extension`
  - after-fix clean clone: `task --list`
  - after-fix clean clone: `task electron` with PID `72136`; startup log captured, PID tree stopped, no scoped remaining processes.
  - `rg -n "ensure-electron-ready|Electron install preflight|partial Electron|repaired Electron|task electron|electron:dev" Taskfile.yml README.md INSTALL_FOR_AGENTS.md scripts/ensure-electron-ready.mjs`
  - `git diff --check`
  - `bun run --cwd apps/desktop typecheck`
- test/build output:
  - pre-fix `task electron`: failed at `Error: Electron uninstall`.
  - after-fix `task electron`: printed `repaired Electron macOS bundle from Bun cache`, built main/preload, reported `dev server running for the electron renderer process at: Local: http://localhost:5173/`, and reached `starting electron app...`.
  - after-fix PID cleanup: no scoped remaining `$tmp` or `electron-vite` processes were listed.
  - `git diff --check`: passed with no output.
  - `bun run --cwd apps/desktop typecheck`: passed (`$ tsc --noEmit`).
- proof mapped to Done when:
  - no `Error: Electron uninstall`: after-fix clean clone reached `starting electron app...`.
  - repair path: startup log includes `repaired Electron macOS bundle from Bun cache`; direct diagnostic confirmed `/usr/bin/unzip` restores the framework symlinks from the cache zip.
  - development path: `Taskfile.yml` still runs `env -u ELECTRON_RUN_AS_NODE bun run electron:dev` after the preflight; no `task refresh` or installed app path was used.
  - docs route: README and `INSTALL_FOR_AGENTS.md` mention `task electron` and the install preflight.
  - proof recorded: this receipt includes before/after command output and cleanup state.
- screenshots/artifacts:
  - none; in-app Browser/iab was not needed for this CLI/install-path blocker.
- known gaps:
  - No live Letta connection was tested.
  - The loop intentionally stopped after fixing the first blocker (`task electron`); `task smoke:cli` remains for the next loop.

## Review

Reviewer: Codex independent reviewer
Date: 2026-06-14
Verdict: +1

### Checked against

- Done when item 1: Satisfied. The pre-fix clean-profile log fails at `Error: Electron uninstall`; the after-fix clean-profile log reaches `starting electron app...` after the repair preflight.
- Done when item 2: Satisfied. `scripts/ensure-electron-ready.mjs` detects unresolved or partial Electron, checks the macOS framework symlink/binary, unzips the cached Electron archive, writes `path.txt`, and the after-fix log prints `repaired Electron macOS bundle from Bun cache`.
- Done when item 3: Satisfied. `Taskfile.yml` keeps `task electron` in `apps/desktop` and still runs `env -u ELECTRON_RUN_AS_NODE bun run electron:dev` after the preflight; no implementation path invokes `task refresh` or `/Applications/otto.app`.
- Done when item 4: Satisfied. `README.md` and `INSTALL_FOR_AGENTS.md` route development Electron users through `task electron` and describe the preflight.
- Done when item 5: Satisfied. The ticket contains before/after clean-profile proof, diagnostic proof for the partial bundle, focused command output, cleanup state, and known gaps.

### Evidence inspected

- Files: `AGENTS.md`, `planning/hq-tickets/AGENTS.md`, `planning/hq-tickets/000-canonical.md`, `planning/hq-tickets/000-index.md`, `planning/hq-tickets/_workflow-review-ticket.md`, `planning/hq-tickets/_InReview/160-electron-bun-cache-preflight.md`, `scripts/ensure-electron-ready.mjs`, `Taskfile.yml`, `README.md`, `INSTALL_FOR_AGENTS.md`.
- Commands: `git status --short`; `git diff -- Taskfile.yml README.md INSTALL_FOR_AGENTS.md`; `git diff --no-index -- /dev/null scripts/ensure-electron-ready.mjs`; `node scripts/ensure-electron-ready.mjs`; `rg -n "ensure-electron-ready|Electron install preflight|partial Electron|repaired Electron|task electron|electron:dev" Taskfile.yml README.md INSTALL_FOR_AGENTS.md scripts/ensure-electron-ready.mjs`; `git diff --check`; `bun run --cwd apps/desktop typecheck`; scoped `rg` scans for `task refresh` and `/Applications/otto.app` references.
- UI/artifacts: Inspected clean-profile logs at `/var/folders/22/fzs3nrw505z_m71cghqjc7j80000gn/T/otto-fresh-user-loop.XXXXXX.7syVzxTZcn/task-electron.log`, `/var/folders/22/fzs3nrw505z_m71cghqjc7j80000gn/T/otto-fresh-user-loop.XXXXXX.7syVzxTZcn/task-electron-after-path-repair.log`, `/var/folders/22/fzs3nrw505z_m71cghqjc7j80000gn/T/otto-fresh-user-loop.XXXXXX.7syVzxTZcn/task-electron-after-unzip-repair.log`, and `/var/folders/22/fzs3nrw505z_m71cghqjc7j80000gn/T/otto-fresh-user-afterfix.XXXXXX.VpvHgpeB0o/task-electron-after-fix.log`.
- Git diff: Tracked changes are limited to `Taskfile.yml`, `README.md`, and `INSTALL_FOR_AGENTS.md`; new script is `scripts/ensure-electron-ready.mjs`; ticket is in `_InReview`.

### Passes

- `node scripts/ensure-electron-ready.mjs` passed in the review worktree.
- `git diff --check` passed.
- `bun run --cwd apps/desktop typecheck` passed (`$ tsc --noEmit`).
- Clean-profile after-fix proof is coherent and does not rely on the installed app path.

### Defects

None found.

### Required changes

None.

### Optional polish

None required for this ticket.

### Finding

All Done when items are satisfied. This ticket may move to `_Done`.

### Final call needed from Sebastian

None for acceptance; conveyor may move this ticket to `_Done`.
