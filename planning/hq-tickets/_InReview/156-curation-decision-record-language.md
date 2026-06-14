# 156 - Curation Decision Record Language

Owner: Codex
Priority: P1
Related: 015, 016, 121
Release bucket: v0.1 behavior

## Outcome

The Curation ledger names accepted, rejected, and deferred proposal outcomes as decision records instead of implying every row is an approval or ratification.

## Why this matters

Ticket 016 makes accept, reject, and defer first-class decisions with receipts. The current core type already models `approved | denied | deferred`, but the UI copy and test name called all rows approval or ratification records. That overstates denied/deferred rows and makes the behavior-change ledger harder to trust.

## Scope

- Review the Curation decision/approval ledger language.
- Preserve the existing API shape and finite status values.
- Update visible Curation copy to use decision-record language.
- Update the core type comment to describe the legacy API name honestly.
- Add focused store coverage for applied, rejected, and deferred ledger rows.

## Out of scope

- Renaming IPC channels or public TypeScript interfaces from `approvals` to `decisions`.
- Changing the stored record shape.
- Changing Behavior Changelog filtering; it already uses applied proposals only.
- Opening a remote PR without Sebastian approval.

## Critique pass - 2026-06-14 Codex

Feature reviewed: Curation decision ledger.

Design decisions:

- Right: Curation writes receipts for accept, reject, and defer decisions.
- Right: the ledger preserves a finite `approved | denied | deferred` status union, so denied/deferred decisions can remain visible.
- Right: Behavior Changelog filters to `proposal.status === 'applied'`, so only ratified behavior changes appear there.
- Wrong: the Curation surface called the ledger "ratification records" and "Approvals are records" even though it renders denied and deferred statuses.
- Wrong: the unit test said `listApprovals` derives ratification records from decided proposals, which blurred decision receipts with ratified behavior.
- Right fix: keep the legacy API stable, but tighten the claim boundary in comments, copy, and tests.

Docs/best-practice context:

- Context7 TypeScript docs describe string literal unions as a way to restrict APIs to a finite set of valid string values.
- That supports preserving the existing `approved | denied | deferred` status union instead of dropping denied/deferred rows.
- Exa was not available in this session; tool discovery exposed Context7 but no Exa capability.

## Rebuild

- Updated `ApprovalRecord` comment to say the legacy approval ledger includes approved, denied, and deferred Curation decisions.
- Changed visible Curation copy from ratification/approval language to decision-record language.
- Expanded `listApprovals` coverage to assert applied, rejected, and deferred proposals all produce ledger rows with the correct status and receipt path.

## Done when

- [x] Visible Curation copy no longer calls denied/deferred rows ratification records.
- [x] Core type comment no longer claims every approval row is a ratification receipt.
- [x] Focused test proves applied, rejected, and deferred proposals produce decision ledger rows.
- [x] Focused proposal-store tests pass.
- [x] Core, renderer, and Electron typechecks pass after final edit.
- [ ] Independent reviewer +1.
- [ ] PR opened after approval and clean branch review.

## Execution receipt

Repo path: `/Users/seb/Code/otto`

Branch: `ship/functional-labs`

Git status summary:

- Dirty worktree with multiple unrelated in-progress files.
- Ticket 156 shares `proposal-store.test.ts` and `packages/core/src/types.ts` with earlier uncommitted ticket work.
- Ticket-scoped files: `packages/core/src/types.ts`, `apps/desktop/src/copy/surfaces.ts`, `apps/desktop/electron/proposal-store.test.ts`.
- Ticket receipt file: `planning/hq-tickets/_InReview/156-curation-decision-record-language.md`.

Files changed:

- `packages/core/src/types.ts`
- `apps/desktop/src/copy/surfaces.ts`
- `apps/desktop/electron/proposal-store.test.ts`
- `planning/hq-tickets/_InReview/156-curation-decision-record-language.md`

Commands run:

```sh
bun test ./apps/desktop/electron/proposal-store.test.ts
bun run typecheck
bun run --cwd apps/desktop typecheck
bun run --cwd apps/desktop electron:typecheck
rg -n "ratification records|Approvals are records|approval records|Approval records are ratification|listApprovals derives ratification|Each decision ties proposal, approval" apps/desktop/src/copy/surfaces.ts packages/core/src/types.ts apps/desktop/electron/proposal-store.test.ts
git diff --check -- apps/desktop/electron/proposal-store.test.ts apps/desktop/src/copy/surfaces.ts packages/core/src/types.ts
rg -n "[[:blank:]]$" apps/desktop/electron/proposal-store.test.ts apps/desktop/src/copy/surfaces.ts packages/core/src/types.ts planning/hq-tickets/_InReview/156-curation-decision-record-language.md
```

Result: tests/typechecks/diff-check passed on 2026-06-14. The wording and trailing-whitespace `rg` checks returned no matches, as expected.

Proof mapped to Done when:

- Copy proof: Curation copy now uses `decision records`, `Curation decisions are records`, and `proposal, outcome, and receipt`.
- Type comment proof: `ApprovalRecord` comment names the legacy approval ledger and the included statuses.
- Store proof: `listApprovals derives decision records from applied rejected and deferred proposals` asserts `approved`, `denied`, and `deferred` rows, plus temp receipt paths.

Known gaps:

- Independent reviewer +1 pending; a read-only Judge subagent was launched but timed out and was shut down before returning a verdict.
- PR not opened because remote publication is approval-gated and the worktree contains unrelated dirty files.
