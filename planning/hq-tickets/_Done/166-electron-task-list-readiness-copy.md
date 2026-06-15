# 166 - Electron Task List Readiness Copy

Owner: Codex
Priority: P2
Depends on: 165
Release bucket: fresh-user-install-readme

## Outcome

A fresh user reading `task --list` sees that `task electron` launches the development
Electron app, but chat readiness still depends on a real Letta session initialization.

## Critique

After ticket 165, the next clean-profile walk reached `task --list`. The command passed,
but it described `task electron` as:

```txt
Desktop — Electron app wired to the live Letta runtime
```

In a clean profile, that overclaims the state. `task electron` can launch the dev app and
attempt runtime readiness, but chat is not connected until `session.initialize()` succeeds
against a live Letta agent. README and `INSTALL_FOR_AGENTS.md` already say that; the task
list was the remaining stale onboarding surface.

## Scope

- Update only the `task electron` description in `Taskfile.yml`.
- Keep command behavior unchanged.
- Verify the task list no longer says the app is already wired to the live runtime.

## Out of scope

- Changing Electron launch behavior.
- Running a real Letta connected-state smoke.
- `task refresh`, `smoke:desktop:live`, staging refresh, or `/Applications/otto.app`.

## Done when

- `task --list` describes `task electron` as the Electron dev app and names the
  `session.initialize()` readiness boundary.
- `task --list` no longer contains `wired to the live Letta runtime`.
- Existing README / agent docs still carry the connected-state boundary.
- Focused verification and before/after proof are recorded in this ticket.

## Verification

Commands/checks to run:

```sh
task --list | rg -n "electron:|Letta session initializes|wired to the live Letta runtime"
if task --list | rg -n "wired to the live Letta runtime"; then exit 1; else echo old_electron_desc_absent=yes; fi
rg -n "Electron dev app|Letta session initializes|wired to the live Letta runtime|Chat stays gated|session\\.initialize" Taskfile.yml README.md INSTALL_FOR_AGENTS.md
git diff --check
```

## Blocker log

## Execution receipt

- repo path: `/Users/seb/Code/otto-fresh-user-skill-install-boundary`
- branch: `docs/fresh-user-skill-install-boundary`
- clean discovery clone: `/var/folders/22/fzs3nrw505z_m71cghqjc7j80000gn/T/otto-fresh-user-loop.XXXXXX.jXzlt0dGPR/repo`
- first blocker found:
  - `task --list` passed, but the `task electron` description still said
    `Desktop — Electron app wired to the live Letta runtime`.
  - In a clean profile, that wording overclaims connected readiness before
    `session.initialize()`.
- before output:

```txt
* electron:                 Desktop — Electron app wired to the live Letta runtime
```

- files changed:
  - `Taskfile.yml`
  - `planning/hq-tickets/166-electron-task-list-readiness-copy.md`
- implemented:
  - `Taskfile.yml` now describes `task electron` as:

```txt
Desktop — Electron dev app; chat connects only after Letta session initializes
```

- clean after-fix proof:
  - Applied the one-line Taskfile patch to the same fresh clone and reran `task --list`.

```txt
7:* electron:                 Desktop — Electron dev app; chat connects only after Letta session initializes
```

- additional checks run before review:
  - `task --list | rg -n "electron:|Letta session initializes|wired to the live Letta runtime"`
  - `if task --list | rg -n "wired to the live Letta runtime"; then exit 1; else echo old_electron_desc_absent=yes; fi`
  - `rg -n "Electron dev app|Letta session initializes|wired to the live Letta runtime|Chat stays gated|session\\.initialize" Taskfile.yml README.md INSTALL_FOR_AGENTS.md`
  - `git diff --check`
- proof mapped to Done when:
  - Task list names dev app and readiness boundary: verified locally and in the fresh clone.
  - Old overclaim absent from task list: verified by the same `rg`; only the ticket records
    the old phrase as before-proof.
  - README / agent boundary: verified by `rg`.
  - Proof recorded: this receipt includes before/after evidence, commands, and known gaps.
- screenshots/artifacts:
  - none; this is task-list onboarding copy.
- known gaps:
  - No real Letta agent smoke was run.
  - No typecheck was required because only `Taskfile.yml` changed.
  - No staging refresh or installed app refresh was run.

## Review
Reviewer: Codex independent reviewer
Date: 2026-06-14
Verdict: +1

AC evidence:
- Task list describes `task electron` as the Electron dev app and names the readiness boundary: `task --list | rg -n "electron:|Letta session initializes|wired to the live Letta runtime"` returned `Desktop - Electron dev app; chat connects only after Letta session initializes`.
- Old task-list overclaim is absent: `if task --list | rg -n "wired to the live Letta runtime"; then exit 1; else echo old_electron_desc_absent=yes; fi` returned `old_electron_desc_absent=yes`.
- README / agent docs still carry the connected-state boundary: `rg` found `session.initialize()` / chat gated wording in `README.md` and `INSTALL_FOR_AGENTS.md`.
- Focused proof is recorded in the execution receipt, including before/after output and commands.

Defects: none.
Required changes: none.
