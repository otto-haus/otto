# Otto v2 Spec — Behavior That Compounds

**Status:** proposed spec  
**Scope:** post-v1 runtime system  
**Reader:** implementers / agents. Humans can read `one-pager.md`.  
**North star:** Otto makes agent behavior compound at runtime.

```txt
Correction -> Proposal -> Classification -> Ratification -> Canon -> Run -> Receipt -> Better next action
```

v2 is the runtime spine that turns corrections and evidence into future behavior. v1 proves the shell and the honest surfaces. v2 closes the behavior loop.

---

## 0. One-sentence product definition

Otto v2 is the behavior governance layer over Letta: it decides which corrections become canon, which actions require approval, which runs are done, and which receipts prove that future behavior changed.

---

## 1. v1 -> v2 boundary

### v1 proves

- Otto Desktop launches and reports readiness truthfully.
- Otto connects to Letta and gates chat on a real session.
- Practices, Standards, Routines, Charters, receipts, and gates exist as real files/specs/surfaces.
- Charter gates can ask before one-way doors.
- Public repo/install path is honest.

### v2 adds

- A real Curation engine.
- Proposal classification and ratification lifecycle.
- Approval records that gates can read and validate.
- Runtime Runs and Receipts.
- Ratified writeback into Standards, Practices, Routines, and Letta memory.
- Intake that proposes changes from external thinking surfaces.
- Paperclip connector as work-state bridge, not dependency.
- Zero-BS Letta local-mode onboarding.

### v2 does not add

- Paperclip as a hard requirement.
- Docker as default install path.
- A generic chat/RAG product.
- A full-stack launcher.
- Product-specific private control systems.

### Boundary table

| Area | v1 | v2 |
|---|---|---|
| Letta | launch/connect truthfully | create/resume Otto agent via Letta Code local mode |
| Curation | cut | central proposal/classification/ratification engine |
| Standards | file-backed canon | ratified canon that shapes/blocks future work |
| Practices | specs + validator + Charter | promoted executable behaviors from repeated work/corrections |
| Routines | proposed specs | trial runs + approval-gated recurring activation |
| Runs/Receipts | types/artifacts | runtime execution records + required proof |
| Intake | not built | imports thinking into proposals, never silent canon |
| Paperclip | reference stack only | optional connector for work state |

v2 does not mean more surfaces. It means the surfaces close the loop.

---

## 2. Runtime surfaces

### 2.1 Curation

Curation is the shared proposal-and-ratification engine. Every durable behavior change flows through it.

Inputs:

- user corrections
- failed receipts
- repeated patterns
- review findings
- Intake imports
- Long-Run outcomes
- Paperclip work events
- manual proposals

Outputs:

```txt
safe + reversible + internal        -> auto-apply with receipt
canon-changing                      -> human ratification
external / irreversible / public     -> explicit approval
unclear / high-risk                  -> block with one precise question
```

Curation owns:

- proposal queue
- classification
- approval routing
- ratification record
- writeback dispatch
- receipt creation
- rejection as training signal

Curation does **not** own:

- canonical Letta memory storage
- Paperclip work orchestration
- provider/model runtime
- private/product-specific control systems

Done test:

> A user correction can become a ratified Standard/Practice/receipt requirement and affect the next run.

### 2.2 Standards

Standards are ratified canon: what Otto rewards, refuses, and does under pressure.

v2 behavior:

- Standards can be proposed by Curation.
- Standards require human ratification before canonical write.
- Standards can block, annotate, or shape future work.
- Conflicts produce Precedents, not silent overrides.
- Stale/overlapping Standards are reviewed and merged/deprecated.

Implementation notes:

- Do not let runtime mutate `standards/` without a Proposal + Receipt.
- Every Standard change references source proposal and evidence.
- Standards can generate checks used by Review/Long-Run, but enforcement must disclose limits.

### 2.3 Practices

Practices are executable repeated behaviors.

v2 behavior:

- Curation can propose a Practice from repeated work or repeated failures.
- Practice promotion asks: “Is this worth being true of us?” not merely “is this frequent?”
- Practices produce Runs and Receipts.
- Practice degradation routes back to Curation.
- Deprecated Practices remain auditable.

Promotion criteria:

- repeated behavior matters
- evidence standard is clear
- approval floor is clear
- useful output exists
- future runs should change

### 2.4 Routines

Routines are repeated bundles of Practices.

v2 behavior:

- One-off trial may be reversible.
- Recurring activation requires Approval because attention is a one-way-door resource.
- Routine Runs write Receipts.
- Routine review can pause, merge, or retire low-signal routines.
- Routine activation stores approval reference.

