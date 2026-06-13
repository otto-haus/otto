# Ship Check — Runs and Receipts

## Spec promise

Runs are executions. Receipts are proof. No artifact, no progress. Done requires mapped proof.

## Required file contract

- [x] Run type exists in core.
  - **Evidence:** `/Users/seb/Code/otto/.letta/worktrees/otto-v01-integration/packages/core/src/types.ts` lines 198–218 define `interface Run`

- [x] Receipt type exists in core.
  - **Evidence:** `/packages/core/src/types.ts` lines 224–236 define `interface Receipt`

- [~] Run template exists.
  - **Evidence:** Type defined in types.ts; Routine extension (routine.ts:26) documents RUNS_DIR but no run.yaml template in `/templates/`
  - **Gap:** No schema template artifact

- [x] Receipt template exists.
  - **Evidence:** `/templates/standard-receipt.md` and `/templates/autonomy-receipt.md` exist

- [x] Per-feature release receipts exist.
  - **Evidence:** `/receipts/otto-v01/` contains 10 feature receipts

## Required runtime behavior

- [~] Each shipped feature produces a receipt or documented proof artifact.
  - **Evidence:** All 10 feature receipts in `/receipts/otto-v01/` document what changed, demo, test output, verification, limitations, approval status
  - **Gap:** Receipts document features; no actual Runs created by runtime to hold receipt records

- [~] Completion maps to evidence.
  - **Evidence:** types.ts defines `Run.receipts: Receipt[]` and `AcceptanceCriterion.receipts: Receipt['id'][]`
  - **Gap:** No working example of completed Run mapping receipts to acceptance criteria; mockRuns are disconnected from AC

- [~] Approval gates record decisions.
  - **Evidence:** types.ts defines `GateDecision` and `Run.gate_decisions[]`. Desktop mock shows gate_decisions
  - **Gap:** Gates not enforced; Desktop Curation buttons not wired

- [x] If runtime run creation is manual/file-backed, say so.
  - **Evidence:** CRITICAL: Runs are mock-only in `/apps/desktop/src/mockData.ts` (3 hardcoded Run objects). Extension documents file-backed ~/.otto/runs/ but extensions are Letta prompt launchers, not execution engines. `/receipts/otto-v01/baseline.md`: "no central runtime engine." `/receipts/otto-v01/desktop.md`: "chat is not connected to the runtime"

## Required Desktop surface

- [~] Desktop Receipts surface shows runs/proof/history or clearly marks sample/prototype.
  - **Evidence:** `/apps/desktop/src/surfaces/Panes.tsx` lines 206–234 render Receipts with mockRuns. Settings (lines 275–280): "v0.1 preview reads file-backed state. Live runtime wires through @letta-ai/letta-code-sdk in a later phase... **not yet connected**"
  - **Gap:** Prototype/sample only; runtime not wired

## Required checks

- [x] `receipts/otto-v01/*.md` exist for every shipped/proposed feature.
  - **Evidence:** charter.md, practices.md, routines.md, skills.md, standards.md, autonomy.md, desktop.md, knowledge.md, baseline.md, README.md

- [x] `RELEASE_CHECKLIST.md` links receipts.
  - **Evidence:** Line 39: "Per-feature receipts: [`receipts/otto-v01/`]"

## Status legend

- `[x]` Done — evidence path required
- `[~]` Partial / prototype / proposed — evidence + gap required
- `[ ]` Not done — missing work required

## Truth rule

If it cannot be run, inspected, proven, and approved, it is not Shipped.

## Ship decision

**Defer**

### Rationale

The Runs and Receipts surface fails the core truth rule: "If it cannot be run, inspected, proven, and approved, it is not Shipped."

**Critical blockers:**
1. **No runtime.** Runs are mock data only (mockData.ts). No engine creates, persists, or updates runs. Extension code documents the interface but is not executable.
2. **No connection to reality.** Desktop Receipts surface displays sample runs but is explicitly not wired to the Letta runtime ("not yet connected"). Settings confirms: "Live runtime… wires through @letta-ai/letta-code-sdk in a later phase."
3. **No gate enforcement.** Approval gates are defined in types.ts but not implemented in any runtime layer. Desktop Curation buttons are not wired.
4. **No evidence verification.** No automated tests for run creation, receipt mapping, or completion. Desktop mockRuns have receipts but no connection to acceptance criteria.

**What is ready:**
- Run and Receipt types are well-defined in core.
- Receipt templates exist.
- Per-feature receipts document the build.
- Desktop surface renders correctly and is marked as prototype.

**Verdict:** The contract and design are solid. The runtime is missing. Runs-and-receipts is a proposed surface; defer until a real execution engine exists and gates are enforced.

