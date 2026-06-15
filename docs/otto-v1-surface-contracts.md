# Otto v1 Surface Contracts

Purpose: define exactly what each Otto Desktop surface must do. Build one surface at a time. Do not add sample cards or visual polish unless they serve the surface contract.

Rule:

```txt
A surface is real only if it has a purpose, state model, actions, receipts, and an acceptance test.
```

---

## Surface 1 — Chat

### Purpose

Chat is the primary Otto surface: the user talks to the persistent Otto agent, sees runtime readiness, handles approvals, and turns corrections into behavior-change proposals.

If Chat does not work, Otto v1 is not shipped.

### Primary object

```txt
Letta session / conversation for the selected Otto agent
```

Chat is not a generic transcript UI. It is the runtime control surface for one persistent Otto agent.

### User promise

```txt
Open Otto. Connect Letta. Talk to Otto. If Otto hits a consequential door, approve or deny it without leaving Chat. If you correct Otto, Otto can turn that correction into a proposal.
```

### Required states

| State | Meaning | Required UI |
|---|---|---|
| `setup_required` | Missing API key, agent, provider, or config | Clear reason + button to Settings / Connect Letta |
| `connecting` | Runtime init in progress | Spinner/progress + exact target if known |
| `connected` | `session.initialize()` succeeded | Composer enabled, model/agent/conversation shown |
| `stale_session` | stored agent/conversation no longer exists | Explain stale state + safe reset/retry |
| `blocked_by_approval` | agent requested consequential action | Inline approval card with scope/evidence/expiry |
| `streaming` | agent response in progress | Stream visible; stop button enabled |
| `error` | runtime or send failed | Exact error + retry + diagnostic copy |

Never show connected unless the SDK session is live.

### Required layout

Chat should feel closer to Letta than a dashboard:

```txt
Header:
  Otto identity, agent id/name, model, connection status

Thread:
  user messages
  Otto messages
  tool/activity events collapsed by default (see [`docs/v1/agent-turn-trail.md`](v1/agent-turn-trail.md))
  approval cards inline
  receipt/proposal cards inline

Composer:
  text input
  send button
  attach/context affordance
  disabled state with reason

Footer/diagnostics:
  runtime status, cli/source, last error, retry/reset if needed

Preview rail (optional, resizable):
  artifact render for selected message or code block (see [`docs/v1/preview-mode.md`](v1/preview-mode.md))
  honest empty when nothing selected; ⌘⇧P toggle
```

### Required actions

| Action | Requirement |
|---|---|
| Send message | Disabled until connected. Sends through main-process Letta runner only. |
| Stop response | Aborts current session stream safely. |
| Retry connection | Re-runs runtime init; does not wipe config unless user confirms. |
| Reset stale session | Clears stale conversation id, keeps agent if valid. |
| Open Settings | Deep-links to connection setup when config is missing. |
| Approve tool request | Writes/records scoped approval before action continues. |
| Deny tool request | Returns denial to runtime and records denial. |
| Create proposal from correction | User correction can become Curation proposal or draft proposal card. |
| Save receipt | Agent output/run can create a receipt linked to message/run. |
| Toggle preview rail | ⌘⇧P or header control; persists open/width; shows honest empty when no selection (see [`docs/v1/preview-mode.md`](v1/preview-mode.md)). |
| Open preview on artifact | Message action or HTML code-block click renders markdown/html/image in rail; no mock content when disconnected. |

### Runtime boundary

Renderer may call only IPC/preload APIs:

```ts
window.otto.runtime.status()
window.otto.runtime.initialize()
window.otto.runtime.send(text)
window.otto.runtime.abort()
window.otto.runtime.approve(requestId, decision)
```

Renderer must not import Letta SDK directly.

### File/runtime ownership

| Data | Owner |
|---|---|
| agent memory/session | Letta |
| runtime config | `~/.otto/config.json` |
| secrets | keychain or local secret fallback; never logged |
| traces | `~/.otto/runs/` or trace writer |
| receipts | `~/.otto/receipts/` or repo receipt path when applicable |
| proposals | Curation store once v2 exists; v1 may show draft/proposed cards honestly |

### Approval behavior

When Letta requests a gated tool/action, Chat shows an approval card:

```txt
Action: <exact action>
Scope: <narrow scope>
Evidence required: <proof before/after>
Risk: <why this is a door>
Expires: <timestamp if applicable>
[Approve] [Deny]
```

Approval card rules:

- no blanket approvals
- no hidden auto-approve for consequential doors
- denial returns a clear message to agent
- approval/denial emits a receipt or trace record

### Correction -> proposal behavior

