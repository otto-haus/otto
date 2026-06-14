# 021 — Paperclip: Read-Only Import + Curation Bridge

Owner: Cursor
Priority: P2
Depends on: 048, 051
Release bucket: vNext adapters

**Unpark when:** Curation propose path (048) and No Fake Done receipts (051) proven in staging.

## Boundary (non-negotiable)

```txt
Paperclip = work plane (goals, tasks, budgets, heartbeats, external agent runs, adapter audit)
otto      = behavior governance + local ticket execution rules + allowed/done?
Letta     = runtime + memory
```

- Paperclip is **not** another otto brain.
- Paperclip task status is **not** otto truth.
- Otto does **not** mutate Paperclip in this ticket.
- Imported items become **`paperclip_event`** Curation proposal sources only — never silent canon.

Resolve doc drift as part of this ticket:

- `README.md` — Paperclip owns **cross-agent work-state**, not “everything orchestration.”
- `docs/autonomy.md` — Otto owns **local** orchestration (tickets, workers, worktrees, retries); Paperclip may own **cross-agent** work-state; Approvals still own doors.

## Outcome

Paperclip context imports read-only into otto as adapter input + Curation proposals, with receipted audit trail.

## Scope

### 1. Connector (read-only)

- Read tasks, status, artifacts from Paperclip API or export (env/credentials in Settings — **no secrets in renderer**).
- Map to adapter seam: `context`, `work_state` (non-authoritative), `artifacts`, `proposals`.
- **`work_state` is display-only** — never advances otto ticket status or Done.

### 2. Enable gate (approval door)

- First **Connect Paperclip** / save credentials / enable sync = **external integration door** (Autonomy + Approval record).
- Read-only sync runs only when connector is approved-enabled.
- No silent background import on first launch.

### 3. Curation bridge

- Each import batch may emit proposals with `source: paperclip_event`, `created_by: adapter`.
- Proposal kinds: task context, receipt requirement, approval reminder, memory writeback *candidate*, practice candidate — **all proposed, none applied without Curation decide**.
- Preserve Paperclip IDs + canonical URLs on every proposal and receipt.

### 4. Receipts

- One receipt per import batch: timestamp, batch id, Paperclip entity ids/urls, proposal ids created, errors/skips.
- Failed/blocked imports are receipted — no fake “synced.”

### 5. Implementation anchors

- `packages/core` — `paperclip_event` already in proposal source enum; extend types if needed.
- `apps/desktop/electron/` — adapter module under adapter seam (no direct canon writes).
- Obey `docs/v1/contracts/adapter-seam.md`.

## Non-goals

- Paperclip UI surface (074)
- Task creation / write API (022)
- Status feedback loop (075)
- Bundling or launching Paperclip

## Done when

- [ ] Doc alignment: README + `docs/autonomy.md` boundary text merged (no orchestration contradiction)
- [ ] Connect Paperclip blocked until approval door passed; receipt records enablement
- [ ] One real import batch → Curation proposals with Paperclip source links
- [ ] Zero Paperclip mutations from otto
- [ ] Zero automatic canon / Letta writes from import
- [ ] Seam test passes (`adapter-seam.md`)
- [ ] Staging smoke + reviewer +1

## Verification

```sh
cd /Users/seb/Code/otto
bun test ./apps/desktop/electron/*proposal*
bun run --cwd apps/desktop electron:typecheck
# manual: connect (approval) → import → proposals in Curation with links
```

## Related

- **074** — thin Paperclip slice in UI (after this)
- **022** — door-gated task creation (after 021 + 049)
- **075** — status feedback (parked; Paperclip “done” ≠ otto Done)

## Blocker log

Leave blank unless blocked.
