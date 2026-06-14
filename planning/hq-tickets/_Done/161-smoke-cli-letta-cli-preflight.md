# 161 - Smoke CLI Letta CLI Preflight

Owner: Codex
Priority: P1
Depends on: 160
Release bucket: fresh-user-install-readme

## Outcome

A fresh user who reaches the optional `task smoke:cli` check gets a clear setup message
when the Letta CLI bundle is missing or installed outside the default path, not a raw
Node module-resolution stack.

## Critique

The README now correctly shows `OTTO_AGENT_ID=<agent-id> task smoke:cli`, but the next
fresh-user gate is the Letta CLI path. With an agent id set and a missing CLI path,
`task smoke:cli` failed with:

```txt
Error: Cannot find module '/tmp/missing-letta.js'
...
Node.js v26.3.0
```

That is true but not useful onboarding. The task already knows the CLI path it is about
to execute, so it should explain the missing Letta Desktop / Letta Code dependency before
Node runs.

## Scope

- Preflight the resolved Letta CLI path in `task smoke:cli`.
- Keep `OTTO_AGENT_ID` primary and `LETTA_AGENT_ID` compatibility.
- Keep disposable conversation flags unchanged.
- Add README guidance that the smoke is optional until a real local Letta agent exists.

## Out of scope

- Creating a Letta agent.
- Running a real Letta smoke against Sebastian's runtime.
- Desktop connection or Settings behavior.
- Staging, installed app refresh, or `/Applications/otto.app`.
- Changing Letta SDK versions or package layout.

## Done when

- With no agent env, `task smoke:cli` still fails with a message naming `OTTO_AGENT_ID` and `LETTA_AGENT_ID`.
- With an agent env and missing `LETTA_CLI_PATH`, `task smoke:cli` fails before Node with a message naming the missing path and the `LETTA_CLI_PATH` repair.
- README says `task smoke:cli` is optional until a real local Letta agent exists.
- The task still invokes Letta CLI with the disposable conversation flags when the CLI path exists.
- Focused verification and before/after proof are recorded in this ticket.

## Verification

Commands/checks to run:

```sh
task smoke:cli
OTTO_AGENT_ID=fake-agent LETTA_CLI_PATH=/tmp/missing-letta.js task smoke:cli
rg -n "smoke:cli|Letta CLI not found|LETTA_CLI_PATH|OTTO_AGENT_ID|LETTA_AGENT_ID|optional until" README.md Taskfile.yml
git diff --check
bun run --cwd apps/desktop typecheck
```

## Blocker log

## Execution receipt

- repo path: `/Users/seb/Code/otto-fresh-user-skill-install-boundary`
- branch: `docs/fresh-user-skill-install-boundary`
- clean pre-fix clone used for discovery: `/var/folders/22/fzs3nrw505z_m71cghqjc7j80000gn/T/otto-fresh-user-loop.XXXXXX.vijtLK6YRW/repo`
- clean after-fix clone used for focused verification: `/var/folders/22/fzs3nrw505z_m71cghqjc7j80000gn/T/otto-smoke-cli-afterfix.XXXXXX.n0DkkjNei6/repo`
- first blocker found:
  - Bare `task smoke:cli` in the clean candidate clone now fails clearly with `OTTO_AGENT_ID or LETTA_AGENT_ID: set one target Letta agent id`.
  - After supplying a fake agent id and a missing CLI path to avoid touching a real Letta runtime, the next gate failed with a raw Node `Cannot find module '/tmp/missing-letta.js'` stack.
- files changed:
  - `Taskfile.yml`
  - `README.md`
  - `planning/hq-tickets/161-smoke-cli-letta-cli-preflight.md`
- implemented:
  - `task smoke:cli` now resolves `CLI_PATH="${LETTA_CLI_PATH:-{{.LETTA_CLI}}}"`, checks that it exists, and prints:
    - `Letta CLI not found at <path>`
    - `Install or repair Letta Desktop / Letta Code, or set LETTA_CLI_PATH=/path/to/letta.js.`
  - README now states that `task smoke:cli` is optional until there is a real local Letta agent, tells users to replace `<agent-id>`, and mentions `LETTA_CLI_PATH`.
- commands run:
  - clean candidate branch: `bun install`
  - clean candidate branch: `bun run install-extension`
  - clean candidate branch: `MEMORY_DIR=... bun run install-extension`
  - clean candidate branch: `task --list`
  - clean candidate branch: `task electron` with PID `17755`; startup log captured, PID tree stopped, no scoped remaining processes.
  - clean candidate branch: `task smoke:cli`
  - clean candidate branch: `OTTO_AGENT_ID=fake-agent LETTA_CLI_PATH=/tmp/missing-letta.js task smoke:cli`
  - after-fix clean clone: `OTTO_AGENT_ID=fake-agent LETTA_CLI_PATH=/tmp/missing-letta.js task smoke:cli`
  - current worktree: `task smoke:cli`
  - current worktree: `OTTO_AGENT_ID=fake-agent LETTA_CLI_PATH=/tmp/missing-letta.js task smoke:cli`
  - `rg -n "smoke:cli|Letta CLI not found|LETTA_CLI_PATH|OTTO_AGENT_ID|LETTA_AGENT_ID|optional until" README.md Taskfile.yml`
  - `git diff --check`
  - `bun run --cwd apps/desktop typecheck`
