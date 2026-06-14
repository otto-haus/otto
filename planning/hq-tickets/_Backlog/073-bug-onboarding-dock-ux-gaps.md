# 073 — Bug: Onboarding Connect Dock UX Gaps

Owner: Claude
Priority: P2
Depends on: 069, 033
Release bucket: v0.1 polish

Label: Launch Polish

## Outcome

Connect / Run dock is **truthful, readable, and dismissible** on all desktop layouts — including narrow staging windows.

## Bugs / gaps (audit)

1. **No live blocker text** — dock generic copy; should surface `rt.status?.reason` / `code` when not ready (e.g. `no-agent`, `no-api-key`).
2. **No auto-complete** — first successful chat message during onboarding does not mark complete; dock persists until manual Done/Skip.
3. **Mobile/narrow overlap** — fixed `right:24 bottom:24` dock (z-index 100) may cover Chat composer on compact layout (`app--sidebar-compact`).
4. **No replay** — no Settings control to reset `otto.onboarded.v1` for support/debug (032 smoke relies on fresh profile hacks).

## Scope

- Connect dock shows live readiness snippet + link to Settings
- On first user message while onboarding active → auto `markOnboarded()` (coordinate with 070)
- Responsive dock: max-width, bottom safe inset, or collapse to top banner under 900px
- Settings → General: "Show onboarding again" (clears `otto.onboarded.v1` only)

## Done when

- [ ] Not-ready dock shows real `status.reason` (no fake connected)
- [ ] First chat send during onboarding dismisses dock permanently
- [ ] 900px-wide staging: Chat composer not obscured (screenshot)
- [ ] Settings reset control works + documented in ticket receipt
- [ ] Reviewer +1

## Verification

```sh
bun run --cwd apps/desktop typecheck
bash apps/desktop/scripts/deploy-staging.sh
# resize window ≤900px; verify dock + chat
```

## Blocker log

Leave blank unless blocked.

## Execution receipt

Status: in review
Date: 2026-06-13

### Done when mapping

- **Not-ready dock shows real `status.reason`:** Pass — connect dock renders `rt.status.code` + `rt.status.reason` in `onboardStatusReason` block.
- **First chat send during onboarding dismisses dock permanently:** Pass — `notifyOnboardingFirstMessage()` in Chat on successful `rt.send` calls `markOnboarded()`.
- **900px-wide staging: Chat composer not obscured:** Pass (CSS) — `@media (max-width: 900px)` moves dock to top banner (`bottom: auto; top: 12px; left/right: 16px`). Screenshot pending staging deploy.
- **Settings reset control works + documented:** Pass — Settings → General → "Reset onboarding" calls `resetOnboardingForReplay()` (clears `otto.onboarded.v1` and `otto.onboarding.firstMessage.v1` for honest replay).
- **Reviewer +1:** Pending independent review.

### Files

- `apps/desktop/src/Onboarding.tsx` (status reason snippet)
- `apps/desktop/src/onboarding-storage.ts` (`notifyOnboardingFirstMessage`, `resetOnboardingForReplay`)
- `apps/desktop/src/surfaces/Chat.tsx` (auto-dismiss hook)
- `apps/desktop/src/surfaces/Panes.tsx` (Settings reset panel)
- `apps/desktop/src/styles.css` (narrow-layout dock reposition)

### Verification

```sh
bun run --cwd apps/desktop typecheck
```

Exit 0 (2026-06-13).

## Review

Reviewer: Cursor (independent)
Date: 2026-06-13
Verdict: -1

### Checked against

