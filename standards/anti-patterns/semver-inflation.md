# Anti-pattern: Semver Inflation

**Violates:** [Earned Semver](../standards/earned-semver.md), [Quality / No Fake Done](../standards/quality.md)

A version number that signals maturity or ship status without the proof bundle that earns it.

## What it looks like

- Branch `ship/v0.3-integration` becomes "we're on v0.3" in docs, demos, or release titles.
- Local tag `v0.3.0` cut from a version bump commit with no Sebastian gate.
- README or marketing copy cites a semver the checklist does not support.
- Skipping GitHub **pre-release** on an integration line to look "more shipped."
- Minor/major bump because volume of merged PRs feels like a milestone.

## Why it's seductive

Bigger numbers feel like momentum. Branch names encode ambition. Tagging is fast; gating is
slow. Outsiders (and future you) read semver as promise.

## The refusal

```txt
Public semver stays on 0.1.x until earned.
Branch names are codenames, not product version.
Patch = Sebastian gate + receipts.
Minor = named milestone in ship-tier-matrix.md — not a merge.
When in doubt: pre-release + honest label, not a higher number.
```

## Related

- [`standards/earned-semver.md`](../standards/earned-semver.md)
- [`RELEASE_CHECKLIST.md`](../../RELEASE_CHECKLIST.md)
