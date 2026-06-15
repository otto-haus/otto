# 159 - Smoke CLI Agent Env

Owner: Codex
Priority: P1
Depends on: 158
Release bucket: fresh-user-install-readme

## Outcome

A fresh user who runs the README's `task smoke:cli` check can use the same `OTTO_AGENT_ID` target-agent convention documented for the desktop path, and the failure message names the acceptable agent env vars.

## Why this matters

The current fresh-user path says `OTTO_AGENT_ID` selects the target Letta agent, then lists `task smoke:cli` as a useful disposable check. In a clean profile, `task smoke:cli` fails first with `LETTA_AGENT_ID: set LETTA_AGENT_ID`, which makes the README's runtime truth look wrong.

## Scope

- Make `task smoke:cli` accept `OTTO_AGENT_ID` as the primary documented target-agent env var.
- Preserve `LETTA_AGENT_ID` compatibility for direct Letta CLI users.
- Clarify the README's useful-check command and runtime truth note.
- Keep the smoke disposable conversation behavior unchanged.

## Out of scope

- Live Letta agent creation.
- Desktop runtime discovery/session behavior.
- Provider/model credential setup.
- Installed app or staging app launch changes.
- Broad smoke-test redesign.

## Done when

- `task smoke:cli` no longer fails at the env-var gate when only `OTTO_AGENT_ID` is set.
- With neither `OTTO_AGENT_ID` nor `LETTA_AGENT_ID`, `task smoke:cli` fails with a message that names both accepted env vars.
- README shows the required target-agent env var for `task smoke:cli`.
- README distinguishes the desktop `OTTO_AGENT_ID` convention from the direct CLI smoke's `LETTA_AGENT_ID` compatibility alias.
- Focused verification and proof are recorded in this ticket.

## Verification

Commands/checks to run:

```sh
git status --short --branch
HOME=/tmp/otto-fresh-user-loop-Wwo7ro/home CHARTER_HOME=/tmp/otto-fresh-user-loop-Wwo7ro/charter OTTO_HOME=/tmp/otto-fresh-user-loop-Wwo7ro/otto-home task smoke:cli
OTTO_AGENT_ID=fake-agent LETTA_CLI_PATH=/tmp/missing-letta.js task smoke:cli
rg -n "smoke:cli|OTTO_AGENT_ID|LETTA_AGENT_ID|LETTA_CLI_PATH|LETTA_CLI" README.md Taskfile.yml
git diff --check
bun run --cwd apps/desktop typecheck
```

## Blocker log

## Execution receipt

- repo path: `/Users/seb/Code/otto-fresh-user-skill-install-boundary`
- branch: `docs/fresh-user-skill-install-boundary`
- clean fresh-user clone used for discovery: `/tmp/otto-fresh-user-loop-Wwo7ro/repo`
- isolated profile paths used for discovery:
  - `HOME=/tmp/otto-fresh-user-loop-Wwo7ro/home`
  - `CHARTER_HOME=/tmp/otto-fresh-user-loop-Wwo7ro/charter`
  - `OTTO_HOME=/tmp/otto-fresh-user-loop-Wwo7ro/otto-home`
- first blocker found:
  - In the clean clone, `task smoke:cli` failed before reaching Letta with `LETTA_AGENT_ID: set LETTA_AGENT_ID`, while README runtime truth documented `OTTO_AGENT_ID` as the target-agent env var.
- files changed:
  - `Taskfile.yml`
  - `README.md`
  - `planning/hq-tickets/159-smoke-cli-agent-env.md`
- implemented:
  - `task smoke:cli` now resolves the target agent from `OTTO_AGENT_ID`, falling back to `LETTA_AGENT_ID`.
  - Missing target-agent failure now says `OTTO_AGENT_ID or LETTA_AGENT_ID: set one target Letta agent id`.
  - `task smoke:cli` now honors `LETTA_CLI_PATH` for direct CLI path override, matching the README runtime truth.
  - README's useful-check command now shows `OTTO_AGENT_ID=<agent-id> task smoke:cli`.
  - README now states `LETTA_AGENT_ID` is accepted by `task smoke:cli` for direct Letta CLI compatibility.
