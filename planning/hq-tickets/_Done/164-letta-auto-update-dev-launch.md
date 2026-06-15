# 164 - Letta Auto-Update Dev Launch

Owner: Codex
Priority: P1
Depends on: 163
Release bucket: fresh-user-install-readme

## Outcome

A fresh user running `task electron` does not get a raw Letta Code auto-update failure or
a global npm repair command during Otto dev launch.

## Critique

After ticket 163, the clean-profile path reached `task electron` with isolated `HOME`,
`CHARTER_HOME`, `MEMORY_DIR`, `OTTO_HOME`, and `XDG_*`. Electron startup and profile
isolation worked, but the Letta CLI printed:

```txt
[letta-code-sdk] CLI stderr: Auto-update failed due to filesystem issue (ENOTEMPTY).
Fix: rm -rf $(npm prefix -g)/lib/node_modules/@letta-ai/letta-code && npm i -g @letta-ai/letta-code
```

The npm logs under the temp profile showed the auto-updater was running `npm install -g`
against `/Users/seb/.hermes/node/lib/node_modules/@letta-ai/letta-code`, outside the clean
profile. A new user should not be told to run a global npm repair command as part of Otto's
README dev launch path.

## Scope

- Disable the spawned Letta Code CLI auto-updater by default for Otto desktop sessions.
- Preserve an explicit user override if `DISABLE_AUTOUPDATER` is already set.
- Update the Electron preflight copy and README/agent install docs to describe the
  auto-update boundary.
- Verify with temp-profile `task electron` dev startup proof only.

## Out of scope

- Running a global npm repair command.
- Updating Letta Desktop or Letta Code.
- Changing Letta SDK or Letta CLI packages.
- `task refresh`, `smoke:desktop:live`, or `/Applications/otto.app`.
- Real Letta connected-state proof.

## Done when

- Otto sets `DISABLE_AUTOUPDATER=1` for the spawned Letta Code CLI unless the user already
  set that environment variable.
- The Electron preflight copy no longer tells users that first runtime connection may
  bootstrap Letta Code with npm.
- README and `INSTALL_FOR_AGENTS.md` say Letta Code auto-update is disabled during Otto dev
  launch and updates should happen outside Otto.
- A temp-profile `task electron` run reaches `starting electron app...` without
  `Auto-update failed`, `npm prefix -g`, `npm i -g`, or the global Letta Code npm path in
  its log.
- Focused verification and before/after proof are recorded in this ticket.

## Verification

Commands/checks to run:

```sh
node scripts/ensure-electron-ready.mjs
task electron
rg -n "DISABLE_AUTOUPDATER|auto-update disabled|auto-update during dev launch|global npm repair|SDK-bundled Letta Code|Letta Desktop CLI found" README.md INSTALL_FOR_AGENTS.md scripts/ensure-electron-ready.mjs apps/desktop/electron/letta-runner.ts
git diff --check
bun run --cwd apps/desktop electron:typecheck
bun run --cwd apps/desktop typecheck
```

## Blocker log

## Execution receipt

- repo path: `/Users/seb/Code/otto-fresh-user-skill-install-boundary`
- branch: `docs/fresh-user-skill-install-boundary`
- clean discovery clone: `/var/folders/22/fzs3nrw505z_m71cghqjc7j80000gn/T/otto-fresh-user-loop.XXXXXX.2zAvnrF5lC/repo`
- first blocker found:
  - `task electron` reached `starting electron app...`, but then printed the raw Letta CLI
    auto-update failure and a global npm repair command.
  - npm logs under temp `HOME` showed global update work against
    `/Users/seb/.hermes/node/lib/node_modules/@letta-ai/letta-code`.
- before output:

```txt
Letta Desktop CLI found; first runtime connection may still bootstrap Letta Code with npm.
starting electron app...
[letta-code-sdk] CLI stderr: Auto-update failed due to filesystem issue (ENOTEMPTY).
Fix: rm -rf $(npm prefix -g)/lib/node_modules/@letta-ai/letta-code && npm i -g @letta-ai/letta-code
```

