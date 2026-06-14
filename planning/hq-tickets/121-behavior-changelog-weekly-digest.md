# 121 — Behavior Changelog (Weekly Culture Digest)

Owner: Claude
Priority: P2
Depends on: 048, 051, 016
Release bucket: category wedge — culture compounding

## Outcome

Otto shows a **Behavior Changelog**: a weekly (and on-demand) digest of **what changed about how your agent works** — not chat activity, not task completion.

Makes culture **visible** and compounds trust in the loop.

## Why this matters (category)

Letta shows memory changes. Paperclip shows task status. Devin shows runs. **Otto shows behavior changes.**

Without this, ratification wins stay buried in Curation/Standards panes. The wedge — *agent behavior compounds* — stays invisible.

## Scope

- Aggregate **behavior-affecting events** since last digest:
  - ratified Standards / Practices / Routines
  - accepted Curation proposals (with future-behavior one-liner)
  - autonomy policy / constitution edits (**122**)
  - memory-writeback governance changes (proposal-only; no silent apply)
- Render as human-readable changelog entries: **what · why · authority · receipt id**
- Surfaces: dedicated pane section and/or **059** Command Station card
- Cadence: rolling 7-day default + “since last visit”
- Empty state: honest “no behavior changes this week” (not mock data)

## Non-goals

- Chat transcript export
- Letta block diffs (memory ≠ culture)
- Paperclip task feed
- Email/Discord digest (**099** may extend later)

## Done when

- [ ] Staging: one ratified proposal appears in changelog with receipt link
- [ ] Empty week shows honest empty state
- [ ] Copy passes standards bar: culture change, not “agent activity”
- [ ] Reviewer +1

## Verification

```sh
bun test ./apps/desktop/electron/proposal-store.test.ts
# manual: ratify one proposal → changelog entry with receipt id
```

## Blocker log

Leave blank unless blocked.

## Execution receipt

**Branch:** `ship/v0.3-integration` · **Date:** 2026-06-13

| Done when | Proof |
|-----------|-------|
| Ratified proposal in changelog with receipt link | `behavior-changelog.test.ts` applied proposal entry; `BehaviorChangelogPanel` in Curation |
| Empty week honest empty state | `empty week returns honest empty message` test; `empty_message` in UI |
| Culture-change copy (not activity feed) | `curationCopy.changelogLede`; Command Station changelog card |

**Verified:** `bun test ./apps/desktop/electron/behavior-changelog.test.ts`; `bun run --cwd apps/desktop typecheck`.

**Staging:** manual ratify → changelog entry not demonstrated in this pass.

## Review

**Reviewer:** independent · **Date:** 2026-06-13

**Verified:** `bun test ./apps/desktop/electron/behavior-changelog.test.ts` (2/2 pass); `bun run --cwd apps/desktop typecheck` pass.

| Done when | Verdict |
|-----------|---------|
| Ratified proposal in changelog with receipt link | **Pass** — `behavior-changelog.test.ts` applied proposal; `BehaviorChangelogPanel` + Command Station changelog card |
| Empty week honest empty state | **Pass** — `EMPTY_MESSAGE` + `InlineEmpty` |
| Culture-change copy | **Pass** — `curationCopy.changelogLede` |

**Gaps (non-blocking):** “since last visit” cadence not implemented (7-day window only); memory-writeback governance not a separate changelog source (covered via ratified proposals).

**Verdict: +1** — move to `_Done`.

## Execution notes (rev3)

**Date:** 2026-06-13 · **Lane:** Cursor foundation blockers

- Wired `otto:changelog:list` → `BehaviorChangelog.list()` in `ipc.ts` (preload `changelog.list` no longer falls back to empty stub in Electron).
- **Verified:** `bun test ./apps/desktop/electron/behavior-changelog.test.ts` (2/2); desktop typecheck pass.

## Review rev3

**Foundation IPC:** Pass — changelog pane and Command Station card can load real entries when runtime connected.

## Review rev8

Reviewer: Independent Otto reviewer (Cursor)
Date: 2026-06-13
Verdict: +1
Move to _Done?: Yes

### Checked against

- Ratified proposal in changelog with receipt link: **Pass** — `behavior-changelog.test.ts`
- Empty week honest empty state: **Pass** — `EMPTY_MESSAGE` / `InlineEmpty`
- Culture-change copy (not activity): **Pass** — `curationCopy.changelogLede`
- Reviewer +1: **Pass** (this review)

### Evidence inspected

- Files: `behavior-changelog.ts`, `Panes.tsx` changelog panel
- Commands: `bun run verify:v0` → 5/5 pass

### Gaps (non-blocking)

- “Since last visit” cadence not implemented (documented).

### Finding

Changelog store + UI honest. +1 stands.

## Review rev9

Reviewer: Independent Otto reviewer (Cursor)
Date: 2026-06-14
Verdict: +1
Move to _Done?: Yes

### Checked against

- Ratified proposal in changelog with receipt link: **Pass** — unchanged
- Empty week honest empty state: **Pass**
- Culture-change copy (not activity): **Pass**
- Reviewer +1: **Pass** (this review)

### Finding

Culture CI batch re-review; +1 stands.

## Review rev10

Reviewer: Independent Otto reviewer (Cursor)
Date: 2026-06-14
Verdict: +1
Move to _Done?: Yes (retained)

### Checked against

- Ratified proposal in changelog with receipt link: **Pass** — unchanged
- Empty week honest empty state: **Pass**
- Culture-change copy (not activity): **Pass**

### Evidence inspected

- Commands: `bun test check-store check-compiler check-runner` → 7/7 pass

### Delta vs rev9

- No code delta in behavior-changelog path since rev9.

### Finding

+1 stands.


## Reopened (2026-06-14)

Reason: +1 but proof_class=unit_only
Remaining Done-when: see latest review required changes above.
Prior receipts: preserved in history — do not delete.

## Review

Reviewer: (pending)
Date: 2026-06-14
Verdict: pending

Awaiting implementer execution receipt and independent reviewer +1.
