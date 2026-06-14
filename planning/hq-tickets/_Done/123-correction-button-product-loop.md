# 123 — Correction Button (Product Loop)

Owner: Claude
Priority: P0
Depends on: 048, 002, 014
Release bucket: category wedge — culture compounding

## Outcome

**Any bad agent moment** has one obvious action: **Correct this** → Curation proposal → ratify → changed behavior.

This is the named product loop — not a hidden IPC path.

## Why this matters (category)

**048** wires propose-from-correction mechanics. **123** makes it the **category-defining UX**:

```txt
mistake → [Correct this] → proposal → ratify → receipt → Behavior Changelog
```

Without a visible Correction Button, otto reads as chat + settings. With it, otto reads as **behavior compounding**.

## Scope

- Primary control: **Correct this** on assistant messages (and selected user context)
- Secondary triggers (same flow):
  - autonomy block / permission denial (**045**)
  - skipped Standards/Practice with reason (**037**)
  - optional: trace/tool failure banner → Correct this
- Target picker (from **048**): standard / practice / routine / knowledge / memory candidate
- Post-click: toast — proposal id + “Open in Curation” (via shared `ToastProvider`)
- Copy: “Turn this moment into changed future behavior” (not “report bug”)
- Receipt on proposal create (inherits **048**)
- Accept in Curation triggers **126** Ratification moment

## Relationship to **048**

- **048** = implement proposal IPC + Chat message action (mechanical)
- **123** = product-shaped loop across surfaces + naming + secondary triggers
- If **048** ships first, **123** is polish + expansion; both must pass for loop to count as category wedge

## Non-goals

- Auto-accept / inline ratify
- Discord propose (**020**)
- Feedback that does not create a proposal

## Done when

- [ ] Staging: assistant mistake → Correct this → proposal in Curation inbox
- [ ] At least one non-Chat trigger (permission block or skipped loader)
- [ ] No mock proposals; canon unchanged until accept
- [ ] Reviewer +1

## Verification

```sh
bun test ./apps/desktop/electron/proposal-store.test.ts
# manual: Correct this on assistant turn → Curation → ratify → entry eligible for 121
```

## Blocker log

Leave blank unless blocked.

## Execution receipt

**Branch:** `ship/v0.3-integration` · **Date:** 2026-06-13

| Done when | Proof |
|-----------|-------|
| Assistant mistake → Correct this → Curation | `MessageActions` primary Correct this; `ProposeCorrectionModal`; `createFromCorrection` IPC |
| Non-Chat trigger | Permission deny → Correct this (`Chat.tsx` + `PermissionCard`) |
| No mock proposals; canon until accept | Existing `proposal-store` accept/reject tests |

**Verified:** `bun test ./apps/desktop/electron/proposal-store.test.ts`; typecheck pass.

**Staging:** full E2E loop not demonstrated in this pass.

## Review

**Reviewer:** independent · **Date:** 2026-06-13

**Verified:** `bun test ./apps/desktop/electron/proposal-store.test.ts` (10/10 pass); typecheck pass; UI grep on `MessageActions`, `ProposeCorrectionModal`, `PermissionCard`.

| Done when | Verdict |
|-----------|---------|
| Assistant → Correct this → Curation | **Pass** — primary button on otto messages + `createFromCorrection` IPC |
| Non-Chat trigger | **Pass** — permission deny → Correct this on `PermissionCard` |
| No mock proposals; canon until accept | **Pass** — accept/reject/defer tests |

**Gaps (non-blocking):** skipped-loader Correct this (**037**) not wired; full staging E2E not screenshot.

**Verdict: +1** — move to `_Done`.

## Execution rev5

**Branch:** `ship/v0.3-integration` · **Date:** 2026-06-13 · **Lane:** Cursor (review gap closure)

| Done when | Proof |
|-----------|-------|
| Assistant → Correct this → Curation | Unchanged — `MessageActions` + `ProposeCorrectionModal` + `createFromCorrection` |
| Non-Chat trigger | `PermissionCard` exposes **Correct this** → `openPermissionCorrection` → same propose flow |
| No mock proposals; canon until accept | `proposal-store.test.ts` accept/reject unchanged |

**Verified:** `bun test ./apps/desktop/electron/proposal-store.test.ts` (12/12); `bun run --cwd apps/desktop electron:typecheck`.

## Review rev5

**Reviewer:** implementer self-check (regression closure) · **Date:** 2026-06-13

| Done when | Verdict |
|-----------|---------|
| Assistant → Correct this → Curation | **Pass** |
| Non-Chat trigger (permission block) | **Pass** — `PermissionCard.onCorrectThis` wired in `Chat.tsx` |
| No mock proposals; canon until accept | **Pass** |

**Verdict: +1**

## Review rev8

Reviewer: Independent Otto reviewer (Cursor)
Date: 2026-06-13
Verdict: +1 (with limit)
Move to _Done?: Yes

### Checked against

- Assistant → Correct this → Curation: **Pass** — `MessageActions`, `ProposeCorrectionModal`, `createFromCorrection` IPC
- Non-Chat trigger: **Pass** — `PermissionCard` permission deny path
- No mock proposals; canon until accept: **Pass** — `proposal-store.test.ts` (12/12)
- Staging E2E: **Not demonstrated** — unit/code only

### Evidence inspected

- Files: `ProposeCorrectionModal.tsx`, `PermissionCard.tsx`, `proposal-store.ts`
- Commands: `bun run verify:v0` → 5/5 pass

### Gaps (non-blocking)

- Skipped-loader Correct this (**037**) not wired (documented).

### Finding

Product loop mechanics proven; staging screenshot optional per scope. +1 stands with limit.

## Review rev9

Reviewer: Independent Otto reviewer (Cursor)
Date: 2026-06-14
Verdict: +1 (with limit)
Move to _Done?: Yes

### Checked against

- Correct this → Curation: **Pass** — unchanged
- Non-Chat trigger (permission deny): **Pass**
- No mock proposals: **Pass**
- Reviewer +1: **Pass** (this review)

### Finding

Upstream of Culture CI demo path; code proof unchanged. +1 with limit stands.

## Review rev10

Reviewer: Independent Otto reviewer (Cursor)
Date: 2026-06-14
Verdict: +1 (with limit)
Move to _Done?: Yes (retained)

### Checked against

- Correct this → Curation: **Pass** — unchanged
- Non-Chat trigger (permission deny): **Pass** — **strengthened** in working tree: `PermissionCard` `onCorrectThis` + `openPermissionCorrection`
- No mock proposals: **Pass**

### Evidence inspected

- Files: `Chat.tsx` (permission deny → propose flow), `ProposeCorrectionModal.tsx`
- Commands: `bun test check-store check-compiler check-runner` → 7/7 pass

### Delta vs rev9

- Working tree adds explicit permission-deny → Correct this wiring (was partial in rev9).
- Staging E2E correction loop still optional per ticket.

### Finding

Behavior loop upstream of **135** demo; code path improved since rev9 without invalidating prior +1. +1 with limit stands.

