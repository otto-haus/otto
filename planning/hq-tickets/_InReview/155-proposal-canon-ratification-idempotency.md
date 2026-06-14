# 155 - Proposal Canon Ratification Idempotency

Owner: Codex
Priority: P1
Related: 014, 016, 051
Release bucket: v0.1 behavior

## Outcome

Accepting repeated Markdown standard or YAML practice/routine proposals does not append duplicate ratification blocks, `otto_ratified` entries, or ratified guardrails, and proposal-store tests no longer mutate the real `standards/standards/quality.md` canon file.

## Why this matters

Standards, Practices, and Routines are canon. A test that writes ratification blocks into real canon pollutes the source of future behavior, and an accept path that appends the same rationale repeatedly turns curation into noise instead of compounding behavior.

## Scope

- Review the proposal acceptance path for Markdown standard targets.
- Review the proposal acceptance path for YAML practice/routine targets.
- Make Markdown canon application idempotent by proposal marker or already-ratified rationale.
- Make YAML canon application idempotent by proposal id, already-ratified rationale, and existing ratified guardrail.
- Preserve receipt proof that distinguishes a real canon write from an already-reflected proposal.
- Move the standard proposal test onto a temp standard file.
- Add focused duplicate-ratification coverage for Markdown and YAML.

## Out of scope

- Cleaning existing duplicate blocks already present in `standards/standards/quality.md`.
- Changing non-duplicate YAML practice or routine ratification semantics.
- Reworking `CheckCompiler` target mappings.
- Opening a remote PR without Sebastian approval.

## Critique pass - 2026-06-14 Codex

Feature reviewed: Curation proposal accept path for file-backed canon targets.

Design decisions:

- Right: accepting a standard-impacting proposal writes a durable receipt and compiles a check receipt.
- Right: file-backed canon remains the source of behavior, not chat claims.
- Wrong: Markdown targets were unconditionally appended on accept, so retrying or accepting an equivalent proposal added duplicate ratification blocks.
- Wrong: YAML targets were unconditionally appending `otto_ratified` entries and practice/routine guardrails with the same rationale.
- Wrong: the standard proposal unit test targeted the repo's real `standards/standards/quality.md`, causing local tests to mutate canon.
- Right fix: unit tests should use disposable canon fixtures, and canon apply should read before write and return `already_ratified` when the proposed canon text is already reflected.

Docs/best-practice context:

- Context7 Node.js docs confirm `fs.readFileSync(path, 'utf8')` returns file contents as a string and `fs.writeFileSync()` synchronously replaces file contents.
- Context7 `/eemeli/yaml` docs confirm `parse()` maps YAML mappings/sequences to native JavaScript objects/arrays, and `stringify()` serializes native values back to YAML.
- That supports a simple read-before-write idempotency check for local canon files.
- Exa was not available in this session; tool discovery exposed Context7 but no Exa capability.

## Rebuild

- Added `CanonApplyResult` with `applied`, `changed`, and reason data.
- Updated proposal decision receipts to include `canonChanged` and `canonApplyReason`.
- Changed Markdown target application to skip a write when the same proposal marker or normalized rationale is already ratified.
- Changed YAML target application to skip duplicate `otto_ratified` entries by proposal id or normalized rationale.
- Changed practice/routine guardrail application to skip duplicate ratified guardrails by proposal id or normalized rationale.
- Updated acceptance summaries to distinguish applied canon updates from already-reflected canon.
- Changed the standard proposal compile test to use a temp `quality.md` fixture.
- Added duplicate Markdown standard proposal coverage.
- Added duplicate YAML practice proposal coverage.

## Done when

- [x] Standard proposal tests do not reference or write the real `standards/standards/quality.md`.
- [x] First accepted Markdown standard proposal appends one ratification block.
- [x] Second accepted proposal with the same rationale is marked applied without appending a duplicate block.
- [x] First accepted YAML practice proposal appends one `otto_ratified` entry and one ratified guardrail.
- [x] Second accepted YAML practice proposal with the same rationale is marked applied without appending duplicate YAML entries.
- [x] Decision receipt records `canonChanged: false` and `canonApplyReason: already_ratified` for the duplicate case.
- [x] Focused proposal-store tests pass.
- [x] Core and Electron typechecks pass.
- [ ] Independent reviewer +1.
- [ ] PR opened after approval and clean branch review.

## Execution receipt

Repo path: `/Users/seb/Code/otto`

Branch: `ship/functional-labs`

Git status summary:

- Dirty worktree with multiple unrelated in-progress files.
- Ticket-scoped code files: `apps/desktop/electron/proposal-store.ts`, `apps/desktop/electron/proposal-store.test.ts`.
- Ticket receipt file: `planning/hq-tickets/_InReview/155-proposal-canon-ratification-idempotency.md`.
- Existing dirty `standards/standards/quality.md` duplicate-ratification artifact left untouched.

Files changed:

- `apps/desktop/electron/proposal-store.ts`
- `apps/desktop/electron/proposal-store.test.ts`
- `planning/hq-tickets/_InReview/155-proposal-canon-ratification-idempotency.md`

Commands run:

```sh
bun test ./apps/desktop/electron/proposal-store.test.ts
bun run --cwd apps/desktop electron:typecheck
bun run typecheck
rg -n "standards/standards/quality\\.md" apps/desktop/electron/proposal-store.test.ts
git diff --check -- apps/desktop/electron/proposal-store.ts apps/desktop/electron/proposal-store.test.ts
rg -n "[[:blank:]]$" apps/desktop/electron/proposal-store.ts apps/desktop/electron/proposal-store.test.ts planning/hq-tickets/_InReview/155-proposal-canon-ratification-idempotency.md
```

Result: tests/typechecks/tracked diff-check passed on 2026-06-14. The `rg` hostile checks returned no matches, as expected.

Proof mapped to Done when:

- Temp standard fixture proof: `rg -n "standards/standards/quality\\.md" apps/desktop/electron/proposal-store.test.ts` returns no matches.
- Markdown duplicate-ratification proof: `accepting duplicate markdown standard rationale does not append duplicate canon blocks` expects one rationale occurrence, `canonChanged: false`, and `canonApplyReason: already_ratified` on the second accept.
- YAML duplicate-ratification proof: `accepting duplicate yaml practice rationale does not append duplicate ratified entries or guardrails` expects one `otto_ratified` entry, one matching guardrail, `canonChanged: false`, and `canonApplyReason: already_ratified` on the second accept.
- Type proof: `bun run typecheck` and `bun run --cwd apps/desktop electron:typecheck` passed.

Known gaps:

- Independent reviewer +1 pending.
- PR not opened because remote publication is approval-gated and the worktree contains unrelated dirty files.
- Existing duplicate blocks in `standards/standards/quality.md` are not cleaned in this ticket.
