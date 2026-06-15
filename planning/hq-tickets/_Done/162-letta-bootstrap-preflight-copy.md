# 162 - Letta Bootstrap Preflight Copy

Owner: Codex
Priority: P1
Depends on: 161
Release bucket: fresh-user-install-readme

## Outcome

A fresh user who launches `task electron` can see, before startup, whether the Letta CLI
path is missing or whether the first runtime connection may still bootstrap Letta Code.

## Critique

After tickets 155-161, the clean-profile path reached `task electron`. Startup reached
`starting electron app...`, but after the Electron PID tree was stopped, the scoped process
check briefly showed:

```txt
npm install @letta-ai/letta-code@latest ... XDG_DATA_HOME=<tmp>/xdg-data
```

The npm logs under the temp profile confirmed a first-run `npm install --global
@letta-ai/letta-code@latest`. That is not necessarily a product failure, but it is a
surprising onboarding fact: `bun install` finished, then first desktop connection can still
trigger Letta Code bootstrap work.

## Scope

- Make `task electron`'s existing preflight report Letta CLI/bootstrap state before startup.
- Document the first-connection bootstrap boundary in README.
- Tell agent installers to record the exact preflight state and not call the desktop
  connected until `session.initialize()` succeeds.

## Out of scope

- Changing Letta SDK behavior.
- Blocking the desktop from opening when Letta is not ready.
- Running a real Letta runtime smoke.
- Staging, staging refresh, installed app refresh, or `/Applications/otto.app`.
- Changing dependency versions.

## Done when

- `node scripts/ensure-electron-ready.mjs` reports when Letta Desktop CLI is present and first runtime connection may still bootstrap Letta Code with npm.
- `LETTA_CLI_PATH=/tmp/missing-letta.js node scripts/ensure-electron-ready.mjs` reports the missing explicit path and repair direction.
- README explains the first-connection bootstrap boundary near `task electron`.
- `INSTALL_FOR_AGENTS.md` tells agents to record that state and not claim connected before `session.initialize()`.
- Focused verification and before/after proof are recorded in this ticket.

## Verification

Commands/checks to run:

```sh
node scripts/ensure-electron-ready.mjs
LETTA_CLI_PATH=/tmp/missing-letta.js node scripts/ensure-electron-ready.mjs
rg -n "Letta Desktop CLI found|first runtime connection|first-run bootstrap|missing CLI|LETTA_CLI_PATH is set but not found|session\\.initialize|task electron|LETTA_CLI_PATH" scripts/ensure-electron-ready.mjs README.md INSTALL_FOR_AGENTS.md
git diff --check
bun run --cwd apps/desktop typecheck
```

## Blocker log

## Execution receipt

- repo path: `/Users/seb/Code/otto-fresh-user-skill-install-boundary`
- branch: `docs/fresh-user-skill-install-boundary`
- clean pre-fix clone used for discovery: `/var/folders/22/fzs3nrw505z_m71cghqjc7j80000gn/T/otto-fresh-user-loop.XXXXXX.smTSeRCdW4/repo`
- clean after-fix clone used for focused verification: `/var/folders/22/fzs3nrw505z_m71cghqjc7j80000gn/T/otto-letta-bootstrap-afterfix.XXXXXX.8Hxemlt8zV/repo`
- first blocker found:
  - `task electron` reached startup and was stopped by PID tree, but the scoped remaining-process check briefly showed `npm install @letta-ai/letta-code@latest` under the temp profile.
  - npm logs under the temp profile confirmed `npm install --global @letta-ai/letta-code@latest`.
  - This was surprising because the documented `bun install` had already passed.
- files changed:
  - `scripts/ensure-electron-ready.mjs`
  - `README.md`
  - `INSTALL_FOR_AGENTS.md`
  - `planning/hq-tickets/162-letta-bootstrap-preflight-copy.md`
- implemented:
  - `scripts/ensure-electron-ready.mjs` now reports:
    - `Letta Desktop CLI found; first runtime connection may still bootstrap Letta Code with npm.`
    - `LETTA_CLI_PATH is set but not found: <path>` plus repair guidance when an explicit path is invalid.
    - Existing missing-default fallback guidance remains in place.
  - README now explains that first runtime connection may bootstrap Letta Code with npm and that `LETTA_CLI_PATH` is for non-default installs.
  - `INSTALL_FOR_AGENTS.md` tells agents to record CLI bootstrap/missing state, let scoped first-run bootstrap finish before stopping the dev process, and avoid connected claims before `session.initialize()`.