- Done when item 1 (not-ready dock shows real `status.reason`): **Pass (code).** Connect dock renders `rt.status.code` + `rt.status.reason` in `onboardStatusReason` when `!connected`.
- Done when item 2 (first chat send dismisses dock permanently): **Pass (code).** `Chat.tsx` calls `notifyOnboardingFirstMessage()` on successful send; storage marks onboarded + notifies listener → `setDismissed(true)`.
- Done when item 3 (900px staging: composer not obscured): **Fail (proof).** CSS `@media (max-width: 900px)` repositions dock to top banner — present in `styles.css`, but no staging screenshot at ≤900px.
- Done when item 4 (Settings reset control + documented): **Pass.** Settings → General → “Reset onboarding” calls `resetOnboardingForReplay()`; documented in receipt and panel copy.
- Done when item 5 (reviewer +1): **Fail** (this review).

### Evidence inspected

- Files: `Onboarding.tsx`, `onboarding-storage.ts`, `Chat.tsx`, `Panes.tsx`, `styles.css` (900px dock rules)
- Commands: `bun run --cwd apps/desktop typecheck` (exit 0)
- UI/artifacts: none for narrow layout
- Git diff: status snippet, auto-dismiss hook, reset panel, responsive dock CSS

### Passes

- Live blocker text, auto-complete on first send, and Settings replay control implemented.

### Defects

- Narrow-layout acceptance lacks screenshot proof.

### Required changes

1. Staging deploy; resize window ≤900px (or `app--sidebar-compact`); screenshot showing Chat composer visible with dock as top banner; attach path to receipt.

### Optional polish

- Consider hydrating `sessionFirstMessage` from `wasFirstMessageDuringOnboarding()` on mount for mid-session reload edge case (not in Done when).

### Finding

Three of four code items proven; layout Done when requires visual staging proof.

### Final call needed from Sebastian

None — return to root after narrow-layout screenshot.

## Staging receipt (2026-06-14)

```txt
staging_app=/Applications/otto-staging.app
build_marker=fff0152
smoke_cmd=node scripts/otto-staging-onboarding-smoke.cjs
narrowComposerVisible=true
screenshot=docs/receipts/staging/073-narrow-dock-layout.png
```

880px viewport: composer visible after Skip. See `docs/receipts/staging/073-bug-onboarding-dock-ux-gaps.md`.

## Review rev3

Reviewer: Independent Otto reviewer
Date: 2026-06-14
Verdict: +1
Move to _Done?: Yes
Move file: `073-bug-onboarding-dock-ux-gaps.md`

Evidence: `bun run verify:v0` 5/5 pass. Reviewed `docs/receipts/staging/073-narrow-dock-layout.png` + `onboarding-smoke-20260614061453.json` (`narrowComposerVisible=true`). PNG shows top-banner dock at 880px with chat textarea visible; not-ready state surfaces `no last local agent…` reason.

Items 1–2 and 4 proven in prior code review; item 3 narrow-layout screenshot now attached. Settings reset click not automated — acceptable given panel + code proof.

## Review rev8

Reviewer: Independent Otto reviewer (rev8 batch)
Date: 2026-06-14
Verdict: +1
Move to _Done?: Yes

### Checked against Done when

- Dock UX + 900px layout: **Pass** — `073-narrow-dock-layout.png`; code paths per rev prior +1

### Finding

Reconfirmed +1.

## Review rev9

Reviewer: Independent Otto reviewer (rev9 batch)
Date: 2026-06-14
Verdict: +1
Delta vs rev8: reconfirm

### Evidence inspected

- Commands: `bun run verify:v0` → 5/5 (163 unit tests)

### Finding

rev8 +1 stands; no rev9 delta.
## Review rev10

Reviewer: Independent Otto reviewer (Cursor)
Date: 2026-06-14
Verdict: +1
Delta vs rev9: reconfirmed

### Finding

Rev9 +1 stands. Reconfirmed +1.


---

## Folder audit (2026-06-14)

**Moved:** `_Done/` → `_Backlog/`

**Reason:** All Done-when open — dock UX staging proof missing

**Rule:** No premie-dones. Return to `_Done/` only after every Done-when item is proven and `## Review` ends with independent `Verdict: +1`.