Activation rule:

```txt
routine.status = active only if recurring activation has scoped, unexpired approval
```

### 2.5 Runs / Receipts

Runs are executions. Receipts are proof.

v2 behavior:

- Every Practice/Routine/Charter execution creates a Run.
- Every completed Run requires a Receipt or Block.
- Done claims must map receipts to acceptance criteria or evidence standards.
- Receipts feed Curation: success reinforces; failure proposes change.

Receipt requirements:

- claim being proven
- evidence references
- limitations
- linked subject
- timestamp
- created_by actor

### 2.6 Intake

Intake imports thinking surfaces into proposals, never directly into canon.

Inputs:

- ChatGPT/Claude/Grok/Dia exports
- notes / markdown
- screenshots or pasted decisions
- meeting/field notes
- local conversation summaries

v2 behavior:

- Intake extracts candidate lessons, decisions, open loops, and repeated corrections.
- Intake creates Curation proposals.
- Intake labels source and confidence.
- Intake cannot silently write Standards, Practices, Routines, or Letta memory.

### 2.7 Long-Run Practice

Long-Run is v2’s operating ritual for multi-hour autonomous work.

Loop:

```txt
Scout -> Judge -> Worker -> Receipt -> Reflect -> Continue / Block / Complete
```

Rules:

- every slice produces a receipt or block
- two no-evidence loops force block/sharpen
- irreversible doors stop for Approval
- completion requires mapped receipts
- reflection creates Curation proposals, not silent canon changes

Done test:

> A 10-hour run ends with proof, blocker, or rollback — never “seems done.”

### 2.8 Work / Paperclip bridge

Paperclip is the management plane. Otto v2 integrates as connector, not dependency.

v2 behavior:

- User can connect an existing Paperclip workspace.
- Otto reads goals, tasks, runs, blockers, approvals, budgets, and heartbeats.
- Otto writes proposed tasks, status updates, approval requests, and receipt links.
- Otto does not launch or bundle Paperclip by default.

Connector rules:

- no required service in first-launch path
- missing adapter state is graceful
- no fake “connected” state
- read-only first; writes require scoped config and receipts

---

## 3. Runtime object model

### 3.1 Proposal

A proposed durable change.

```yaml
id: prop_<id>
source: user_correction | receipt_failure | intake | run_review | paperclip_event | manual
kind: standard | practice | routine | approval | memory_writeback | task | receipt_requirement
summary: <one-line proposed change>
rationale: <why this should compound>
evidence:
  - <receipt/run/file/message refs>
classification_id: class_<id> | null
status: proposed | needs_approval | accepted | rejected | blocked | applied
created_at: <iso8601>
updated_at: <iso8601>
created_by: user | otto | adapter
```

Lifecycle:

```txt
proposed -> classified -> accepted | rejected | blocked | needs_approval -> applied
```

Rules:

- Proposal cannot apply itself.
- Applied Proposal must have Receipt.
- Rejected Proposal writes rejection receipt or note.
- Superseded Proposal links successor.

### 3.2 Classification

Otto’s routing decision for a Proposal.

```yaml
id: class_<id>
proposal_id: prop_<id>
reversibility: reversible | hard_to_reverse | irreversible
scope: internal | external | public | customer | security | spend | legal
canon_impact: none | memory | standard | practice | routine
risk: low | medium | high
required_gate: none | human_ratification | explicit_approval
route: auto_apply | ask | block | reject
reason: <short explanation>
```

Rule: canon-changing proposals require ratification even if operationally reversible.

### 3.3 Approval

A scoped human authorization for a consequential door.

```yaml
id: appr_<id>
proposal_id: prop_<id> | null
requested_action: <exact action>
scope: <narrow authorization>
evidence_required: <proof needed before/after>
requested_at: <iso8601>
expires_at: <iso8601>
status: pending | approved | denied | expired
```

Only approved, unexpired, in-scope approvals satisfy gates.

### 3.4 Run

An execution record.

```yaml
id: run_<id>
kind: practice | routine | charter | intake | paperclip_sync
subject: <slug/ref>
status: running | blocked | complete | failed | cancelled
started_at: <iso8601>
ended_at: <iso8601 | null>
inputs: []
outputs: []
receipt_ids: []
blocker: <text | null>
```

### 3.5 Receipt

A proof artifact.