- commands run:
  - `git clone --depth 1 --branch docs/fresh-user-skill-install-boundary https://github.com/otto-haus/otto.git /tmp/otto-fresh-user-loop-Wwo7ro/repo`
  - `HOME=/tmp/otto-fresh-user-loop-Wwo7ro/home CHARTER_HOME=/tmp/otto-fresh-user-loop-Wwo7ro/charter bun install`
  - `HOME=/tmp/otto-fresh-user-loop-Wwo7ro/home CHARTER_HOME=/tmp/otto-fresh-user-loop-Wwo7ro/charter bun run install-extension`
  - `HOME=/tmp/otto-fresh-user-loop-Wwo7ro/home MEMORY_DIR=/tmp/otto-fresh-user-loop-Wwo7ro/memory CHARTER_HOME=/tmp/otto-fresh-user-loop-Wwo7ro/charter bun run install-extension`
  - `HOME=/tmp/otto-fresh-user-loop-Wwo7ro/home CHARTER_HOME=/tmp/otto-fresh-user-loop-Wwo7ro/charter OTTO_HOME=/tmp/otto-fresh-user-loop-Wwo7ro/otto-home bun run --cwd apps/desktop typecheck`
  - `HOME=/tmp/otto-fresh-user-loop-Wwo7ro/home CHARTER_HOME=/tmp/otto-fresh-user-loop-Wwo7ro/charter OTTO_HOME=/tmp/otto-fresh-user-loop-Wwo7ro/otto-home bun run --cwd apps/desktop electron:typecheck`
  - `HOME=/tmp/otto-fresh-user-loop-Wwo7ro/home CHARTER_HOME=/tmp/otto-fresh-user-loop-Wwo7ro/charter OTTO_HOME=/tmp/otto-fresh-user-loop-Wwo7ro/otto-home task smoke:cli`
  - `HOME=/tmp/otto-fresh-user-loop-Wwo7ro/home CHARTER_HOME=/tmp/otto-fresh-user-loop-Wwo7ro/charter OTTO_HOME=/tmp/otto-fresh-user-loop-Wwo7ro/otto-home OTTO_AGENT_ID=fake-agent LETTA_CLI_PATH=/tmp/missing-letta.js task smoke:cli`
  - `HOME=/tmp/otto-fresh-user-loop-Wwo7ro/home CHARTER_HOME=/tmp/otto-fresh-user-loop-Wwo7ro/charter OTTO_HOME=/tmp/otto-fresh-user-loop-Wwo7ro/otto-home LETTA_AGENT_ID=fake-agent LETTA_CLI_PATH=/tmp/missing-letta.js task smoke:cli`
  - `rg -n "smoke:cli|OTTO_AGENT_ID|LETTA_AGENT_ID|LETTA_CLI_PATH|LETTA_CLI" README.md Taskfile.yml`
  - `git diff --check`
  - `bun run --cwd apps/desktop typecheck`
  - `task --list | rg -n "smoke:cli|electron|staging|typecheck"`
- test/build output:
  - clean clone `bun install`: passed.
  - clean clone `bun run install-extension` without `MEMORY_DIR`: passed and printed the expected `WARN: MEMORY_DIR not set; skipping skill install.` manual-copy state.
  - clean clone `MEMORY_DIR=... bun run install-extension`: passed and copied `skills/charter/SKILL.md` and `skills/routine/SKILL.md`.
  - clean clone desktop typecheck and electron typecheck: passed.
  - pre-fix clean clone `task smoke:cli`: failed at env gate with `LETTA_AGENT_ID: set LETTA_AGENT_ID`.
  - post-fix no-agent-env `task smoke:cli`: failed at env gate with `OTTO_AGENT_ID or LETTA_AGENT_ID: set one target Letta agent id`.
  - post-fix `OTTO_AGENT_ID=fake-agent LETTA_CLI_PATH=/tmp/missing-letta.js task smoke:cli`: moved past env gate and failed on the intentionally missing CLI path.
  - post-fix `LETTA_AGENT_ID=fake-agent LETTA_CLI_PATH=/tmp/missing-letta.js task smoke:cli`: moved past env gate and failed on the intentionally missing CLI path.
  - `git diff --check`: passed with no output.
  - `bun run --cwd apps/desktop typecheck`: passed (`$ tsc --noEmit`).
  - `task --list`: parsed the Taskfile and listed `smoke:cli`.
