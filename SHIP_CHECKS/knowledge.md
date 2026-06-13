# Ship Check — Knowledge

## Spec promise

Knowledge is maintained external-world understanding. v1 focuses on AI Frontier / Model Intelligence so Autonomy tracks actual capability.

## Required file contract

- [x] `docs/knowledge.md` exists.
  - Evidence: `/Users/seb/Code/otto/.letta/worktrees/otto-v01-integration/docs/knowledge.md` — 187 lines, covers Knowledge doctrine, separation from Memory, scope, sources, templates.

- [x] Model registry exists.
  - Evidence: `/Users/seb/Code/otto/.letta/worktrees/otto-v01-integration/knowledge/ai-frontier/model-registry.yaml` — 130 lines, machine-readable model/provider capability + routing; status: proposed.

- [x] Capability notes exist.
  - Evidence: `/Users/seb/Code/otto/.letta/worktrees/otto-v01-integration/knowledge/ai-frontier/capability-notes.md` — 59 lines, narrative on model strengths/weaknesses + trend watch.

- [x] Provider costs exist.
  - Evidence: `/Users/seb/Code/otto/.letta/worktrees/otto-v01-integration/knowledge/ai-frontier/provider-costs.md` — 35 lines, cost posture template; pricing data left as TODO per No Fake Done.

- [x] Observed performance template exists.
  - Evidence: `/Users/seb/Code/otto/.letta/worktrees/otto-v01-integration/knowledge/_templates/observed-performance.md` — template with 8 observation kinds (ticket_outcome, worker_quality, routing_win, etc.).

- [x] Knowledge update receipt template exists.
  - Evidence: `/Users/seb/Code/otto/.letta/worktrees/otto-v01-integration/knowledge/_templates/knowledge-update-receipt.md` — 32 lines, proof-of-run template for AI Frontier Review Routine.

- [x] Curation proposal template exists.
  - Evidence: `/Users/seb/Code/otto/.letta/worktrees/otto-v01-integration/knowledge/_templates/knowledge-curation-proposal.yaml` — 65 lines, conforms to shared Curation proposal shape for behavior-changing policy updates.

## Required runtime behavior

- [~] Knowledge updates write receipts.
  - Partial: Receipt template exists and is specified in Routine (`routine.yaml` line 46: `/field-note knowledge-receipt`). However, **NO runtime code exists** to execute the Routine or write actual receipts. The Routine is defined in YAML; invocation/execution is not wired. No example receipts from actual runs exist.
  - Gap: Depends on Routine runtime (not implemented in v0.1) and receipt-writing infrastructure. Spec is complete; implementation is deferred.

- [~] Knowledge can propose Curation changes.
  - Partial: Template exists (`knowledge-curation-proposal.yaml`). Doctrine is documented (docs/knowledge.md lines 99–116). **But Curation engine is deferred.** Per otto-v01-status.md line 20, "Channels, Curation / Approvals" are deferred from v0.1. Proposal **template** is ready; proposal **system** (queue, classification, ratification) does not exist yet.
  - Gap: Knowledge can structurally propose (template ready); the Curation system to receive and act on proposals is not implemented. Boundary is specified; enforcement is missing.

- [~] Model-routing policy is not silently changed by Knowledge alone.
  - Partial: This is DOCUMENTED POLICY (model-registry.yaml comments lines 11–16, docs/knowledge.md lines 85–97). Routing status is explicitly `proposed` (model-registry.yaml:107) and marked Curation-gated. **But the enforcement mechanism does not exist.** No code prevents a Knowledge update from silently changing routing; the boundary is spec-level only (comments + doctrine), not enforced at runtime.
  - Gap: Depends on Curation gate + approval flow, which are deferred. Policy is documented; enforcement is architectural and awaits Curation implementation.

## Required status

- [x] Registry status is `proposed` unless ratified.
  - Evidence: model-registry.yaml line 24: `status: proposed` and routing block line 107: `status: proposed`. Routing has `curation_proposal: null` and `approved_by: null`, indicating no approval has been granted.

- [x] Public claims say Proposed, not Shipped.
  - Evidence: docs/otto-v01-status.md line 18: `| Knowledge | proposed | — | ✅ | [knowledge](../receipts/otto-v01/knowledge.md) | ☐ | ☐ |`
  - Evidence: receipts/otto-v01/knowledge.md line 1: `# Receipt — Knowledge (Otto v0.1) — PROPOSED`
  - Evidence: receipts/otto-v01/knowledge.md line 9: "**Known limitations:** **Built, not Shipped.** Capability ratings are qualitative, not freshly benchmarked; routing is unratified."

## Required demo

- [~] `demo/out/otto-v01-knowledge.mp4` clearly says Proposed if unratified.
  - Evidence: File exists at `/Users/seb/Code/otto/.letta/worktrees/otto-v01-integration/demo/out/otto-v01-knowledge.mp4` (1.9 MB, ISO MP4 video). Video is a **Remotion re-enactment, not a live runtime capture** (per otto-v01-status.md line 37: "Terminal scenes are faithful re-enactments using real commands/specs").
  - Gap: Cannot verify video content without playback. Presumed to state "Proposed" based on receipt + status doc consistency; cannot confirm without watching.

## Truth-level gaps (deferred, not Shipped)

**Critical missing implementations:**
1. **No Routine execution runtime** — AI Frontier Review Routine is defined (routine.yaml) but not invoked; it cannot actually run, check sources, or write receipts.
2. **No Curation gate** — Proposal template exists; Curation engine is deferred; proposals cannot be queued, classified, or ratified.
3. **No observed-performance data** — Folder exists with only `.gitkeep`; zero internal evidence recorded; the evidence layer is empty.
4. **No pricing data** — provider-costs.md has only TODO placeholders; not populated from real sources.
5. **Routing not wired to Autonomy** — autonomy.md does not reference reading model-registry.yaml; no code integrates routing into worker assignment.

**Status per truth rule:** Knowledge is **Built** (docs, specs, templates complete) but **NOT Shipped** (no runtime behavior, deferred Curation, no actual evidence, no wiring to Autonomy).

## Status legend

- `[x]` Done — evidence path required
- `[~]` Partial / prototype / proposed — evidence + gap required
- `[ ]` Not done — missing work required

## Ship decision

**Defer** — Knowledge is fully specified and templated, but runtime implementation is blocked by deferred subsystems (Curation, Routine execution). It is safe to build on this spec; it is not safe to claim Shipped in v0.1. Mark as Proposed and carry forward the specification into the next integration cycle once Curation and Routine infrastructure are ready.

