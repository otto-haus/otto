---
name: routine
description: Routine — repeated bundles of Practices. Use when the user invokes /routine, wants recurring agent behavior, asks to compose Practices on a trigger, or when Vinny should mine/propose a Routine from repeated work. Recurring activation belongs to the human.
---

# Routine

A Routine is a repeated bundle of canonical Practices.

```txt
Practices make culture executable.
Routines make Practices compound.
Receipts prove behavior changed.
```

## Core rule

```txt
Routine proposal        can be autonomous.
One-off low-risk trial  can be autonomous.
Recurring activation    belongs to the human.   <- attention is a one-way door
Permissions / effects   belong to the human.
```

Do not enable a recurring schedule without human approval, even if no new tool
permission is needed.

## Contract

Routine specs conform to `Routine` in `packages/core/src/types.ts`:

- `id`, `slug`, `name`, `status`, `summary`, `steps[]`, `attention_cost`,
  `requires_approval_to_activate`, `created_at`
- optional `schedule` with `cron` or `rrule`, plus `timezone`
- `steps[].practice` must be one of: `charter`, `decision`, `review`, `field-note`,
  `follow-up`
- any recurring/standing Routine sets `requires_approval_to_activate: true`

## Runtime

Default root: `$ROUTINE_HOME/` or `$VINNY_HOME/`, falling back to `~/.vinny`.

```txt
routines/<slug>/routine.yaml     product truth
runs/                            runtime execution records (gitignored)
receipts/                        proof artifacts / quick-audit surface (gitignored)
```

Files = truth. Memory = lessons. UI = cockpit.

## Subcommands

### list
List Routines with status, schedule, attention cost, approval requirement, last Run,
and obvious blocks. Flag recurring Routines that lack activation approval.

### show <slug>
Render the Routine spec and recent Runs/Receipts. Verify each step references a
canonical Practice slug.

### run <slug>
Execute one on-demand trial only. Do not schedule anything. Run the Practice steps in
order, honor every Practice gate, label missing data, and produce a Run record plus a
Receipt or a block.

### pause <slug>
Set `status: paused` and disable the backend schedule. Pausing is reversible.

### resume <slug>
Recurring activation. Show the spec and attention cost, then ask exactly:
`Activate '<slug>' on its recurring schedule? (approve / trial-once / cancel)`.
Only on approval may you set `status: active` and register the schedule.

### propose <intent>
Draft a Routine using canonical Practice slugs, `templates/routine-proposal.md`, and
`routines/_templates/routine.yaml`. Status should be `proposed`. You may offer one
low-risk trial. Do not activate recurring schedules.

### mine
Scan recent Runs, Receipts, and conversation for Practice bundles that recur. Draft
Routine proposals only. Include attention cost, guardrails, trial safety, and why the
Routine would change behavior.

### receipt <run-id>
Render the Run receipt. If a completed Run is missing a Receipt, reconstruct it from
the Run record and artifacts.

## Pruning test

A Routine must earn attention. Pause, merge, redesign, or retire a Routine that:

- does not change behavior
- does not produce useful artifacts or Receipts
- repeatedly requires user correction
- overlaps another Routine
- would not be missed if it vanished

Apply the same test to review/mining Routines so the auditor never becomes rote
ceremony.

## Gates

The `routine-gates` overlay asks before recurring activation mechanisms such as
`letta cron add/create/enable`, crontab installs, launchd enable/load, and systemd
timers. Charter Gates still cover external or irreversible side effects.
