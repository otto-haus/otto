# Ship Check — Approvals

## Spec promise

Approvals are not a peer subsystem. Approval is the human-ratification record Curation emits when a proposal is consequential.

## Required file contract

- [x] Approval type exists in core.
  - Evidence: `packages/core/src/types.ts` lines 247-259 define `Approval` interface with required fields: `id`, `requested_action`, `scope`, `requirement`, `evidence_required`, `requested_at`, `expires_at`, `status`, `decided_by`, `decided_at`.
  - ApprovalStatus enum defined at line 49: `'pending' | 'approved' | 'denied' | 'expired'`

- [x] Approval template exists.
  - Evidence: `templates/approval.yaml` — canonical YAML template with all required fields.

- [x] Fields include scope, requirement, evidence, status, expiration.
  - Evidence: Template and type definition both include: `scope`, `requirement` (ApprovalRequirement enum), `evidence_required`, `status` (lifecycle), `expires_at` (time-bound).

- [x] Status lifecycle exists: pending → approved / denied / expired.
  - Evidence: `packages/core/src/types.ts` line 49 defines `ApprovalStatus = 'pending' | 'approved' | 'denied' | 'expired'`. Example at `/examples/example-charter/approvals/publish-otto.yaml` shows lifecycle usage (`status: approved`, `decided_at` timestamp).

## Required runtime behavior

- [~] Gate checks approved/unexpired/in-scope before acting.
  - Evidence: `extension/charter.ts` lines 410–427 register a `charter-gates` permission overlay that fires on `phase: "approval"` and classifies one-way doors (publish, deploy, delete, send, merge, credential changes). When a gate is detected, it returns `{ decision: "ask", reason: ... }`. 
  - **Gap:** The gate logic does NOT currently check approval records by id, scope, expiry, or status before blocking/allowing. It forces a prompt but does not read/validate actual persisted Approval objects. This is documented in `docs/gates.md` lines 23–40 as the design pattern (persist + check + act), but the check logic is not yet implemented in extension code.

- [~] Chat approval alone is insufficient; approval is persisted.
  - Evidence: `skill/SKILL.md` lines 186–199 document the requirement: "Chat approval is not enough — persist it. `approvals/<id>.yaml`..." and the template at `/templates/approval.yaml` is ready. Example at `/examples/example-charter/approvals/publish-otto.yaml` shows persisted record. `docs/architecture.md` line 59 states "Each approval is persisted as a scoped, time-bound record under `approvals/`."
  - **Gap:** The skill documentation describes writing approvals but no runtime code in `packages/`, `extension/`, or `practices/` implementations shows actual creation/writing of approval YAML files during gate execution. Charter workflow skill is documented but execution is not wired — approvals/ directory is created empty by design in `/charter approve` but populated only manually (example shows hand-written publish-otto.yaml).

- [ ] Approval records are emitted by Curation or gates.
  - Evidence: Approval *type* is defined and Curation/gates are designed to emit them, BUT:
    - **Curation is deferred from v0.1:** `/RELEASE_CHECKLIST.md` line 23 states `Curation / Approvals | deferred¹` with note `(¹Approval is a core type)`.
    - **Gates do not yet emit Approval records:** The `charter-gates` overlay in `extension/charter.ts` forces a prompt (returns `ask`) but does not write an approval record. The `/charter block` and `/charter step` documented workflows mention writing records when gates fire (`skill/SKILL.md` line 184 says "When a gate fires... Write an **approval record** and ask") but there is no runtime code that does this.
  - **Status:** Gates are partially wired (permission overlay detects); approval creation is designed (template + type exist) but not automated (requires human skill execution or future Curation engine).

## Required Desktop surface

- [~] Pending approvals appear in Curation or appropriate surface.
  - Evidence: `/apps/desktop/src/surfaces/Panes.tsx` has a `Curation` pane that renders `mockApprovals` (from `/mockData.ts` lines 58–79). The pane shows `requested_action`, `status`, `scope`, `requirement`, `evidence_required` in card layout with status pill.
  - **Gap:** Desktop Curation pane is a **prototype** displaying mock data, not wired to runtime. Mock approvals are hardcoded in `mockData.ts`; there is no code that reads actual approval records from the file system or a persistent store. Pane is functional for UI preview but not connected to live flows.

- [ ] Approve/Deny controls are honest: wired if interactive, disabled/prototype if not.
  - Evidence: The Panes.tsx `Curation` component displays approval cards but does NOT render approve/deny buttons. The mock data is read-only display. No interactive control exists on the desktop surface.
  - **Status:** Approvals UI is a prototype view only; no interactive approve/deny wiring on desktop. According to truth rules, this is NOT shipped (prototype-only, no live flow).

## Required demo

- [ ] Demo only if approval record flow exists. Otherwise show as deferred/partial.
  - Evidence: `/RELEASE_CHECKLIST.md` line 23 shows `Curation / Approvals | deferred`. The otto-v01-status.md line 20 lists "Deferred from v0.1: **Channels**, **Curation / Approvals**." There are no demos for approval creation, gating, or ratification in `/demo/` (demos cover Charter, Practices, Routines, Skills, Standards, Autonomy, Desktop, Knowledge — not Approvals/Curation).
  - **Status:** No demo exists; feature is deferred.

## Status legend

- `[x]` Done — evidence path required
- `[~]` Partial / prototype / proposed — evidence + gap required
- `[ ]` Not done — missing work required

## Ship decision

**DEFER from v0.1**

### Rationale

The Approval type is **fully defined** in core (contract complete, template ready, example persisted). However, **runtime behavior is incomplete and not central to v0.1 shipped features:**

1. **Gates are partial:** Charter gates overlay detects one-way doors and forces approval prompts (via Letta permissions), but does NOT read/validate persisted Approval records by status/expiry/scope. The gate says "ask" but doesn't check "was it already approved?"

2. **Curation engine is deferred:** The spec says Curation should emit Approvals for consequential proposals. Curation itself is explicitly deferred from v0.1 (`RELEASE_CHECKLIST.md` line 23). Without Curation, there is no central engine creating Approval records in response to proposals.

3. **Skill workflow is documented but not automated:** The Charter skill's `/charter block` and `/charter step` are designed to write approval records on gate fire, but the actual file-write logic is not implemented. Approval records in the example charter were hand-written for demonstration.

4. **Desktop is prototype-only:** Approvals UI on desktop renders mock data; there is no wiring to runtime or interactive approve/deny controls. Per truth rules, prototype-only is NOT shipped.

5. **No demos:** Approvals have no demo videos; feature is explicitly deferred in release checklist.

### Recommendation

- **Ship core type only (no claim):** Keep the Approval interface in types.ts for future extensibility and to unblock Charter's approval-gate design.
- **Defer runtime (gates + Curation):** Push gate-record validation and Curation-driven approval creation to v0.2 or v1.0.
- **Update public claims:** Do not claim Approvals are shipped in v0.1. Reference them as a designed-but-deferred subsystem in release notes.

## Truth rule

If it cannot be run, inspected, proven, and approved, it is not Shipped.

**Approvals type:** ✅ Inspectable, defined, ready  
**Approvals runtime (gates reading/validating):** ❌ Not implemented  
**Approvals emitted by Curation:** ❌ Curation deferred  
**Approvals desktop surface:** ❌ Prototype/mock only  
**Approvals demo:** ❌ Does not exist  

**Verdict:** Type is done; shipped behavior is not. Defer from public v0.1 claim.
