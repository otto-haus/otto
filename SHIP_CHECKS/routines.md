# Ship Check — Routines

## Spec promise

Routines are repeated bundles of Practices. Recurring routines require approval because attention is a one-way door.

## Required file contract

- [x] Routine type exists in core contract. **/Users/seb/Code/otto/.letta/worktrees/otto-v01-integration/packages/core/src/types.ts (L146-175)** — `Routine`, `RoutineStep`, `RoutineStatus` fully defined; matches all field requirements.
- [x] Routine specs exist under `routines/*/routine.yaml`. **/Users/seb/Code/otto/.letta/worktrees/otto-v01-integration/routines/** — 5 specs (morning, weekly-culture, charter-checkin, practice-mining, ai-frontier-review); all conform to Routine type.
- [x] Templates exist: `routines/_templates/routine.yaml`, `run.yaml`, `receipt.md`. **/Users/seb/Code/otto/.letta/worktrees/otto-v01-integration/routines/_templates/** — all three present with valid structure.
- [x] Docs exist: `docs/routines.md`, `docs/routine-mining.md`. **/Users/seb/Code/otto/.letta/worktrees/otto-v01-integration/docs/** — both present, comprehensive (autonomy boundary, pruning test, layer model defined).
- [x] Skill/extension exists if claimed. **/Users/seb/Code/otto/.letta/worktrees/otto-v01-integration/extension/routine.ts** — extension present (264 lines); **/Users/seb/Code/otto/.letta/worktrees/otto-v01-integration/skill/routine/SKILL.md** — skill guide present (106 lines); `/routine` command fully specified (list, show, run, pause, resume, propose, mine, receipt, help).

## Required runtime behavior

- [x] Routines can be inspected locally. **/Users/seb/Code/otto/.letta/worktrees/otto-v01-integration/extension/routine.ts L60-177** — `/routine list` → show all Routines with status, schedule, cost, approval blocks; `/routine show <slug>` → render spec + recent runs; file-backed runtime (RUNTIME_HOME env + ~/.otto default).
- [x] Recurring activation requires approval. **/Users/seb/Code/otto/.letta/worktrees/otto-v01-integration/extension/routine.ts L201-258** — `routine-gates` permission hook fires on `letta cron add`, `crontab`, `launchctl`, `systemctl timer`; asks before enabling; `requires_approval_to_activate: true` enforced on all 5 specs.
- [x] One-off trials are distinguished from standing routines. **/Users/seb/Code/otto/.letta/worktrees/otto-v01-integration/skill/routine/SKILL.md L75-77** — `/routine run <slug>` executes single on-demand trial (no schedule); `/routine resume <slug>` is the gate for recurring activation (gated approval prompt).
- [x] Runs/receipts are defined even if manual. **/Users/seb/Code/otto/.letta/worktrees/otto-v01-integration/routines/_templates/run.yaml** — Run object template with id, status, inputs, receipts, gate_decisions, timestamps; **/Users/seb/Code/otto/.letta/worktrees/otto-v01-integration/routines/_templates/receipt.md** — Receipt template with Practices run, outputs, evidence, blocked/skipped, memory writeback candidates.

## Required tests

- [~] Routine specs are validated or manually checked. **/Users/seb/Code/otto/.letta/worktrees/otto-v01-integration/RELEASE_CHECKLIST.md L34** — "Routines ✅ manual" — no automated unit test; bun verify:v0 passes (5/5 core checks). **Gap: Routine YAML specs themselves are NOT validated by a test** (practice specs are validated via packages/practices/test/validate.test.ts, but no equivalent for Routine specs). **Manual verification confirms:** all 5 routine.yaml files conform to Routine type (id, slug, name, status, summary, steps[], schedule?, attention_cost, requires_approval_to_activate, created_at present; steps[] reference canonical Practice slugs: charter, decision, review, field-note, follow-up).
- [x] If no runtime executor, mark Partial. **/Users/seb/Code/otto/.letta/worktrees/otto-v01-integration/receipts/otto-v01/routines.md** — "Known limitations: Recurring schedule backend (Letta cron) not exercised here; one-off trials only." One-off trials (via `/routine run`) are functional; recurring backend (cron executor) is gated/proposed but not exercised in v0.1.

## Required demo

- [x] `demo/out/otto-v01-routines.mp4` shows routine specs/templates and approval boundary. **/Users/seb/Code/otto/.letta/worktrees/otto-v01-integration/demo/out/otto-v01-routines.mp4** (2.0 MB) — present; demonstrates routine specs, `/routine list`, approval gates, schedule display, attention-cost fields, one-off trial vs. recurring activation boundary. Note: re-enactment (not live capture), per RELEASE_CHECKLIST.md L78.

## Required receipt

- [x] `receipts/otto-v01/routines.md` states whether runtime executor exists. **/Users/seb/Code/otto/.letta/worktrees/otto-v01-integration/receipts/otto-v01/routines.md** — present; documents changes, demo path, test strategy, manual verification steps, known limitations (cron backend not exercised), approval status (pending).

## Status legend

- `[x]` Done — evidence path required
- `[~]` Partial / prototype / proposed — evidence + gap required
- `[ ]` Not done — missing work required

## Ship decision

Ship as Proposed

### Rationale

**What ships:**
- ✅ Routine type in core contract (locked, tested via typecheck)
- ✅ 5 routine specs fully conforming (morning, weekly-culture, charter-checkin, practice-mining, ai-frontier-review)
- ✅ Templates, docs, extension, skill all present and complete
- ✅ Approval gates (routine-gates) wired and firing correctly on activation attempts
- ✅ One-off trials functional (`/routine run <slug>`)
- ✅ File-backed runtime (RUNTIME_HOME, ~/.otto, spec truth in YAML)
- ✅ Demo video present and clear

**What is partial / deferred:**
- ❌ **No automated Routine YAML validation test** (manual only; gap documented). Practices have a validator (packages/practices/src/validate.ts); Routines do not. This is an auditable limitation: specs pass manual review, and typecheck covers the types themselves, but no linting/schema validation test exists yet.
- ❌ **Recurring schedule backend (Letta cron) not exercised in v0.1** — approval gates are wired and fire correctly, but the scheduler that would actually activate the cron is not hooked up. One-off trials work; recurring activation is gated but not executed at runtime (approvals are pending).
- ❌ **Desktop surface is a prototype mock** (sampleData, not live state) — Routines pane renders the correct structure and approval boundary, but is read-only; no live Letta connection in v0.1.

**Risk assessment:**
- **Low risk to Ship:** The core model (Routine type, specs, approval gates) is solid and wired. The activation gate fires and asks correctly. One-off trials work. Specs are manually verified and conform to the contract.
- **Medium-confidence:** Recurring scheduler is not live, so the recurrence itself (cron backend integration) is deferred to a follow-up. This is documented explicitly in the receipt.

**Truth check:**
- Spec promise: "Routines are repeated bundles of Practices. Recurring routines require approval because attention is a one-way door." ✅ Delivered — approval is enforced at the gate; one-off trials are autonomous; recurring activation blocks and asks.
- Files = truth: ✅ Routine specs live in `routines/<slug>/routine.yaml` (gitignored runs/receipts); RUNTIME_HOME env points to local file storage.
- No artifact, no progress: ✅ Receipts are defined and templated.
- Attention is a one-way door: ✅ The routine-gates extension enforces this explicitly.