```yaml
id: rcpt_<id>
run_id: run_<id> | null
subject_type: proposal | approval | run | practice | routine | standard | task
subject_id: <id>
claim: <what this proves>
evidence:
  - type: file | command | log | screenshot | link | human_acceptance
    ref: <path/url/text>
proves:
  - <AC id / standard id / practice evidence standard>
limitations: <what this does not prove>
created_at: <iso8601>
```

### 3.6 Practice

Existing `practice.yaml` plus runtime fields:

```yaml
status: draft | proposed | active | deprecated
source_proposal_id: prop_<id>
evidence_standard: <what proves successful execution>
last_run_id: run_<id> | null
quality_signals: []
```

### 3.7 Standard

Markdown/YAML canon plus:

```yaml
id: std_<id>
source_proposal_id: prop_<id>
status: proposed | active | superseded | rejected
under_pressure:
  do: []
  refuse: []
precedents: []
receipt_ids: []
```

---

## 4. Storage layout

Default local runtime root:

```txt
~/.otto/
  config.json
  letta/                 Letta Code local-mode backend state
  curation/
    proposals/
    classifications/
    approvals/
  runs/
  receipts/
  intake/
  paperclip/
```

Repo canon remains in project files:

```txt
standards/
practices/
routines/
templates/
docs/
```

Substrate rule:

```txt
Files = truth.
Memory = lessons.
UI = workspace.
```

---

## 5. Install / onboarding strategy

Default v2 path: **Letta Code local mode first. No Docker default.**

User flow:

```txt
Download Otto.
Open Otto.
Choose/connect model provider.
Pick project folder.
Otto creates or resumes Otto agent.
Otto verifies readiness.
```

Otto owns:

```txt
~/.otto/config.json       non-secret config
~/.otto/letta/            local Letta backend state
~/.otto/runs/             execution records
~/.otto/receipts/         proof
```

Secrets:

- product target: OS keychain
- dev fallback: local chmod-600 secret file, never logged

Do not require:

- Docker
- global `letta`
- separate Letta Desktop
- manual Postgres
- Paperclip
- Discord

Advanced/dev escape hatches:

- external Letta mode
- explicit `LETTA_CLI_PATH`
- MemFS toggle while bridge stabilizes

---

## 6. Security / approval model

### Reversibility rule

Reversibility is the unit of trust.

| Class | Default |
|---|---|
| reversible, internal, non-canon | may auto-apply |
| canon-changing | human ratification |
| external/public/customer/security/spend/legal | explicit approval |
| irreversible | explicit approval |

### Door classes

Always gate:

- send/publish
- spend/payment
- deploy
- protected merge / force-push
- delete important state
- credentials/security changes
- customer/company/legal commitments
- recurring activation that consumes attention

### Approval validation

A gate is satisfied only when an Approval is:

- approved
- unexpired
- scoped to the action
- linked to required evidence

Chat approval alone is not enough.

---

## 7. What not to build

Do not build:

- a generic chat app
- a generic RAG/document product
- a stack launcher as default experience
- Docker-first install
- Paperclip bundled into v2
- Discord as memory/source of truth
- silent memory/canon writeback
- a second approval system outside Curation
- UI that makes mocked/proposed surfaces look live
- product-specific private control systems in OSS

---

## 8. v2 build order

1. **Curation object model + local queue**
   - Proposal, Classification, Approval schemas
   - local file store under `~/.otto/curation/`

2. **Approval validation**
   - gates read Approval records by status/scope/expiry
   - chat approval writes records; records satisfy gates

3. **Runs / Receipts runtime**
   - create Run records for Practices/Routines/Charters
   - require Receipt or Block on completion

4. **Standards + Practices writeback**
   - ratified proposals can write Standard/Practice changes
   - all writes link back to proposal + receipt

5. **Long-Run Practice**
   - runtime loop, no-evidence counter, block/receipt discipline

6. **Intake**
   - import AI-chat exports/notes into proposals
   - no direct canon or memory writes

7. **Paperclip connector**
   - connect existing workspace
   - read tasks/runs/approvals/heartbeats
   - write proposed tasks, status, receipt links

8. **Zero-BS onboarding**
   - Letta local mode under `~/.otto/letta`
   - provider setup UI
   - create/resume Otto agent
   - no Docker default

9. **Desktop surfaces**
   - Curation inbox
   - Approvals
   - Runs/Receipts
   - Intake
   - Work bridge

10. **v2 release gate**
    - one correction travels full loop
    - one approval satisfies a real gate
    - one run produces mapped receipts
    - one Intake item creates a proposal
    - one Paperclip connection reads/writes non-destructively
