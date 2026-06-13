# Charter Runtime spec

## Layout

```
<root>/charters/
  active.json
  <slug>/
    charter.md       human contract
    charter.yaml     machine contract (source of truth)
    state.yaml       mutable run state
    ledger.md        append-only history
    approvals/       <id>.yaml scoped approval records
    receipts/        proof artifacts
    traces/          raw tool/exec traces
    notes/           detailed companion notes
```

Default `<root>` is `$CHARTER_HOME` (default `~/.charter`), deliberately OUTSIDE Letta
memory: **Files = truth, Memory = lessons.** Override with `CHARTER_HOME`. Receipts may
link out to repo paths.

`slug`: kebab-case of the objective, deduped.

## active.json

```json
{ "slug": "charter-goal-os" }
```

`{ "slug": null }` (or missing) means no active charter.

## charter.yaml (machine source of truth)

```yaml
slug: <slug>
objective: <one line>
status: active            # proposed | active | blocked | complete | cancelled
acceptance_criteria:
  - id: AC1
    text: <criterion>
    proof: <receipt path/link or null>
  - id: AC2
    text: <criterion>
    proof: null
gates:                    # armed one-way-door classes
  - publish
  - deploy
plan:
  - id: S1
    step: <text>
    done: false
```

`charter.md` is the human render of the same contract. Keep AC ids consistent across
both faces; the Auditor fails completion on mismatch.

## state.yaml fields

| field | meaning |
| --- | --- |
| `slug` | directory slug |
| `objective` | one-line objective |
| `status` | `proposed` \| `active` \| `blocked` \| `complete` \| `cancelled` |
| `current_phase` | `scout` \| `judge` \| `worker` \| `auditor` \| `recorder` |
| `created_at` / `updated_at` | ISO-8601 timestamps |
| `plan` | list of `{ id, step, done }` |
| `completed_steps` | finished step ids |
| `open_loops` | unfinished threads to track |
| `blockers` | current blockers |
| `approval_gates` | armed one-way-door classes |
| `receipt_paths` | proof artifact paths/links |
| `next_action` | the next concrete step |
| `no_evidence_loops` | consecutive steps with no artifact (force block/sharpen at 2) |
| `risk_notes` | risks / caveats |

## approvals/<id>.yaml

```yaml
id: <short-id>
requested_action: <exact action>
scope: <what it covers, narrowly>
evidence_required: <proof needed before/after>
requested_at: <iso8601>
expires_at: <iso8601>
status: pending          # pending | approved | denied | expired
decided_by: <name>
decided_at: <iso8601>
```

Only act on an approval that is `approved`, unexpired, and within `scope`.

## ledger.md

Append-only, newest at the bottom. The line after the header is a `re-entry:`
one-liner kept current. Each entry: `<iso8601> <event> — <detail>. next: <action>`.

## Lifecycle

```
propose -> (approve) -> active <-> blocked -> complete
                                  \-> cancelled
```

Completion requires: every AC maps to a receipt (AC-by-AC), no required work remains,
user-facing summary prepared.