- test/build output:
  - no-agent env: `OTTO_AGENT_ID or LETTA_AGENT_ID: set one target Letta agent id`.
  - pre-fix missing CLI path: raw Node `Cannot find module '/tmp/missing-letta.js'` stack.
  - after-fix missing CLI path: `Letta CLI not found at /tmp/missing-letta.js` plus `Install or repair Letta Desktop / Letta Code, or set LETTA_CLI_PATH=/path/to/letta.js.`
  - `rg`: found the README optional-smoke guidance and Taskfile preflight strings.
  - `git diff --check`: passed with no output.
  - `bun run --cwd apps/desktop typecheck`: passed (`$ tsc --noEmit`).
- proof mapped to Done when:
  - no-agent env: verified unchanged message naming `OTTO_AGENT_ID` and `LETTA_AGENT_ID`.
  - missing CLI path: verified clear preflight message before Node.
  - README optional boundary: `README.md` says `task smoke:cli` is optional until a real local Letta agent exists.
  - disposable behavior unchanged: `Taskfile.yml` still invokes Letta CLI with `--new --no-memfs --no-skills --no-system-info-reminder`.
  - proof recorded: this receipt includes before/after command output and known gaps.
- screenshots/artifacts:
  - none; this is a CLI/onboarding path fix.
- known gaps:
  - No real Letta agent smoke was run; fake agent plus missing CLI path was used to avoid touching Sebastian's real Letta runtime.
  - No staging refresh was run, per Sebastian's instruction because he is using staging.

## Review

Reviewer: Codex independent reviewer
Date: 2026-06-14
Verdict: +1

### Checked against

- Done when item 1: Passed. With isolated temp HOME/CHARTER_HOME/MEMORY_DIR/OTTO_HOME/XDG_* and no agent env, `task smoke:cli` failed before any CLI execution with `OTTO_AGENT_ID or LETTA_AGENT_ID: set one target Letta agent id`.
- Done when item 2: Passed. With isolated temp HOME/CHARTER_HOME/MEMORY_DIR/OTTO_HOME/XDG_* plus `OTTO_AGENT_ID=fake-agent LETTA_CLI_PATH=/tmp/missing-letta.js`, `task smoke:cli` failed before Node with `Letta CLI not found at /tmp/missing-letta.js` and the `LETTA_CLI_PATH` repair line.
- Done when item 3: Passed. `README.md` says `task smoke:cli` is optional until a real local Letta agent exists and documents `LETTA_CLI_PATH`.
- Done when item 4: Passed. `Taskfile.yml` still invokes `node "$CLI_PATH" --agent "$AGENT_ID" --new --no-memfs --no-skills --no-system-info-reminder ... --output-format json` when the CLI path exists.
- Done when item 5: Passed. The execution receipt records before/after proof, focused verification, and the intentional gap that no real Letta runtime smoke was run.

### Evidence inspected

- Files: `AGENTS.md`, `planning/hq-tickets/AGENTS.md`, `planning/hq-tickets/000-canonical.md`, `planning/hq-tickets/000-index.md`, `planning/hq-tickets/_workflow-review-ticket.md`, this ticket, `Taskfile.yml`, `README.md`.
- Commands: isolated no-agent `task smoke:cli` failed with the expected env message; isolated missing-CLI `task smoke:cli` failed with the expected Letta CLI path/repair message; `rg -n "smoke:cli|Letta CLI not found|LETTA_CLI_PATH|OTTO_AGENT_ID|LETTA_AGENT_ID|optional until" README.md Taskfile.yml`; `git diff --check`; `bun run --cwd apps/desktop typecheck`.
- UI/artifacts: none; CLI/onboarding path only.
- Git diff: `Taskfile.yml` adds only the resolved `CLI_PATH` existence preflight before `node`; `README.md` adds optional smoke guidance and `LETTA_CLI_PATH` guidance.

### Passes

All Done when items are satisfied. Disposable Letta CLI flags are preserved. Review did not run staging, refresh staging, `/Applications/otto.app`, or a real Letta runtime.

### Defects

None.

### Required changes

None.

### Optional polish

None.

### Finding

The ticket may move to `_Done`.

### Final call needed from Sebastian

None.
