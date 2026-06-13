# Ship Check — Tickets

## Spec promise

Tickets are bounded worker slices. Charters define the bet; Tickets define the slice; Workers execute the slice; Receipts prove the slice.

## Required file contract

- [x] `templates/ticket.yaml` exists.
  - **Evidence:** /Users/seb/Code/otto/.letta/worktrees/otto-v01-integration/templates/ticket.yaml
  - **Content:** Machine contract with ticket_id, status (proposed|active|blocked|review|merged|cancelled), owner, model, worktree, branch, objective, why, owned_paths, shared_paths, acceptance_criteria with proof mapping, checks, stop_conditions, requires_approval_for, receipt_path.

- [x] `templates/worker-packet.md` exists.
  - **Evidence:** /Users/seb/Code/otto/.letta/worktrees/otto-v01-integration/templates/worker-packet.md
  - **Content:** Worker-ready template with objective, why, owned/shared paths, constraints, checks, stop conditions, approval gates, receipt requirements.

- [x] `docs/ticketcraft.md` exists.
  - **Evidence:** /Users/seb/Code/otto/.letta/worktrees/otto-v01-integration/docs/ticketcraft.md
  - **Content:** Comprehensive spec covering compiler purpose, ticket structure, relationship to Charter, command surface (/ticket compile|assign|status|review|close), two faces (machine YAML + human markdown).

- [x] Ticket state/lifecycle is documented.
  - **Evidence:** templates/ticket.yaml line 6; docs/ticketcraft.md core line
  - **Content:** State lifecycle: proposed → active → blocked → review → merged → cancelled. Acceptance criteria map to receipt proof.

- [x] Receipt requirement is explicit.
  - **Evidence:** templates/ticket.yaml line 43; templates/worker-packet.md lines 46-48
  - **Content:** receipt_path mandatory in schema. Worker packet: "Write `receipts/<date>/<ticket>.md` … No receipt → no progress."

## Required runtime behavior

- [ ] Can compile a bounded ticket packet, or manual process is documented.
  - **Status:** MISSING — no runtime `/ticket compile` command
  - **Evidence:** No /ticket handler in extension/ (only charter.ts, routine.ts). No ticket compilation in packages/. autonomy.md receipts/otto-v01/ (line 7): "Known limitations: `/ticket` compiler is spec + templates in v0.1."
  - **Gap:** Without runtime, workers cannot be given bounded packets autonomously. Manual workflow not documented.

- [ ] Worker-owned paths and stop conditions are specified.
  - **Status:** SPECIFIED IN TEMPLATES ONLY, NOT ENFORCED
  - **Evidence:** templates/ticket.yaml and templates/worker-packet.md define structure clearly. No runtime code validates boundaries or enforces stop conditions.
  - **Gap:** No path boundary enforcement. No code halts a worker at stop conditions.

- [ ] Completion requires receipt.
  - **Status:** SPECIFIED IN TEMPLATES ONLY, NOT ENFORCED
  - **Evidence:** templates/worker-packet.md line 46: receipt required. No runtime gate prevents merging/completing without proof.
  - **Gap:** No code validates receipt presence before marking ticket complete.

## Required tests/demo

- [ ] If no `/ticket` command exists, mark template/spec only.
  - **Status:** ✓ CONFIRMED TEMPLATE/SPEC ONLY
  - **Evidence:** receipts/otto-v01/autonomy.md: "No automated test (spec + templates). … Known limitations: `/ticket` compiler is spec + templates in v0.1."

- [~] If demo included, label as Ticketcraft under Autonomy and state runtime limitations.
  - **Status:** DEMO IS RE-ENACTMENT (PARTIAL)
  - **Evidence:** demo/src/features.tsx line 186 shows `/ticket compile` in Autonomy feature. Feature marked tested="manual" (line 191). demo/README.md: "Demo terminals are faithful re-enactments, not live captures." otto-v01-autonomy.mp4 is Remotion animation.
  - **Gap:** Demo shows intended workflow (green/yellow/red → ticket compilation); runtime not proven to work. No live /ticket execution captured.

## Status legend

- `[x]` Done — evidence path required
- `[~]` Partial / prototype / proposed — evidence + gap required
- `[ ]` Not done — missing work required

## Ship decision

**Defer**

### Rationale

Tickets (Ticketcraft) in v0.1 is a **spec + template package**, not **shipped runtime**.

**Truth rule:** "If it cannot be run, inspected, proven, and approved, it is not Shipped."

**Why defer:**
1. **No /ticket command.** Spec promises /ticket compile|assign|status|review|close. None implemented as executable Letta Code extensions or CLI commands.
2. **Demo is animation, not execution.** otto-v01-autonomy.mp4 shows the intended workflow; cannot verify the system works end-to-end.
3. **No automated tests.** Zero test coverage for ticket compilation or validation.
4. **Receipt template missing.** autonomy.md references templates/autonomy-receipt.md (line 212); file does not exist.
5. **No runtime enforcement.** Owned paths, stop conditions, receipt gates exist in spec only; no code enforces them.

**Honest acknowledgment:** The spec is sound and well-designed. autonomy.md already states the limitation explicitly. For v0.1, defer until the /ticket compiler is built, tested, and wired to the Letta runtime.

