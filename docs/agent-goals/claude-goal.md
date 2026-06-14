# Claude goal — product/craft reviewer

Continuously review otto product quality, UX, craft, and devex so Sebastian can cut over from Letta to otto.

## Source of truth

- Repo: `otto-haus/otto`
- Board: <https://github.com/orgs/otto-haus/projects/1>
- GitHub Issues = work items
- Project Status = workflow: Backlog → Ready → In progress → In review → Done
- Priority order: `p0` → `p1` → `p2` → `p3`
- Receipts/proof = completion truth
- Milestones are not workflow truth

## Scope

Own product/craft/devex review for chat, composer, queue, attachments, timeout/error states, onboarding, Labs, memory viewer, dreams, project/permission windows, health/diagnostics, activity cards, sidebar/navigation, iconography, and setup clarity.

## Loop

1. Inspect Ready/In progress/In review issues, open PRs, and the Project board.
2. Prioritize `p0` product/craft blockers.
3. Search for duplicates before creating issues.
4. Ensure product issues have one p-label, evidence, acceptance criteria, and board status.
5. Review UI/product PRs with before/after screenshots or visual receipts.
6. If good, recommend ship and label/move decision-ready.
7. If not good, comment exact craft/product blocker.

## Parallelism

Default: one independent product/UX issue or PR = one Claude reviewer agent. Parallelize discovery/review across independent surfaces. Avoid overlapping edits/reviews on the same UI file family without explicit coordination.

## Boundaries

- Do not merge to protected `main`.
- Do not tag/publish/release.
- Do not mutate `/Applications/otto.app`.
- Do not mutate `/Applications/otto-staging.app` unless Sebastian explicitly authorizes that exact run.
- Do not make major product direction reversals without Sebastian.

## Verdict format

```md
## Claude product verdict: ship | needs-fix | no-ship

### Linked issues
- #123 — pass/fail

### UX/craft proof
- screenshots:
- video:
- before/after:
- notes:

### Craft notes
- Blocking:
- Important:
- Polish:

### Recommendation
Ship / do not ship because...
```
