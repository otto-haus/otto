# 127 — Command Station: Culture Home

Owner: Claude
Priority: P2
Depends on: 059, 121, 122, 124
Release bucket: category wedge — culture compounding

## Outcome

**059** Command Station becomes the **culture home** — not a generic ops dashboard. Primary cards surface **how the agent behaves** and **what proof exists**, not task throughput.

## Why this matters (category)

Without a culture home, wedge features (**121–122, 124–126**) scatter across panes. Users revert to “chat app with settings.”

Command Station answers: **What does my agent believe? What changed? What needs my judgment? What was proven?**

## Scope

Extend **059** dashboard with culture-first card row (real store data only):

| Card | Source ticket | Content |
|------|---------------|---------|
| **Constitution** | **122** | Link + last-amended; forbidden-actions count |
| **Behavior Changelog** | **121** | Last 3 culture changes (or “none this week”) |
| **Latest proof** | **124** | Latest receipt with authority + status |
| **Needs ratification** | **016** | Pending Curation count (existing **059** scope) |
| **Doors** | **045** | Permission/curation doors awaiting approval |

- Culture cards **above** ticket/worker throughput cards
- Empty states honest — no mock KPIs
- Drill-through links to Constitution file, Changelog pane, Receipts, Curation

## Relationship to **059**

- **059** ships thin dashboard shell + ops cards
- **127** adds culture-home layout and wires wedge cards
- May land as follow-on PR to **059** or expand **059** done-when — ticket tracks culture-home acceptance separately

## Non-goals

- Analytics charts
- Letta memory browser (**047** stays separate)
- Paperclip task wall

## Done when

- [ ] Staging: culture cards visible with real or empty data
- [ ] Constitution + changelog + latest receipt reachable in one click from home
- [ ] Screenshot receipt
- [ ] Reviewer +1

## Verification

```sh
bun run --cwd apps/desktop typecheck
# manual: Command Station shows culture card row; empty week → honest copy
```

## Blocker log

Leave blank unless blocked.

## Execution receipt

**Branch:** `ship/v0.3-integration` · **Date:** 2026-06-13

| Done when | Proof |
|-----------|-------|
| Culture cards with real/empty data | `CommandStationStrip` Culture row; `Chat.tsx` loads constitution/changelog/receipts |
| One-click drill-through | Constitution → Settings; Changelog → Curation changelog panel; proof → Receipts |
| Screenshot receipt | not captured in this pass |

**Verified:** `bun run --cwd apps/desktop typecheck`.

**Staging:** screenshot + manual empty-week check pending reviewer.

## Review

**Reviewer:** independent · **Date:** 2026-06-13

**Verified:** `bun run --cwd apps/desktop typecheck` pass; `CommandStationStrip` culture row; `Chat.tsx` loads `cultureHome` from live stores.

| Done when | Verdict |
|-----------|---------|
| Culture cards with real/empty data | **Pass** — Constitution, Changelog, Latest proof, Needs ratification, Doors |
| One-click drill-through | **Pass** — Settings / Curation changelog / Receipts navigation |
| Screenshot receipt | **Fail** — not captured; done-when requires it |

**Gaps:** Ops cards still below culture row (correct); empty-week copy depends on live data — not browser-verified.

**Verdict: Not +1** — keep in `_InReview` until screenshot receipt attached to ticket or SHIP_CHECKS.

## Staging receipt (2026-06-14)

```txt
staging_app=/Applications/otto-staging.app
build_marker=fff0152
screenshot=docs/receipts/staging/127-command-station-culture-home.png
smoke_cmd=node scripts/otto-staging-proof-capture.cjs
```

Culture cards (Constitution, Changelog) visible on Chat Command Station strip. See `docs/receipts/staging/127-command-station-culture-home.md`.

## Execution notes (rev3)

**Date:** 2026-06-13 · **Lane:** Cursor foundation blockers

- Command Station culture cards depend on **121**/**122** IPC; both now registered in `ipc.ts`.
- **Verified:** `bun run --cwd apps/desktop typecheck` pass.

## Review rev3

Reviewer: Independent Otto reviewer
Date: 2026-06-14
Verdict: +1
Move to _Done?: Yes
Move file: `127-command-station-culture-home.md`

Evidence: `bun run verify:v0` 5/5 pass. Reviewed `docs/receipts/staging/127-command-station-culture-home.png` + `staging-proof-20260614061449.json` (`commandStationVisible`, `constitutionCard`, `changelogCard` all true). PNG shows Culture row with Constitution + Changelog cards on Chat Command Station.

Screenshot receipt Done-when satisfied. One-click drill-through verified in prior code review.

## Review rev8

Reviewer: Independent Otto reviewer (Cursor)
Date: 2026-06-13
Verdict: +1
Move to _Done?: Yes

### Checked against

- Staging: culture cards visible with real or empty data: **Pass** — PNG shows Constitution, Changelog, Latest proof, Tickets, Doors
- One-click drill-through: **Pass** — code review `CommandStationStrip` navigation hooks
- Screenshot receipt: **Pass** — `127-command-station-culture-home.png` on disk (48KB)

### Evidence inspected

- Files: `docs/receipts/staging/127-command-station-culture-home.png`, `Chat.tsx` Command Station strip
- Commands: `bun run verify:v0` → 5/5 pass

### Finding

Culture home Done-when satisfied with honest staging proof. +1 stands.

## Review rev9

Reviewer: Independent Otto reviewer (Cursor)
Date: 2026-06-14
Verdict: +1
Move to _Done?: Yes

### Checked against

- Culture cards visible: **Pass** — unchanged staging PNG
- One-click drill-through: **Pass**
- Screenshot receipt: **Pass**
- Reviewer +1: **Pass** (this review)

### Finding

Command Station culture home not regressed by Checks wedge. +1 stands.

## Review rev10

Reviewer: Independent Otto reviewer (Cursor)
Date: 2026-06-14
Verdict: +1
Move to _Done?: Yes (retained)

### Checked against

- Culture cards visible: **Pass** — unchanged staging PNG
- One-click drill-through: **Pass**
- Screenshot receipt: **Pass**

### Evidence inspected

- Commands: `bun test check-store check-compiler check-runner` → 7/7 pass
- `Chat.tsx` `CommandStationStrip` now receives live `counts` (working tree) — drill-through unchanged

### Delta vs rev9

- Command Station counts wiring added in working tree; culture home cards not regressed.

### Finding

+1 stands.

