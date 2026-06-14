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