When the user corrects Otto, Chat should identify proposal candidates.

Example:

```txt
User: Stop saying done without proof.
Otto: Proposed behavior change:
  kind: receipt_requirement
  rule: completion claims require mapped proof
  gate: human ratification before canon
  [Propose] [Ignore]
```

For v1, this may be a draft/proposed card if the full Curation engine is not built. It must be labeled honestly.

### Empty/setup state copy

Use direct copy:

```txt
Otto is not connected yet.
Connect Letta to start a persistent Otto session.
```

If missing key:

```txt
No Letta API key. Add it in Settings → Connect Letta.
```

If missing agent:

```txt
No Otto agent selected. Create or select one in Settings.
```

### Acceptance test

Chat is acceptable only when all are true:

1. Fresh app launch with missing config shows `setup_required`, not fake chat.
2. User can add required Letta config and retry without restarting the app.
3. Successful `session.initialize()` flips Chat to `connected` and enables composer.
4. User can send one message and see one Otto response.
5. If session/conversation is stale, Chat shows `stale_session` and safe reset works.
6. A gated action shows an approval card inline in Chat.
7. Approve/deny returns a decision to the runtime.
8. Runtime errors are shown with exact message and retry path.
9. No renderer code imports Letta SDK directly.
10. A correction can be captured as a draft Proposal / behavior-change card, honestly labeled if not fully wired.

### Non-goals for Chat v1

- no multi-agent team UI
- no Paperclip work queue
- no generic RAG/document workspace
- no fake Curation success if proposal lifecycle is not wired
- no pretending sample cards are live runtime state

### Done line

```txt
Chat is done when a user can connect, talk, approve/deny a gate, and capture a correction without leaving Chat.
```

---

## Surface 2 — Charters

### Purpose

Charters are active operating contracts: objective, acceptance criteria, plan, gates, status, and receipts for long-running work.

### Primary object

```txt
charter.md + charter.yaml + state.yaml + ledger.md under a charter runtime directory
```

### Required states

| State | Required UI |
|---|---|
| no active charter | Explain what a Charter is + offer create from current goal |
| proposed | Show objective/ACs/gates + approve/edit/cancel actions |
| active | Show progress, next action, blockers, open approvals, receipts |
| blocked | Show precise blocker + best guess + approval/request path |
| complete | Show AC-by-AC proof map + completion receipt |
| stale/missing files | Show exact missing path; no fake status |

### Required layout

```txt
Header: active/proposed/complete count, source path, data-source badge
List: charter cards with status, objective, next action, AC progress, receipts
Detail: selected charter with AC table, plan, gates, ledger tail, receipt map
Actions: propose, approve, step, block, attach receipt, audit, complete
```

### Required actions

- Create/propose Charter from intent.
- Approve proposed Charter.
- Run one step.
- Attach receipt to AC.
- Audit AC-by-AC.
- Complete only if every AC has proof.
- Block with one precise question.

### Receipts emitted

- proposal receipt
- step receipt
- blocker record
- audit receipt
- completion receipt

### Acceptance test

1. A proposed Charter can be rendered from files.
2. Active Charter shows ACs, state, next action, and receipts.
3. Completion is blocked when any AC lacks proof.
4. Missing/stale runtime files are labeled, not hidden.

### Done line

```txt
Charters is done when a user can see what long-running work is active, what proves progress, and what blocks completion.
```

---

## Surface 3 — Standards

### Purpose

Standards are ratified canon: what Otto rewards, refuses, and does under pressure.

### Primary object

```txt
standards/ registry + standard files + precedents + anti-patterns
```

### Required states

| State | Required UI |
|---|---|
| file-backed | Show loaded canon and source paths |
| proposed change | Show proposal as not ratified |
| active standard | Show rule, under-pressure behavior, related precedents |
| conflict | Show conflicting Standards and relevant Precedent path |
| missing registry/file | Show exact missing file/path |

### Required layout

```txt
Header: canon status + data-source badge
Canon list: Standards with title, source path, active/proposed/deprecated
Detail: rule, do/refuse under pressure, rationale, receipts, precedents
Anti-patterns: behaviors Otto should flag/refuse
Actions: propose edit, cite receipt, write precedent, deprecate/merge (gated)
```

### Required actions

- View Standard source.
- Propose Standard change.
- Link receipt/rationale.
- Create Precedent for conflict resolution.
- Deprecate or merge only through ratification.

### Receipts emitted

- Standard proposal receipt
- ratification receipt
- precedent receipt
- deprecation/merge receipt

### Acceptance test