- commands run:
  - clean candidate branch: `bun install`
  - clean candidate branch: `bun run install-extension`
  - clean candidate branch: `MEMORY_DIR=... bun run install-extension`
  - clean candidate branch: `task --list`
  - clean candidate branch: `task electron` with PID `56241`; startup log captured, PID tree stopped, no staging used.
  - clean candidate branch: scoped process cleanup check for temp-root `npm install @letta-ai/letta-code@latest`.
  - diagnosis: inspected temp npm logs showing `npm install --global @letta-ai/letta-code@latest`.
  - current worktree: `node scripts/ensure-electron-ready.mjs`
  - current worktree: `LETTA_CLI_PATH=/tmp/missing-letta.js node scripts/ensure-electron-ready.mjs`
  - after-fix clean clone: `node scripts/ensure-electron-ready.mjs`
  - after-fix clean clone: `LETTA_CLI_PATH=/tmp/missing-letta.js node scripts/ensure-electron-ready.mjs`
  - `rg -n "Letta Desktop CLI found|first runtime connection|first-run bootstrap|missing CLI|LETTA_CLI_PATH is set but not found|session\\.initialize|task electron|LETTA_CLI_PATH" scripts/ensure-electron-ready.mjs README.md INSTALL_FOR_AGENTS.md`
  - `git diff --check`
  - `bun run --cwd apps/desktop typecheck`
- test/build output:
  - default preflight: `Letta Desktop CLI found; first runtime connection may still bootstrap Letta Code with npm.`
  - explicit missing path: `LETTA_CLI_PATH is set but not found: /tmp/missing-letta.js` and `Install or repair Letta Desktop / Letta Code before expecting live chat to connect.`
  - after-fix clean clone produced the same two messages.
  - `rg`: found the preflight and doc strings.
  - `git diff --check`: passed with no output.
  - `bun run --cwd apps/desktop typecheck`: passed (`$ tsc --noEmit`).
- proof mapped to Done when:
  - Letta Desktop CLI present message: verified in current worktree and after-fix clean clone.
  - explicit missing path message: verified in current worktree and after-fix clean clone.
  - README bootstrap boundary: README documents the first runtime connection bootstrap near `task electron`.
  - agent connected boundary: `INSTALL_FOR_AGENTS.md` names `session.initialize()` as the connected gate.
  - proof recorded: this receipt includes before/after command output and known gaps.
- screenshots/artifacts:
  - none; this is a CLI/onboarding preflight-copy fix.
- known gaps:
  - No real Letta agent smoke was run.
  - No staging refresh was run, per Sebastian's instruction because he is using staging.

## Review

Reviewer: Codex independent reviewer
Date: 2026-06-14
Verdict: +1

### Checked against

- Done when item 1: Passed. `node scripts/ensure-electron-ready.mjs` exits 0 and reports `Letta Desktop CLI found; first runtime connection may still bootstrap Letta Code with npm.`
- Done when item 2: Passed. `LETTA_CLI_PATH=/tmp/missing-letta.js node scripts/ensure-electron-ready.mjs` exits 0 and reports the missing explicit path plus repair direction.
- Done when item 3: Passed. README documents the first runtime connection bootstrap boundary next to the `task electron` launch instructions.
- Done when item 4: Passed. `INSTALL_FOR_AGENTS.md` tells agents to record Letta CLI bootstrap/missing state and not claim connected until `session.initialize()` succeeds.
- Done when item 5: Passed. The execution receipt records discovery, after-fix proof, focused commands, known gaps, and maps proof to each Done when item.

### Evidence inspected

- Files: `scripts/ensure-electron-ready.mjs`, `README.md`, `INSTALL_FOR_AGENTS.md`, `planning/hq-tickets/_InReview/162-letta-bootstrap-preflight-copy.md`
- Commands: `node scripts/ensure-electron-ready.mjs`; `LETTA_CLI_PATH=/tmp/missing-letta.js node scripts/ensure-electron-ready.mjs`; `rg -n "Letta Desktop CLI found|first runtime connection|first-run bootstrap|missing CLI|LETTA_CLI_PATH is set but not found|session\\.initialize|task electron|LETTA_CLI_PATH" scripts/ensure-electron-ready.mjs README.md INSTALL_FOR_AGENTS.md`; `git diff --check`; `bun run --cwd apps/desktop typecheck`
- UI/artifacts: none; this is CLI/doc preflight copy only.
- Git diff: inspected for `scripts/ensure-electron-ready.mjs`, `README.md`, and `INSTALL_FOR_AGENTS.md`.

### Passes

- The implementation only reports bootstrap/preflight state; it does not call `session.initialize()`, start Letta, run `task electron`, run staging, refresh staging, or touch installed app paths.
- The new Letta CLI checks are warnings with exit code 0 after Electron readiness/repair, so they do not block desktop launch.
- The missing explicit CLI path branch gives a concrete repair direction without pretending live chat is connected.
- Documentation preserves the boundary that live chat is connected only after a real Letta session initializes.
- `git diff --check` passed with no output.
- `bun run --cwd apps/desktop typecheck` passed (`$ tsc --noEmit`).

### Defects

None.

### Required changes

None.

### Optional polish

None.

### Finding

All Done when items are satisfied. Ticket may move to `_Done`.

### Final call needed from Sebastian

None.
