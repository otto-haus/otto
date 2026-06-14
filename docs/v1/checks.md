# Checks — Culture CI primitive

**Schema:** `otto.check.v1`  
**Storage:** `~/.otto/checks/<id>.yaml` (seed templates in repo `checks/`)  
**Category prose:** Culture CI — behavior regressions compiled from ratified Standards

## One sentence

A **Check** is an executable behavioral regression: when a trigger fires, Otto inspects proof and blocks or allows with a Receipt.

```txt
Correction → Proposal → Ratified Standard → Check → block or allow → Receipt
```

## Naming (locked)

- **Checks** — product primitive (UI, IPC `checks.*`, code)
- **Culture CI** — category thesis in README/marketing only
- **Practices** — behavior specs; **Checks** — regressions from **Standards**

## Schema (`otto.check.v1`)

| Field | Required | Notes |
|-------|----------|-------|
| `schema` | yes | `otto.check.v1` |
| `id` | yes | kebab-case stable id |
| `version` | yes | semver string |
| `source` | yes | e.g. `standard/no-fake-done.md` |
| `trigger.event` | yes | `done_claim` \| `one_way_door_action` |
| `inspect.require` | yes | rule ids (see below) |
| `on_fail.block_claim` | yes | block when false |
| `on_fail.message` | yes | user-visible block reason |
| `on_fail.write_receipt` | yes | write proof on fail |

### Trigger events (v1)

| Event | When fired |
|-------|------------|
| `done_claim` | Ticket/charter/worker marks done or merged |
| `one_way_door_action` | Send, spend, deploy, merge, delete, credential change |

### Inspect rules (v1)

| Rule id | Meaning |
|---------|---------|
| `acceptance_criteria_mapped` | Every AC has a proof mapping |
| `evidence_attached` | Review evidence refs present |
| `test_or_log_or_artifact_present` | At least one verifiable artifact |
| `approval_present` | Human/session/autonomy approval for door |

## Canonical example

```yaml
schema: otto.check.v1
id: completion-requires-receipts
version: "1.0.0"
source: standard/no-fake-done.md
trigger:
  event: done_claim
inspect:
  require:
    - acceptance_criteria_mapped
    - evidence_attached
    - test_or_log_or_artifact_present
on_fail:
  block_claim: true
  message: "Not done: missing mapped proof."
  write_receipt: true
```

## Runtime (133)

- Main process loads checks from `~/.otto/checks/`
- `CheckRunner.evaluate(trigger, context)` returns pass/fail + optional receipt
- Renderer cannot bypass checks

## Compiler (132)

On Curation accept targeting a Standard, `check-compiler` writes/updates `~/.otto/checks/<id>.yaml` with provenance.

## IPC

```txt
checks.list   → CheckListResult
checks.get    → Check | null
checks.run    → CheckRunResult (staging/dev)
```

## UI (134)

Checks pane lists active checks; block banner shows `on_fail.message` when a check fails.

## References

- Ticket **131** — contract
- Ticket **132** — compile on ratify
- Ticket **133** — runtime + seeds
- Ticket **051** — ticket review gate (overlaps `done_claim`)