1. Standards surface reads real files/registry.
2. Each Standard shows source path and current status.
3. Proposed edits are not shown as active canon.
4. Canon-changing actions require human ratification.

### Done line

```txt
Standards is done when the user can inspect canon and propose changes without any unratified rule pretending to be active.
```

---

## Surface 4 — Practices

### Purpose

Practices are executable repeated behaviors worth preserving.

### Primary object

```txt
practices/*/practice.yaml + README.md + templates
```

### Required states

| State | Required UI |
|---|---|
| active | Show trigger, commands, guardrails, evidence standard |
| draft | Clearly marked draft; cannot claim runtime support |
| invalid spec | Show validation errors |
| proposed promotion | Show source evidence and ratification requirement |
| deprecated | Show replacement or reason |

### Required layout

```txt
Header: number of valid Practices + file-backed badge
List: Practice cards with status, summary, trigger, command(s)
Detail: purpose, invocation, inputs/outputs, guardrails, evidence standard, state paths
Actions: run where implemented, propose edit, promote candidate, deprecate/merge
```

### Required actions

- Validate Practice specs.
- Open Practice source.
- Run implemented Practice where runtime exists.
- Propose Practice from repeated behavior.
- Show draft vs active honestly.

### Receipts emitted

- Practice validation receipt
- Practice run receipt
- promotion proposal receipt
- deprecation receipt

### Acceptance test

1. Practices reads generated real `practices.json` or source YAML.
2. Draft Practices are clearly draft.
3. Invalid specs show actionable errors.
4. Active Practice shows evidence standard and approval floor.

### Done line

```txt
Practices is done when the user can see exactly what behaviors Otto can repeat, what is draft, and what evidence proves a Practice worked.
```

---

## Surface 5 — Routines

### Purpose

Routines are repeated bundles of Practices. Recurring activation spends attention and requires approval.

### Primary object

```txt
routines/*/routine.yaml + run records + receipts
```

### Required states

| State | Required UI |
|---|---|
| proposed | Show bundle and attention cost; not active |
| trial-ready | Show one-off run action |
| active recurring | Show approval reference + schedule |
| paused | Show reason and resume path |
| blocked | Show missing approval/schedule/runtime |
| invalid | Show validation errors |

### Required layout

```txt
Header: active/proposed/paused count + scheduler status
List: Routine cards with schedule/status/attention cost
Detail: Practices in sequence, approval requirement, recent Runs, receipts
Actions: trial once, request activation, pause, resume, retire
```

### Required actions

- Run one-off trial without scheduling.
- Request recurring activation approval.
- Pause/resume/retire.
- Show recent Run receipts.
- Validate Practice refs.

### Receipts emitted

- trial run receipt
- activation approval receipt
- routine run receipt
- pause/retire receipt

### Acceptance test

1. Recurring Routine cannot become active without approval.
2. One-off trial is distinct from recurring activation.
3. Routine shows Practices, schedule, attention cost, and recent receipts.
4. Missing scheduler/runtime is labeled as blocked/deferred.

### Done line

```txt
Routines is done when recurring attention cannot be activated accidentally and every run produces proof or a block.
```

---

## Surface 6 — Curation

### Purpose

Curation decides what compounds. It is the proposal inbox and ratification surface for durable behavior changes.

### Primary object

```txt
Proposal + Classification + Approval/ratification record
```

For v1, if the runtime engine is not built, this surface must say sample/proposed and only show honest previews.

### Required states

| State | Required UI |
|---|---|
| no engine | Explain Curation is not wired; no fake buttons |
| pending proposals | Show proposal, source, risk, route, evidence |
| needs approval | Show Approval record fields |
| accepted/applied | Show writeback target + receipt |
| rejected | Show reason; rejection is training signal |
| blocked | Show precise missing decision |

### Required layout

```txt
Header: pending count + engine status
Inbox: proposals grouped by route (auto/apply, ask, block, reject)
Detail: source evidence, classification, risk, reversibility, target writeback
Actions: approve, edit, reject, block, apply (only if engine wired)
```

### Required actions

- Inspect Proposal.
- Approve/edit/reject/block Proposal.
- Show why a proposal requires human ratification.
- Write receipt for decision.
- Apply only if writeback path exists.

### Receipts emitted

- curation decision receipt
- approval receipt
- rejection receipt
- writeback receipt

### Acceptance test

1. Curation never silently mutates Standards/Practices/Routines/memory.
2. If engine is unwired, buttons are disabled or preview-labeled.
3. Every proposal shows source evidence and classification.
4. Human decision writes or would write a receipt.

### Done line

```txt
Curation is done when a correction can become a reviewed proposal and no durable behavior change bypasses ratification.
```