- proof mapped to Done when:
  - `OTTO_AGENT_ID` gate: the fake-agent + missing CLI command reached Node's missing-module error instead of the smoke env gate.
  - missing env message: the no-agent-env command names both `OTTO_AGENT_ID` and `LETTA_AGENT_ID`.
  - README command: `README.md:216` shows `OTTO_AGENT_ID=<agent-id> task smoke:cli`.
  - README env distinction: `README.md:258-261` distinguishes `OTTO_AGENT_ID`, `LETTA_AGENT_ID`, and `LETTA_CLI_PATH`.
  - disposable behavior unchanged: the task still invokes Letta CLI with `--new --no-memfs --no-skills --no-system-info-reminder`.
- screenshots/artifacts:
  - none; this is a README/Taskfile install-path correction with command-output proof.
- known gaps:
  - No real Letta agent smoke was run because that would require a real local agent id. The verified gate is the fresh-user env mismatch and disposable CLI command construction.

## Review

Reviewer: Codex independent reviewer
Date: 2026-06-14
Verdict: +1

### Checked against

- Done when item 1: Pass. With only `OTTO_AGENT_ID=fake-agent` and `LETTA_CLI_PATH=/tmp/missing-letta.js`, `task smoke:cli` moved past the target-agent env gate and failed on the intentionally missing CLI path.
- Done when item 2: Pass. With neither `OTTO_AGENT_ID` nor `LETTA_AGENT_ID`, `task smoke:cli` failed with `OTTO_AGENT_ID or LETTA_AGENT_ID: set one target Letta agent id`.
- Done when item 3: Pass. `README.md:216` shows `OTTO_AGENT_ID=<agent-id> task smoke:cli`.
- Done when item 4: Pass. `README.md:258-259` distinguishes `OTTO_AGENT_ID` for desktop/smoke checks from the `LETTA_AGENT_ID` compatibility alias for direct CLI smoke.
- Done when item 5: Pass. Execution receipt records focused verification, and reviewer reran the focused env-gate checks plus diff checks.

### Evidence inspected

- Files: `README.md`, `Taskfile.yml`, `planning/hq-tickets/_InReview/159-smoke-cli-agent-env.md`.
- Commands: `git status --short --branch`; `git diff -- README.md Taskfile.yml`; `rg -n "smoke:cli|OTTO_AGENT_ID|LETTA_AGENT_ID|LETTA_CLI_PATH|LETTA_CLI" README.md Taskfile.yml`; `git diff --check`; isolated `task smoke:cli` with no target-agent env; isolated `task smoke:cli` with `OTTO_AGENT_ID=fake-agent LETTA_CLI_PATH=/tmp/missing-letta.js`; isolated `task smoke:cli` with `LETTA_AGENT_ID=fake-agent LETTA_CLI_PATH=/tmp/missing-letta.js`; `bun run --cwd apps/desktop typecheck`.
- UI/artifacts: none; this ticket is README/Taskfile CLI behavior only.
- Git diff: limited to the expected README smoke/runtime-truth lines and `Taskfile.yml` `smoke:cli` target-agent resolution.

### Passes

The implementation satisfies all Done when items. The smoke task now resolves `OTTO_AGENT_ID` first, preserves `LETTA_AGENT_ID` compatibility, names both accepted env vars when missing, keeps the disposable CLI flags, and the README matches the behavior.

### Defects

None found.

### Required changes

None.

### Optional polish

None.

### Finding

Ticket may move to `_Done`.

### Final call needed from Sebastian

None.
