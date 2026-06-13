# Practice Mining

Practices are not only authored top-down — they are **mined** from repeated work.
Vinny owns the mining loop; the human legitimizes the result.

```txt
Observe repeated behavior
→ propose Practice
→ human approves
→ activate Practice
→ measure usage
→ refine or deprecate
```

## The loop in detail

1. **Observe** — notice a high-value behavior happening more than once (a workflow, a
   check, a recurring artifact, a recurring objection-and-counter).
2. **Propose** — draft a proposal (see [`templates/practice-proposal.md`](../templates/practice-proposal.md))
   and surface it. Low-risk draft files may be created locally; nothing is enabled.
3. **Approve** — the human decides legitimacy: approve / defer / reject.
4. **Activate** — only on approval. `status: draft → active`. Invocations registered.
5. **Measure** — track usage and quality via [`metrics.md`](metrics.md).
6. **Refine or deprecate** — improve the spec, merge overlaps, or retire it.

## Who does what

```txt
Vinny      owns Practice operations  (observe, propose, draft, measure, recommend).
The human  owns Practice legitimacy  (approve activation, behavior changes, side effects).
```

## Deprecate or merge a Practice when it is

- rarely used
- overlapping another Practice
- adding ceremony without quality gain
- not producing durable state/evidence
- not reinforcing culture

A Practice that does not raise the quality of repeated behavior should not survive.
