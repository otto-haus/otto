# Practice metrics

Per-Practice runtime metrics. A Practice's `practice.yaml` lists **which** metric names
it tracks; this is the full block shape and how it's maintained. Metrics are durable
state (they live under the Practice's `state_paths`), not memory.

```yaml
metrics:
  uses: 0                       # total invocations
  last_used_at: null            # ISO-8601 timestamp of most recent run
  successful_runs: 0            # runs that met the evidence_standard
  blocked_runs: 0               # runs paused at an approval gate
  user_edits_required: 0        # runs whose output the user had to materially edit
  premature_done_prevented: 0   # times Review/Charter caught a fake "done"
  avg_time_to_artifact: null    # mean time from invocation to first durable artifact
  notes: []                     # freeform quality observations
```

Practice-specific metrics may extend this block, e.g.:

```txt
decision:    graded_decisions, decision_quality_score
review:      risks_flagged, ac_unmapped
follow-up:   drafts_created, sends_after_approval
field-note:  notes_captured, followups_staged, memory_writebacks
```

## Deprecate or merge a Practice when it is

- rarely used
- overlapping another Practice
- adding ceremony without quality gain
- not producing durable state/evidence
- not reinforcing culture
