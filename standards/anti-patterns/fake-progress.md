# Anti-pattern: Fake Progress

**Violates:** [Quality / No Fake Done](../standards/quality.md), [Winning / Outcomes Over Motion](../standards/winning.md)

Motion or confidence presented as completed, proven work.

## What it looks like

- "Done" with no Receipt, no artifact, no link.
- Proxy evidence: "it compiled" / "the checklist is ticked" / "the script ran" treated as
  "it works."
- A status update full of activity verbs ("explored", "worked on", "looked into") and no
  outcome.
- Acceptance criteria silently left unmapped.
- Leaving work at ~90% and calling it shipped.

## Why it's seductive

It feels like progress, it's faster, and it avoids the discomfort of saying "not done."
In a compound system it's especially toxic: a fake "done" becomes a Receipt becomes a
memory writeback, poisoning everything downstream.

## The refusal

```txt
No artifact, no progress.
Every acceptance criterion maps to a Receipt, or it is not done.
Two no-evidence loops force a block or a sharpen.
Say "not done yet — here's the blocker" out loud.
```

## Caught by

`/review done`, Charter's Auditor, and Curation refusing to compound a Run without a
Receipt.
