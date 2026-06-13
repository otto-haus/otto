# Decision Grade — No Fake Done blocks the Standards v0 build

```yaml
date: 2026-06-13
slug: no-fake-done-blocks-standards-v0
standards: [quality, candor-kindness]
outcome: blocked
status: open
revisit: 2026-07-13
```

## Decision

The Standards v0 build had produced the full canon: `registry.yaml`, six Standards, the
Horowitz canon note, four anti-patterns, the Precedent template + one real precedent, and
all stack wiring. Every spec-writing acceptance criterion was satisfied. The tempting move
was to mark the build **done**.

But the ticket's acceptance criteria included two that spec-writing alone cannot satisfy:

```txt
v0 #9 — One real run demonstrates a Standard biting.
AC 13 — One real loop proves a Standard can block or redirect work.
```

The [Quality / No Fake Done](../../standards/quality.md) Standard demands: every
acceptance criterion mapped to a receipt; **any unmapped criterion => not done.** AC13 had
no receipt. So the honest classification was **not done**, even though everything *written*
was complete.

## Standard(s) at play

- **Quality / No Fake Done** bit first: it refused to let "spec written" count as "done"
  while AC13 had no proof. Per its rule, an unmapped criterion forces a block/sharpen, not
  a confident completion.
- **Candor + Kindness** bit second: the candid move was to say "not done yet — AC13 is
  unproven" out loud rather than quietly rounding up. (Tie-breaker applied: truth in
  substance — see precedent `2026-06-13-candor-vs-kindness`.)

## What it cost / changed

It cost a triumphant "done." The build had to **stop and manufacture real proof** instead
of declaring victory:

- AC13 is now satisfied *by this very artifact* — a real decision where a Standard blocked
  premature completion and redirected the work to producing evidence.
- The Candor↔Kindness Precedent was written from the same moment rather than invented.

This self-referential loop is the cheapest honest way to prove the Standard bites: the
Standard changed what the build did, in this build.

## Evidence

- This file (the redirect, recorded).
- `standards/precedents/2026-06-13-candor-vs-kindness.md` — the tie-breaker case produced
  by the same redirect.
- `standards/standards/quality.md` — the Standard whose rule forced the block.

## Grade

Open. Revisit 2026-07-13: did treating an unproven acceptance criterion as "not done"
prove correct, or was it ceremony? (Watch for the
[ceremony-without-signal](../../anti-patterns/ceremony-without-signal.md) overcorrection —
a Standard biting on a genuinely trivial, reversible item would be noise, not rigor.)