- files changed:
  - `apps/desktop/electron/letta-runner.ts`
  - `scripts/ensure-electron-ready.mjs`
  - `README.md`
  - `INSTALL_FOR_AGENTS.md`
  - `planning/hq-tickets/164-letta-auto-update-dev-launch.md`
- implemented:
  - `apps/desktop/electron/letta-runner.ts` now sets `DISABLE_AUTOUPDATER=1` before
    creating the Letta SDK session unless the environment variable is already set.
  - `scripts/ensure-electron-ready.mjs` now reports that Otto disables Letta Code
    auto-update during dev launch.
  - README says the first runtime connection uses Letta Code with auto-update disabled and
    that Letta Desktop / Letta Code updates happen outside otto.
  - `INSTALL_FOR_AGENTS.md` tells clean-profile runners not to run global npm repair
    commands as part of the smoke.
- clean after-fix proof:
  - Applied the four-file patch to the same fresh clone and reran `task electron` under
    temp `HOME`, `CHARTER_HOME`, `MEMORY_DIR`, `OTTO_HOME`, and `XDG_*`.
  - startup log:

```txt
Letta Desktop CLI found; Otto disables Letta Code auto-update during dev launch.
dev server running for the electron renderer process at:
  Local:   http://localhost:5173/
starting electron app...
```

  - scoped process proof:

```txt
profile_under_temp=yes
live_profile_seen=no
auto_update_output_seen=no
--- remaining scoped electron/dev processes ---
```

- additional checks run before review:
  - `node scripts/ensure-electron-ready.mjs`
  - `rg -n "DISABLE_AUTOUPDATER|auto-update disabled|auto-update during dev launch|global npm repair|SDK-bundled Letta Code|Letta Desktop CLI found" README.md INSTALL_FOR_AGENTS.md scripts/ensure-electron-ready.mjs apps/desktop/electron/letta-runner.ts`
  - `git diff --check`
  - `bun run --cwd apps/desktop electron:typecheck`
  - `bun run --cwd apps/desktop typecheck`
- proof mapped to Done when:
  - `DISABLE_AUTOUPDATER=1` default: implemented in `applyConnectionEnv` before session
    creation and preserved when already set.
  - Preflight copy: verified by `node scripts/ensure-electron-ready.mjs` and `rg`.
  - README/agent docs: verified by `rg`.
  - No auto-update/global npm output: after-fix temp-profile `task electron` printed
    `auto_update_output_seen=no`.
  - Proof recorded: this receipt includes before/after evidence, commands, and known gaps.
- screenshots/artifacts:
  - none; this is CLI/runtime-onboarding proof.
- known gaps:
  - No real Letta agent smoke was run.
  - `task smoke:cli` was not run in this loop because the clean-profile walk stops at the
    first blocker, which was `task electron`.
  - No staging refresh or installed app refresh was run; this loop only verifies dev
    Electron startup.

## Review
Reviewer: Codex independent reviewer
Date: 2026-06-14
Verdict: +1

- AC1 `DISABLE_AUTOUPDATER=1` default: pass. `apps/desktop/electron/letta-runner.ts`
  sets it before SDK session initialization and preserves a non-empty caller-provided
  value.
- AC2 preflight copy: pass. `scripts/ensure-electron-ready.mjs` no longer says first
  runtime connection may bootstrap Letta Code with npm; local preflight prints the new
  auto-update-disabled boundary.
- AC3 README and agent install docs: pass. README says updates happen outside otto and
  both docs state Otto disables Letta Code auto-update during dev launch / no global npm
  repair during clean-profile smoke.
- AC4 temp-profile `task electron` proof: pass by in-ticket receipt. I did not rerun
  `task electron`; the execution receipt records `starting electron app...`,
  `auto_update_output_seen=no`, temp-profile isolation, and no remaining scoped processes.
- AC5 focused verification and before/after proof: pass. Receipt includes before failure,
  after output, scoped process proof, and command list. Reviewer reran
  `node scripts/ensure-electron-ready.mjs`, `git diff --check`,
  `bun run --cwd apps/desktop electron:typecheck`, and
  `bun run --cwd apps/desktop typecheck`; all passed.
- Defects: none.
- Required changes: none.