---

## Surface 7 — Receipts

### Purpose

Receipts are proof. They show what happened, what was proved, and what remains unproven.

### Primary object

```txt
receipt files + run records + evidence refs
```

### Required states

| State | Required UI |
|---|---|
| empty | Explain no receipts yet; show what counts as a receipt |
| success | Show claim, evidence, linked AC/Practice/Run |
| blocked | Show missing proof/approval |
| running | Show incomplete Run and expected proof |
| invalid | Show missing evidence/claim/subject |

### Required layout

```txt
Header: receipt count + missing-proof count
List: receipts by run/date/status
Detail: claim, evidence, limitations, linked AC/Practice/Standard/Approval
Actions: open evidence, attach to AC, mark limitation, create follow-up proposal
```

### Required actions

- Open receipt evidence.
- Link receipt to AC/Practice/Run.
- Flag missing/weak proof.
- Create proposal from repeated failure.
- Export/copy receipt summary.

### Acceptance test

1. A done claim without receipt is visibly incomplete.
2. Receipt shows exact evidence and limitation.
3. Receipt can be linked to an AC or evidence standard.
4. Missing proof creates blocker/proposal path.

### Done line

```txt
Receipts is done when the user can answer “what proves this?” without reading chat history.
```

---

## Surface 8 — Autonomy

### Purpose

Autonomy defines what Otto may own without the human and what must escalate.

### Primary object

```txt
risk/door policy + approval floors + ticket/worker boundaries
```

### Required states

| State | Required UI |
|---|---|
| policy loaded | Show green/yellow/red zones |
| policy missing | Show default conservative policy |
| gate armed | Show door class and approval requirement |
| ticket draft | Show allowed files, acceptance criteria, verify command, forbidden actions |
| worker result | Show receipts and integration status |

### Required layout

```txt
Header: autonomy mode + policy source
Policy: reversible / prompt / approval zones
Doors: send, spend, deploy, merge, delete, security, recurring activation
Ticketcraft: bounded worker packet preview
Actions: propose policy edit, compile ticket, review worker result
```

### Required actions

- Show current autonomy policy.
- Classify proposed action into green/yellow/red.
- Generate bounded ticket packet where supported.
- Escalate one-way doors.
- Link worker result to receipts.

### Receipts emitted

- policy change receipt
- ticket compile receipt
- worker review receipt
- escalation receipt

### Acceptance test

1. Red-zone actions always require approval.
2. Green-zone examples are reversible/internal.
3. Ticket packet includes scope, ACs, verify command, forbidden actions, receipt expectation.
4. Policy edits require ratification.

### Done line

```txt
Autonomy is done when Otto can explain why it acted, why it asked, or why it refused.
```

---

## Surface 9 — Settings

### Purpose

Settings is the setup and diagnostics surface: Letta connection, agent selection, secrets, project folder, runtime paths, and app health.

### Primary object

```txt
~/.otto/config.json + secret store + readiness state
```

### Required states

| State | Required UI |
|---|---|
| setup required | Show missing config checklist |
| connected | Show provider/model/agent/conversation |
| missing key | Key entry or secret-store setup |
| missing agent | Create/select Otto agent |
| stale session | Reset conversation or recreate agent |
| advanced | Show paths, CLI, memfs, logs |

### Required layout

```txt
Header: readiness summary
Connect Letta: provider/key/base URL/agent picker
Project: selected folder / cwd
Runtime paths: ~/.otto, Letta local dir, receipts, traces
Diagnostics: last error, logs, copy debug bundle
Advanced: LETTA_CLI_PATH, external Letta, MemFS toggle
```

### Required actions

- Add/update API key without logging it.
- Create/select Otto agent.
- Test connection.
- Reset stale conversation.
- Choose project folder.
- Copy diagnostics.
- Open runtime folder.

### Receipts emitted

Settings does not emit product receipts for every config change, but connection tests should write diagnostics/traces for debugging.

### Acceptance test

1. Missing API key is fixable without terminal.
2. Packaged app works without shell env once key is stored.
3. Test connection reports exact state.
4. Secrets are never printed in UI/logs.
5. Advanced settings are visible but not required for happy path.

### Done line

```txt
Settings is done when a normal user can connect Otto to Letta without exporting env vars or reading docs.
```

---

## Surface build order

1. Chat
2. Settings
3. Charters
4. Receipts
5. Standards
6. Practices
7. Routines
8. Curation
9. Autonomy

Reason: Chat + Settings prove the runtime. Charters/Receipts prove work. Standards/Practices/Routines make behavior legible. Curation/Autonomy close the governance loop.
