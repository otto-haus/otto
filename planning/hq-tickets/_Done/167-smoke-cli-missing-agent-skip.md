# 167 - Smoke CLI Missing Agent Skip

Owner: Codex
Priority: P1
Depends on: 166
Release bucket: fresh-user-install-readme

## Outcome

A fresh user can run the full README smoke path through `task smoke:cli` without a false
failure when no local Letta agent exists yet; the task reports an explicit skip instead.

## Critique

After ticket 166, the clean-profile path reached the final `task smoke:cli` step. The
message was clearer, but the command still exited nonzero and Task printed its wrapper
failure before the guidance:

```txt
task: Failed to run task "smoke:cli": exit status 1
task smoke:cli requires OTTO_AGENT_ID or LETTA_AGENT_ID.
Optional until you have a real local Letta agent; run OTTO_AGENT_ID=<agent-id> task smoke:cli.
```

That is still a new-user blocker because README frames the smoke as optional until a real
agent exists. Optional missing-agent state should be a truthful `SKIP`, not a failed task.

## Scope

- Change only the no-agent branch of `task smoke:cli` to exit 0 with explicit `SKIP` copy.
- Keep real smoke execution and real smoke failures nonzero once an agent id is provided.
- Update README and `INSTALL_FOR_AGENTS.md` from missing-agent failure language to skip
  language.

## Out of scope

- Creating or discovering a real Letta agent.
- Running a real Letta CLI smoke.
- Changing CLI path failure behavior when an agent id is provided.
- `task refresh`, `smoke:desktop:live`, staging refresh, or `/Applications/otto.app`.

## Done when

- `task smoke:cli` with no `OTTO_AGENT_ID` or `LETTA_AGENT_ID` exits 0.
- The no-agent output starts with `SKIP task smoke:cli`.
- README says running the smoke before a real agent reports `SKIP` instead of failing or
  performing a fake smoke.
- `INSTALL_FOR_AGENTS.md` tells agents to record the `SKIP` message instead of faking the
  smoke or using `conversation=default`.
- Focused verification and before/after proof are recorded in this ticket.

## Verification

Commands/checks to run:

```sh
env -u OTTO_AGENT_ID -u LETTA_AGENT_ID task smoke:cli
rg -n 'SKIP task smoke:cli|reports `SKIP`|record the `SKIP`|fake smoke|conversation=default|OTTO_AGENT_ID=<agent-id> task smoke:cli' README.md INSTALL_FOR_AGENTS.md Taskfile.yml
git diff --check
```

## Blocker log

## Execution receipt

- repo path: `/Users/seb/Code/otto-fresh-user-skill-install-boundary`
- branch: `docs/fresh-user-skill-install-boundary`
- clean discovery clone: `/var/folders/22/fzs3nrw505z_m71cghqjc7j80000gn/T/otto-fresh-user-loop.XXXXXX.4naIoC46d3/repo`
- first blocker found:
  - After `bun install`, both `bun run install-extension` modes, `task --list`, and
    bounded `task electron` passed, `task smoke:cli` still exited nonzero when no local
    Letta agent id existed.
  - Because the smoke is optional until a real local agent exists, this was still a false
    failure in the clean-profile path.
- before output:

```txt
task: Failed to run task "smoke:cli": exit status 1
task smoke:cli requires OTTO_AGENT_ID or LETTA_AGENT_ID.
Optional until you have a real local Letta agent; run OTTO_AGENT_ID=<agent-id> task smoke:cli.
```

- files changed:
  - `Taskfile.yml`
  - `README.md`
  - `INSTALL_FOR_AGENTS.md`
  - `planning/hq-tickets/167-smoke-cli-missing-agent-skip.md`
- implemented:
  - The no-agent branch of `task smoke:cli` now exits 0 and prints:

```txt
SKIP task smoke:cli: OTTO_AGENT_ID or LETTA_AGENT_ID is not set.
Run OTTO_AGENT_ID=<agent-id> task smoke:cli after you have a real local Letta agent.
```

  - README now says running the optional smoke before a real agent reports `SKIP` instead
    of failing or performing a fake smoke.
  - `INSTALL_FOR_AGENTS.md` now tells agents to record the `SKIP` message.
- clean after-fix proof:
  - Applied the three-file patch to the same fresh clone and reran `task smoke:cli` under
    temp `HOME`, `CHARTER_HOME`, `MEMORY_DIR`, `OTTO_HOME`, and `XDG_*`.

```txt
SKIP task smoke:cli: OTTO_AGENT_ID or LETTA_AGENT_ID is not set.
Run OTTO_AGENT_ID=<agent-id> task smoke:cli after you have a real local Letta agent.
```

  - command exit: 0.
- additional checks run before review:
  - `env -u OTTO_AGENT_ID -u LETTA_AGENT_ID task smoke:cli`
  - `rg -n 'SKIP task smoke:cli|reports `SKIP`|record the `SKIP`|fake smoke|conversation=default|OTTO_AGENT_ID=<agent-id> task smoke:cli' README.md INSTALL_FOR_AGENTS.md Taskfile.yml`
  - `git diff --check`
- proof mapped to Done when:
  - No-agent exit 0: verified locally and in the fresh clone.
  - `SKIP task smoke:cli` output: verified locally and in the fresh clone.
  - README skip boundary: verified by `rg`.
  - Agent install skip boundary: verified by `rg`.
  - Proof recorded: this receipt includes before/after evidence, commands, and known gaps.
- screenshots/artifacts:
  - none; this is CLI/onboarding behavior.
- known gaps:
  - No real Letta agent smoke was run.
  - No typecheck was required because no app/source TypeScript files changed.
  - No staging refresh or installed app refresh was run.

## Review
Reviewer: Codex independent reviewer
Date: 2026-06-14
Verdict: +1

AC-by-AC evidence:
- No-agent exit 0: `env -u OTTO_AGENT_ID -u LETTA_AGENT_ID task smoke:cli` exited 0.
- SKIP prefix: command output starts with `SKIP task smoke:cli: OTTO_AGENT_ID or LETTA_AGENT_ID is not set.`
- README skip boundary: diff and `rg` show README says pre-agent smoke reports `SKIP` instead of failing or performing a fake smoke.
- Agent install boundary: diff and `rg` show `INSTALL_FOR_AGENTS.md` tells agents to record the `SKIP` message instead of faking the smoke or using `conversation=default`.
- Proof recorded: execution receipt includes before/after output, exit 0, focused checks, and known gaps.

Additional evidence:
- `git diff -- Taskfile.yml README.md INSTALL_FOR_AGENTS.md` shows the no-agent branch exits 0 and docs changed only to skip language.
- Configured-agent failures remain nonzero: `env OTTO_AGENT_ID=review-dummy LETTA_CLI_PATH=/tmp/otto-review-missing-letta-cli task smoke:cli` failed on missing CLI instead of skipping.
- `git diff --check` passed.
- No `task refresh`, live desktop smoke, staging refresh, `/Applications/otto.app`, commit, push, PR update, or file move was performed.

Defects: none.
Required changes: none.
