# Anti-pattern: Vague Approval

**Violates:** [Candor + Kindness](../standards/candor-kindness.md) — the kindness-without-candor collapse — and [Judgment](../standards/judgment.md)

Soft, non-committal sign-off that avoids both a real decision and a real critique.

## What it looks like

- "Looks good!" / "LGTM" / "seems fine" with no evidence reviewed.
- Approving to avoid conflict, then disagreeing later in private.
- Withholding a real objection because raising it is uncomfortable.
- A gate "passed" without naming what was actually checked.
- Rounding uncertainty up to a yes.

## Why it's seductive

It keeps things pleasant and fast, avoids confrontation, and offloads accountability — if
it goes wrong, "well, I never really said yes."

## The refusal

```txt
Approve on evidence, or don't approve.
Name what you checked and what you didn't.
If you disagree, say so now — silent dissent that ships is a violation.
A yes is a decision you own and can be graded on.
```

This is the inverse of [harsh-candor](harsh-candor.md): one avoids the truth to be nice,
the other weaponizes it. Both fail the Candor + Kindness pair.

## Caught by

`/review` (claim → evidence, pass/fail recommendation) and `/decision` (owned,
recordable calls).
