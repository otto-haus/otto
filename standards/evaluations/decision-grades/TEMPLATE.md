# Decision Grade — <short title>

<!--
A decision grade records a real decision and grades it against Standards over time.
Save as standards/evaluations/decision-grades/<date>-<slug>.md. This is where a Standard
"biting" (blocking or redirecting work) gets proven, not asserted.
-->

```yaml
date: <YYYY-MM-DD>
slug: <kebab-slug>
standards: [<slug>, ...]      # Standards this decision was tested against
outcome: <blocked | redirected | proceeded>
status: <open | graded>
revisit: <YYYY-MM-DD>
```

## Decision

What was about to happen, and what was decided instead?

## Standard(s) at play

Which Standard bit, and what did it demand?

## What it cost / changed

What did honoring the Standard cost (time, scope, comfort)? A Standard that cost nothing
didn't bite.

## Evidence

- receipt / artifact / link proving the redirect was real

## Grade

Was honoring the Standard the right call? (filled in at `revisit`)
