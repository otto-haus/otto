# Ship Check — Curation

## Spec promise

Curation is the shared proposal-and-ratification engine. It decides what compounds across memory, Charters, Practices, Routines, Channels, Standards, Skills, Knowledge, and external actions.

## Required file contract

- [ ] Central Curation proposal schema exists.
  - **Evidence:** packages/core/src/types.ts — NO CurationProposal, ProposalClassification, or related types defined. Only Approval, Run, Receipt, Charter, Practice, Routine, Channel, StandardRow exist.

- [ ] Queue location exists.
  - **Evidence:** No `curation/`, `proposals/`, or similar directory structure exists at runtime level. Knowledge proposal template at knowledge/_templates/knowledge-curation-proposal.yaml is documentation-only. No live proposal store.

- [ ] Proposal lifecycle exists.
  - **Evidence:** docs/knowledge.md lines 99-116 describe the desired workflow (propose → classify → ratify) but no code implements create, classify, apply, or archive operations.

- [ ] Classification policy exists: risk, reversibility, identity impact, consequence.
  - **Evidence:** knowledge/_templates/knowledge-curation-proposal.yaml lines 36-40 show a template with risk/reversibility/identity_impact fields, but no runtime engine to classify proposals against these policies.

- [ ] Ratification policy exists.
  - **Evidence:** docs/standards.md lines 8-16 state "Sebastian ratifies Standards" and "Curation does NOT ratify Standards changes." knowledge/_templates/knowledge-curation-proposal.yaml lines 44-51 include a `ratification` section in the template, but no runtime code enforces or tracks ratification decisions.

## Required runtime behavior

- [ ] Can create a proposal.
  - **Evidence:** No TypeScript function, CLI command, or Letta extension implements proposal creation. The /routine propose command in extension/routine.ts drafts Routine *specs* (status: proposed), not Curation proposals.

- [ ] Can classify a proposal.
  - **Evidence:** No classification engine exists. docs/knowledge.md describes when classification should happen, but the actual decide-safe-or-consequential logic is absent.

- [ ] Safe/reversible proposals can be auto-applied if allowed.
  - **Evidence:** No auto-apply logic in codebase. All feature-flag/policy updates are manual edits to YAML (e.g., knowledge/ai-frontier/model-registry.yaml) or require explicit approval.

- [ ] Consequential proposals emit Approval records.
  - **Evidence:** Approvals exist as a core type in packages/core/src/types.ts (lines 247-259), used for Practice gates and Routine activation. But no code routes Curation proposals to the Approval system.

- [ ] Standards changes always require Sebastian ratification.
  - **Evidence:** docs/standards.md encodes the rule; no enforcement in code. Standards files are in standards/ but no lock, audit, or ratification gate protects them.

## Required Desktop surface

- [ ] Desktop Curation surface shows pending proposals and approval-required items.
  - **Evidence: [~] PARTIAL / PROTOTYPE ONLY**
    - **What exists:** apps/desktop/src/surfaces/Panes.tsx lines 262-278 render a `<Curation>` component.
    - **What it shows:** Mock approvals only (hardcoded in apps/desktop/src/mockData.ts lines 58-79).
    - **What's NOT wired:** Buttons are read-only placeholders. No live proposal queue. No actual data source.
    - **Status per receipt:** receipts/otto-v01/desktop.md line 19 states "Curation queue, Receipts, Autonomy zones, Settings. Sidebar navigation and surface switching are interactive; action buttons (Approve / Deny / Send) are not yet wired."
    - **Gap:** Desktop surface is a prototype visualization, not connected to any runtime Curation engine.

## Required tests

- [ ] Proposal classification test or documented manual flow.
  - **Evidence:** No tests for Curation in packages (only Charter, Practices, Routines have tests). No test files in `test/` directories reference `curation` or `proposal`. Manual flow is described in docs but not scripted or verifiable.

## Required demo

- [ ] Demo only if actual proposal flow exists. Otherwise mark Deferred/Partial.
  - **Evidence:** RELEASE_CHECKLIST.md line 23 marks Curation/Approvals as **"deferred"** from v0.1. No demo video in demo/out/ for Curation workflow. `receipts/otto-v01/baseline.md` line 17 explicitly states "Curation / Approvals / Channels / worker orchestration: spec + templates, no central runtime engine."

## Likely v0.1 decision

If central engine is not implemented: Defer or mark Partial. Do not claim shipped.

## Status legend

- `[x]` Done — evidence path required
- `[~]` Partial / prototype / proposed — evidence + gap required
- `[ ]` Not done — missing work required

## Ship decision

**Cut from public claims** — Curation is not ready for v0.1. There is no central runtime engine, no proposal queue, no classification or ratification logic, and no tests. The spec is documented; templates exist; the Desktop shows a UI mockup. But truth rules say: "If it cannot be run, inspected, proven, and approved locally, it is NOT Shipped." Curation fails all runtime criteria.

Per RELEASE_CHECKLIST.md: already marked as **deferred**.

## Truth rule

If it cannot be run, inspected, proven, and approved, it is not Shipped.
