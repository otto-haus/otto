# Ship Check — Autonomy

## Spec promise

Autonomy defines what Otto may own without Sebastian in the loop: ticket orchestration, worker management, worktrees, retries, checks, and safe integration steps.

## Required file contract

- [x] `docs/autonomy.md` exists.
  - Evidence: `docs/autonomy.md` (271 lines, complete doctrine + model)

- [x] Safe/unsafe action taxonomy exists.
  - Evidence: `docs/autonomy.md` lines 62–88 ("What Autonomy may do without asking" / "What must escalate to Approvals")
  - Taxonomy: GREEN (reversible local) / YELLOW (one-time prompt) / RED (explicit approval) defined in `sampleData.ts` and `Panes.tsx`

- [x] Worktree policy exists.
  - Evidence: `docs/autonomy.md` lines 143–158; rules documented (one worktree per ticket, never dirty main, owned paths only, shared-contract coordination)

- [x] Merge policy exists.
  - Evidence: `docs/autonomy.md` lines 122–141; conservative start ("Opening PR: autonomous / Merging PR: approval required"); future `safe-auto-merge` criteria defined

- [x] Autonomy settings schema/template exists.
  - Evidence: `docs/autonomy.md` lines 179–195; template shows `autonomy:` config with 10 knobs (worker_creation, safe_auto_merge, require_receipts, etc.)

- [x] Autonomy receipt template exists.
  - Evidence: `templates/autonomy-receipt.md` (35 lines, covers ticket/worker/model/worktree/branch/time/objective/actions/checks/files/approvals/result/next-action)

## Required runtime behavior

- [~] Reversible work can proceed without asking.
  - Evidence: `docs/autonomy.md` lines 62–74 documents the policy (create worktrees, assign tickets, run tests, retry checks, clean stale worktrees, update receipts)
  - Gap: Implemented as doctrine + templates, not active runtime behavior. `/ticket compile` is proposed (shown in demo/features.tsx line 186) but is spec + templates only in v0.1 (per receipt line 7: "no end-to-end multi-worker orchestration captured").

- [~] Consequential doors escalate.
  - Evidence: `docs/autonomy.md` lines 76–94 documents escalation list (send/post/publish, spend, deploy, merge protected main, delete, credential change, etc.)
  - Evidence: `docs/gates.md` defines the `charter-gates` overlay with 8 gated classes (send/post/publish, deploy, merge, delete, credential, external write, custom/MCP tools)
  - Gap: Gates are implemented in Charter extension (`extension/charter.ts`), not yet in Autonomy/Ticketcraft runtime. Autonomy escalations are documented, not yet automated for multi-worker flows.

- [x] Autonomy failures can be logged for Curation.
  - Evidence: `docs/autonomy.md` lines 216–230 define failure pattern schema (type, question_asked, why_otto_should_have_owned_it, fix) and state they flow to Curation as proposals

- [~] Worker orchestration is at least documented and used manually if not automated.
  - Evidence: `docs/autonomy.md` lines 96–110 and lines 40–57 document the worker model and desired workflow (9 steps: create/update Charter → decompose → workers → worktrees → packets → monitor → retry → receipts → integrate)
  - Evidence: `templates/worker-packet.md` provides the bounded execution packet template
  - Gap: Documentation is complete, but worker orchestration is manual/proposed in v0.1. No automated multi-worker dispatch, coordination, or result aggregation. Ticketcraft (`/ticket compile`, `/ticket assign`, `/ticket status`, `/ticket review`) is proposed UI in demo but not yet implemented as a skill.

## Required Desktop surface

- [x] Desktop Autonomy surface shows ownership boundaries and escalation rules.
  - Evidence: `apps/desktop/src/surfaces/Panes.tsx` lines 236–260
  - Displays: "three-zone model" (GREEN/YELLOW/RED tabs with examples) + Ticketcraft description
  - Sample data: `sampleData.ts` lines 87–92 define autonomyZones with cls ('g'/'y'/'r'), label, and examples
  - Build verified: `bun run build` → vite ok (23 modules), typecheck → exit 0

## Required demo

- [x] `demo/out/otto-v01-autonomy-ticketcraft.mp4` shows ticket/worktree/receipt policy.
  - Evidence: `demo/out/otto-v01-autonomy.mp4` exists (1.7M, ISO Media MP4)
  - Demo content (from `demo/src/features.tsx` lines 172–193): shows `cat docs/autonomy.md` (three zones), `/ticket compile`, Ticketcraft flow, and receipt proof model
  - Note: Demo is a Remotion-rendered animation showing the spec + workflow, not a live runtime execution

## Required receipt

- [x] `receipts/otto-v01/autonomy.md` states docs/templates vs runtime status.
  - Evidence: `receipts/otto-v01/autonomy.md` (9 lines)
  - States: docs/ticketcraft/worker-packet swept to Otto; demo exists; spec + templates complete; "/ticket compiler is spec + templates in v0.1; no end-to-end multi-worker orchestration captured"
  - Approval status: pending Sebastian

## Status legend

- `[x]` Done — evidence path provided
- `[~]` Partial / prototype / proposed — evidence + gap provided
- `[ ]` Not done — missing work required

## Summary

**File contract:** DONE (6/6)
- All docs, templates, and schemas exist and are well-integrated into the charter-gates overlay

**Runtime behavior:** PARTIAL (1 done, 3 partial)
- Doctrine + escalation rules are complete and documented
- Worker orchestration is documented but not automated; `/ticket` compiler is proposed UI, not implemented
- Safe-auto-merge criteria are defined but not active

**Desktop surface:** DONE
- Three-zone model renders correctly with real sample data
- Autonomy pane wired to Panes.tsx and renders in the workspace

**Demo:** DONE
- `otto-v01-autonomy.mp4` exists and covers the spec + policy + workflow
- Demonstrates Ticketcraft flow and receipt model

**Receipt:** DONE
- Explicit about what's spec/template vs runtime
- Acknowledges gap: "no end-to-end multi-worker orchestration captured"

**Overall:** PARTIAL
- Autonomy doctrine, taxonomy, policies, and templates are SHIPPED (built, tested, demoed, documented)
- Multi-worker orchestration and `/ticket` runtime behavior are PROPOSED (documented, UI mocked, not automated)
- The core autonomy judgment layer (reversible/consequential gate) is complete; the worker dispatch layer is not

## Ship decision

**Defer**

### Rationale

Autonomy in v0.1 ships the DOCTRINE (what Otto owns without asking), TAXONOMY (green/yellow/red zones), and POLICY TEMPLATE (worktrees, merge, receipts, failure patterns). These are proven in docs, templates, and the Desktop UI.

However, the RUNTIME ORCHESTRATION — the actual `/ticket compile` → worker dispatch → orchestration → receipt aggregation loop — is incomplete. The spec exists, the templates exist, and the UI mock exists, but no multi-worker execution, coordination, or state management is active. This is a critical gap: autonomy's value is in *automated* orchestration, not just well-documented boundaries.

Recommendation: Defer worker orchestration to v0.2. Ship in v0.1 what you have: doctrine + policy + Desktop surface. Do NOT claim multi-worker autonomy is live. The receipts/otto-v01/autonomy.md receipt already states this clearly.


