# 165 - Smoke CLI Missing Agent Guidance

Owner: Codex
Priority: P1
Depends on: 164
Release bucket: fresh-user-install-readme

## Outcome

A fresh user who reaches `task smoke:cli` without a local Letta agent understands that the
smoke is optional until they have a real agent, and sees the exact command shape to run
later.

## Critique

After ticket 164, the clean-profile path reached `task smoke:cli`. With no agent id in the
fresh environment, the task failed with:

```txt
OTTO_AGENT_ID or LETTA_AGENT_ID: set one target Letta agent id
task: Failed to run task "smoke:cli": exit status 1
```

That was technically correct, but incomplete for onboarding. The README says
`task smoke:cli` is optional until a real local Letta agent exists; the task list and
failure message did not carry that boundary or the exact invocation.

## Scope

- Make `task --list` describe `smoke:cli` as optional and agent-id gated.
- Make the missing-agent failure explain the optional boundary and exact command shape.
- Mirror the expected missing-agent state in README / agent install guidance.
- Keep `task smoke:cli` nonzero when no agent id is provided; do not fake a smoke pass.

## Out of scope

- Creating or discovering a real Letta agent.
- Running a real Letta CLI smoke.
- Changing the disposable conversation behavior.
- `task refresh`, `smoke:desktop:live`, staging refresh, or `/Applications/otto.app`.

## Done when

- `task --list` shows `smoke:cli` as optional and requiring `OTTO_AGENT_ID` or
  `LETTA_AGENT_ID`.
- `task smoke:cli` with no agent id exits nonzero but prints the optional boundary and
  `OTTO_AGENT_ID=<agent-id> task smoke:cli`.
- README says running `task smoke:cli` before a real agent exists exits with a
  missing-agent message instead of performing a fake smoke.
- `INSTALL_FOR_AGENTS.md` tells agents to record the missing-agent message instead of
  running a fake smoke or using `conversation=default`.
- Focused verification and before/after proof are recorded in this ticket.

## Verification

Commands/checks to run:

```sh
task --list | rg -n "smoke:cli|Optional Letta CLI smoke"
env -u OTTO_AGENT_ID -u LETTA_AGENT_ID task smoke:cli
rg -n "Optional Letta CLI smoke|task smoke:cli requires|Optional until you have a real local Letta agent|missing-agent message|OTTO_AGENT_ID=<agent-id> task smoke:cli|conversation=default" README.md INSTALL_FOR_AGENTS.md Taskfile.yml
git diff --check
```

## Blocker log

## Execution receipt

- repo path: `/Users/seb/Code/otto-fresh-user-skill-install-boundary`
- branch: `docs/fresh-user-skill-install-boundary`
- clean discovery clone: `/var/folders/22/fzs3nrw505z_m71cghqjc7j80000gn/T/otto-fresh-user-loop.XXXXXX.XTWGG146rh/repo`
- first blocker found:
  - After `bun install`, both `bun run install-extension` modes, `task --list`, and
    `task electron` passed, `task smoke:cli` failed because no `OTTO_AGENT_ID` or
    `LETTA_AGENT_ID` existed in the clean profile.
  - The failure omitted the README's optional/real-agent boundary and exact command shape.
- before output:

```txt
OTTO_AGENT_ID or LETTA_AGENT_ID: set one target Letta agent id
task: Failed to run task "smoke:cli": exit status 1
```

- files changed:
  - `Taskfile.yml`
  - `README.md`
  - `INSTALL_FOR_AGENTS.md`
  - `planning/hq-tickets/165-smoke-cli-missing-agent-guidance.md`
- implemented:
  - `Taskfile.yml` now describes `smoke:cli` as optional and requiring `OTTO_AGENT_ID` or
    `LETTA_AGENT_ID`.
  - The missing-agent branch now prints:

```txt
task smoke:cli requires OTTO_AGENT_ID or LETTA_AGENT_ID.
Optional until you have a real local Letta agent; run OTTO_AGENT_ID=<agent-id> task smoke:cli.
```

  - README says running the smoke before a real agent exits with a missing-agent message
    instead of performing a fake smoke.
  - `INSTALL_FOR_AGENTS.md` tells agents to record the missing-agent state rather than
    faking the smoke or using `conversation=default`.
- clean after-fix proof:
  - Applied the three-file patch to the same fresh clone and reran the relevant commands.
  - `task --list | rg -n "smoke:cli|Optional Letta CLI smoke"`:

```txt
21:* smoke:cli:                Optional Letta CLI smoke; requires OTTO_AGENT_ID or LETTA_AGENT_ID and uses a disposable conversation
```

  - `task smoke:cli` with no agent id:

```txt
task smoke:cli requires OTTO_AGENT_ID or LETTA_AGENT_ID.
Optional until you have a real local Letta agent; run OTTO_AGENT_ID=<agent-id> task smoke:cli.
task: Failed to run task "smoke:cli": exit status 1
```

- additional checks run before review:
  - `task --list | rg -n "smoke:cli|Optional Letta CLI smoke"`
  - `env -u OTTO_AGENT_ID -u LETTA_AGENT_ID task smoke:cli` (expected exit 201 from Task wrapping the intentional exit 1)
  - `rg -n "Optional Letta CLI smoke|task smoke:cli requires|Optional until you have a real local Letta agent|missing-agent message|OTTO_AGENT_ID=<agent-id> task smoke:cli|conversation=default" README.md INSTALL_FOR_AGENTS.md Taskfile.yml`
  - `git diff --check`
- proof mapped to Done when:
  - Task list optional/agent-id gate: verified locally and in the fresh clone.
  - Missing-agent output: verified locally and in the fresh clone.
  - README missing-agent boundary: verified by `rg`.
  - Agent install guidance: verified by `rg`.
  - Proof recorded: this receipt includes before/after evidence, commands, and known gaps.
- screenshots/artifacts:
  - none; this is CLI/onboarding copy.
- known gaps:
  - No real Letta agent smoke was run.
  - No typecheck was required because no app/source TypeScript files changed.
  - No staging refresh or installed app refresh was run.

## Review
Reviewer: Codex independent reviewer
Date: 2026-06-14
Verdict: +1

AC-by-AC evidence:
- `task --list` describes `smoke:cli` as optional and gated on `OTTO_AGENT_ID` or `LETTA_AGENT_ID`: verified by `task --list | rg -n "smoke:cli|Optional Letta CLI smoke"` returning `Optional Letta CLI smoke; requires OTTO_AGENT_ID or LETTA_AGENT_ID and uses a disposable conversation`.
- Missing-agent smoke stays nonzero and prints the optional boundary plus exact later command: verified by `env -u OTTO_AGENT_ID -u LETTA_AGENT_ID task smoke:cli`, which exited 201 from Task wrapping the intentional exit 1 and printed `task smoke:cli requires OTTO_AGENT_ID or LETTA_AGENT_ID.` plus `Optional until you have a real local Letta agent; run OTTO_AGENT_ID=<agent-id> task smoke:cli.`
- README documents that running before a real agent exits with a missing-agent message instead of fake smoke: verified in `README.md` diff and `rg`.
- `INSTALL_FOR_AGENTS.md` tells agents to record the missing-agent message instead of faking smoke or using `conversation=default`: verified in diff and `rg`.
- Focused verification and before/after proof are recorded in the execution receipt; reviewer independently reran the required focused checks.

Defects: none.

Required changes: none.
