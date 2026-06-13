# Ship Check — Charter

## Spec promise
Charters define the bet: operating contracts for autonomous work with state, gates, ledger, and receipts.

## Required file contract
- [x] Extension command exists: `extension/charter.ts` (433 lines, TypeScript, activate export, /charter + /goal commands)
- [x] Skill exists: `skill/SKILL.md` (complete workflow: propose, approve, status, step, update, receipt, block, audit, sharpen, split, resume, complete, cancel)
- [x] Templates exist: `templates/charter.yaml`, `templates/state.yaml`, `templates/ledger.md`, `templates/approval.yaml`, `templates/charter.md`
- [x] Example charter exists: `examples/example-charter/` with charter.yaml (5 ACs, status: active), charter.md, state.yaml (phase: auditor, completed: S1-S3), ledger.md (4 entries), approvals/publish-otto.yaml (status: approved)
- [~] Runtime spec exists: `docs/runtime-spec.md` (layout, schema, lifecycle complete). **Gap:** Example ACs reference proof paths that don't exist (receipts/propose.txt, receipts/gate-demo.txt, receipts/gate-block.txt missing); AC5.proof = null.

## Required runtime behavior
- [x] Can create/propose: `/charter propose <intent>` returns Compiler prompt to draft charter.md + charter.yaml with stable AC ids
- [x] Can inspect status/state: `/charter status` reads active.json → charter.yaml/state.yaml/ledger.md, answers where/what changed/blocked/next/approvals
- [x] Gates one-way doors: `charter-gates` permission overlay (lines 410-427) classifies events, forces approval on git push/publish/deploy/delete/send/credential changes (20+ BASH_GATES patterns)
- [x] Persists approval records: `approvals/<id>.yaml` schema with time bounds; example: `examples/example-charter/approvals/publish-otto.yaml` (status: approved, decided_at, expires_at)
- [~] Completion requires AC-by-AC receipt proof: `/charter complete` instruction says "map each AC to receipt". **Gap:** Extension delegates Auditor logic to skill, no implementation in charter.ts itself; example AC5.proof remains null.

## Required tests
- [x] Typecheck passes: Extension has strict TypeScript (CommandResult, PermissionEvent types); `bun run typecheck` targets core types
- [~] Manual charter flow documented: `receipts/otto-v01/charter.md` documents install.sh → /reload → /charter propose → step → complete. **Gap:** "No automated test for extension" (receipt line 6); demo README states scenes are "faithful re-enactments, NOT live screen captures."

## Required demo
- [x] `demo/out/otto-v01-charter.mp4` exists (2.4M): Real command names, file paths, specs
- [~] Proves flow, not capture: **Gap:** Demo README line 26 explicitly: "NOT live screen captures"; "Tried + Approved" unchecked

## Required receipt
- [x] `receipts/otto-v01/charter.md`: Maps changes (renamed to Otto, runtime ~/.otto), tests (typecheck exit 0, practice specs validate), manual flow, limitations (not unit-tested, demo is re-enactment), approval status (pending Sebastian)

## Status legend
- [x] Done — evidence path required
- [~] Partial / prototype / proposed — evidence + gap required
- [ ] Not done — missing work required

## Ship decision
Choose one:
- Ship in v0.1 → not recommended (gaps prevent full deployment claim)
- **Ship as Proposed** → RECOMMENDED (spec complete, code complete, unproven in live operation)
- Defer (safe but unnecessary)
- Cut from public claims (unjustified)

---

## Summary assessment

**COMPLETE:** File contract (5 templates + extension + skill + example + spec), TypeScript types, permission overlay, approval records, runtime layout, all documented.

**PARTIAL:** 
1. **Example lacks receipts** — Example charter references 5 ACs but 2 have proof: null; receipts/propose.txt, receipts/gate-demo.txt, receipts/gate-block.txt files don't exist.
2. **No live proven run** — Demo is Remotion re-enactment, not live capture. Extension code untested end-to-end.
3. **Auditor delegated** — AC-by-AC proof checking is in skill workflow, not implemented in extension.
4. **Approval status pending** — Receipt marks "Tried + Approved" unchecked; status is "pending Sebastian."

**TRUTH TEST RESULT:** Can it be run/inspected/proven? Extension is installable and spec is complete, but **no signed proof of a successful end-to-end run exists**. This is a protocol + prototype, not yet a proven operational system.

## Gaps (P0=blocking, P1=important, P2=nice-to-have)

| Severity | Gap |
|----------|-----|
| P1 | Example charter missing receipts/ directory and proof artifacts for all 5 ACs (currently reference null or nonexistent paths) |
| P1 | No live-captured charter run demonstrating full cycle (propose → approve → step → gate block → complete with AC proofs) |
| P1 | Auditor implementation not in extension; AC-by-AC proof checking delegated to skill, untested |
| P2 | Demo is re-enactment, not live screen capture (intentional honesty, but reduces proof confidence) |
| P2 | "Tried + Approved" status in receipt remains unchecked (pending Sebastian signature) |
