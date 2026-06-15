# Working agreement: batch and ship cadence

How we run otto work so the pile doesn't grow faster than it lands.

## The rhythm

Work in **small batches, then drain to merged before the next batch**:

1. ~10–15 messages of work (fixes, polish, a feature).
2. **Pause.** Stop taking new feature scope.
3. **Converge** the in-flight branches into a small number of review-ready PRs (a release-captain collects finished branches, rebases on current `main`, resolves conflicts, runs the full verify suite, opens the PRs).
4. **Sebastian merges** (the gate).
5. **Next batch branches off the freshly-merged `main`** — not the old base.

"Shipped" means **merged**, not "PR open." If the next batch starts while the last one is still in open PRs, we're back to stale bases and conflicts.

## Why

The failure mode is a pileup of branches all editing the same hot files (`Chat.tsx`, `styles.css`, the transport layer). It produces: merge-conflict churn, stale bases, fixes that appear not to "take" because they live on unmerged branches, and dev-app thrash from switching checkouts. Draining between batches removes all of it.

## PR grouping

- **Small, themed, independently-reviewable PRs.** Never one mega-PR.
- **Don't couple risk classes.** A one-way-door / canon / license-gated change (e.g. bundling a runtime) never rides with CSS polish or a bug fix — if one piece is wrong, the whole thing stalls at the gate. Isolate those into their own PR.
- Example split: `PR-A` UI polish + dev-loop (low risk); `PR-B` chat reliability (coordinates with its base PR); `PR-C` the big/gated change, draft until the gate clears.

## The bottleneck is the merge gate

Sebastian is the merge / one-way-door gate, so **his review throughput is the limit**. The lever is to keep each batch to a few small PRs that are fast to review — not to maximize work-in-flight.

## Gates that never get bypassed

- Merge to `main`, release/visibility/license changes: Sebastian only.
- License/redistribution for anything we ship: confirmed-allowed before implementation merges.
- No claiming done without verification (typecheck / test / staging build).
