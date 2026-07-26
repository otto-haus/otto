# PR ship review loop

Readonly reviewers score green-lane PRs during the unified shipping loop **ship_review** phase.

## Green lane criteria

- `mergeable`: MERGEABLE
- `mergeStateStatus`: CLEAN
- Required CI checks: SUCCESS (none IN_PROGRESS or FAILURE)

## Verdicts

| Verdict | Meaning | Label (`state.yaml` → `verdict_labels`) |
|---|---|---|
| `SHIP_CANDIDATE` | Aligns with issue/scope; CI green; ready for Sebastian merge review | `status: ready for review` |
| `HOLD` | Fixable gap — scope, quality, or missing proof | `status: needs codex review` |
| `CLOSE_CANDIDATE` | Duplicate or superseded; recommend close (Sebastian only) | `status: needs codex review` |

Never merge or close. Post comment + receipt + label only.

## Receipt path

`docs/receipts/pr-ship-review/pr-{N}.md`

## GitHub PR comment template

```md
## otto ship review (automated)

**Verdict:** SHIP_CANDIDATE | HOLD | CLOSE_CANDIDATE

**PR:** #{N} · head `{short_oid}`

### Alignment
- Issue link + AC mapping

### Duplicate check
- headRefOid distinct? winner PR if CLOSE_CANDIDATE?

### Scope & quality
- Files touched vs issue scope
- Test/proof coverage

### Recommendation
One sentence for Sebastian.

**Receipt:** `docs/receipts/pr-ship-review/pr-{N}.md`

_Automation recommendation only — Sebastian is the merge gate._
```

## Rubric sections (receipt body)

1. Summary
2. CI proof table
3. Merge state
4. headRefOid duplicate check
5. Fixes issues
6. Risks
7. Verdict + rationale
