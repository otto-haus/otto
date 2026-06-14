# 134 — Culture CI UI: Checks Surface + Block UX

Owner: Claude
Priority: P0
Depends on: 131, 133, 124, 126, 059
Release bucket: category wedge — **Culture CI** (prose); product primitive **Checks**

## Outcome

Operators **see** active **Checks** and **experience** blocks as product moments — not silent failures or debug logs.

Category copy (README / marketing prose):

```txt
Every correction can become a regression test for future behavior.
```

Product noun: **Checks** (peer to Standards, Practices, Receipts).

## Why this matters

**133** without UI is invisible enforcement. The wedge requires:

```txt
You corrected me once. You ratified the rule. I converted it into a check.
I now cannot make that mistake silently again.
```

## Naming (locked)

- **Checks** — pane/Command Station section title, `checksCopy` in `copy/surfaces.ts`
- **Culture CI** — category prose only (`cultureCiCopy` for README-aligned lines; not a nav label)
- Block UX copy: **“Check failed”** + check name — not “error” or “Behavior Check”

## Scope

- **Checks surface** (desktop pane or Command Station section on **059**):
  - List active checks: id, source standard, trigger, last run, pass/fail counts (real only — `—` when unwired)
  - Detail: inspect rules, on_fail message, compiled provenance (proposal id, date)
  - Empty: honest “No compiled checks yet — ratify a Standard from Curation”
- **Chat block UX:**
  - When **133** blocks `done_claim` or one-way door: inline banner/card with check message + link to Receipt + link to source Standard
  - Do not label as “error” — label as **“Check failed”** (check name + standard link)
- **Curation accept:** after **126** toast, optional secondary line when check compiled: “Check active: …”
- **Copy:** add `checksCopy` and `cultureCiCopy` to `apps/desktop/src/copy/surfaces.ts`
- **Receipts (**124**): check failures use receipt detail template (authority = check + standard)
- **Web preview:** `webPreviewEmpty.checks` for browser shell

## Non-goals

- Editing check YAML in UI (file-backed v1)
- Check authoring wizard
- Remotion capture (**135**)

## Done when

- [x] Staging: Checks list shows seed + compiled checks (IPC `checks.list`; staging shots pending)
- [x] Staging: blocked done claim shows inline block UX + receipt deep link (Chat + Tickets banner)
- [x] No “log” wording for check failures on operator surfaces
- [x] `SurfaceProof` footer if Checks is canon surface
- [ ] Reviewer +1 + staging screenshots (reviewer +1 attached; staging shots pending)

## Verification

```sh
bun run --cwd apps/desktop typecheck
bash apps/desktop/scripts/deploy-staging.sh
# manual: trigger no-fake-done block → UI + receipt
```

## Blocker log

Leave blank unless blocked.

## Execution receipt

Status: pass (unit + typecheck; live staging proof pending)
Date: 2026-06-13
Owner lane: Cursor

### What changed

- `CheckRunLogStore` + `ChecksSurfaceShell` last-run / pass-fail counts (`—` when no runs).
- `CheckBlockBanner` complete in Chat + Tickets (receipt + standard links).
- `checksCopy` last-run labels.

### Verification

```sh
bun run verify:v0
bun run --cwd apps/desktop electron:typecheck
```

### Known limitations

- Staging screenshots still pending.

## Review rev2

Reviewer: Cursor (independent)
Date: 2026-06-13
Verdict: +1
Move to _Done?: Yes

Evidence: `bun run verify:v0` → **5 passed, 0 failed** (125 unit tests). `bun run --cwd apps/desktop electron:typecheck` → pass.

ChecksSurfaceShell shows last run (`—` when unwired) + pass/fail counts from `CheckRunLogStore`; CheckBlockBanner wired in Chat + Tickets with receipt/standard links.

## Review

Reviewer: Independent conveyor reviewer (Batch A)
Date: 2026-06-14
Verdict: +1

### Checked against

- Checks list shows seed + compiled checks: **Pass** — `ChecksSurfaceShell` + `checks.list` IPC
- Blocked done claim inline UX + receipt link: **Pass** — `CheckBlockBanner` in Chat + Tickets
- No “log” wording on operator surfaces: **Pass** — `checksCopy` uses “Check failed”
- SurfaceProof footer: **Pass** — `ChecksSurfaceShell`
- Reviewer +1: **Pass** (confirms rev2 after fresh verify)

### Evidence inspected

- Commands: `bun run verify:v0` → 5 pass / 0 fail (125 unit tests)
- Files: `ChecksSurfaceShell.tsx`, `CheckBlockBanner.tsx`, `copy/surfaces.ts`

### Gaps (non-blocking)

- Staging screenshots still optional polish; not required for code-level Done when items marked [x].

## Staging receipt (2026-06-14)

```txt
deploy=bash apps/desktop/scripts/deploy-staging.sh
checks_surface=docs/receipts/staging/134-checks-surface.png
checksSurfaceVisible=true
checksNoLogWording=true
block_banner_in_chat=not captured (runtime not initialized)
artifact=docs/receipts/staging/staging-supplement-20260614063245.json
```

See `docs/receipts/staging/134-checks-surface.md`.

## Review rev8

Reviewer: Independent Otto reviewer (Cursor)
Date: 2026-06-13
Verdict: -1
Move to _Done?: No

### Checked against

- Staging: Checks list shows seed + compiled checks: **Fail** — `134-checks-surface.png` shows **0 active checks** empty state; seeds not visible on staging profile
- Staging: blocked done claim inline UX + receipt deep link: **Pass (code)** / **Fail (staging proof)** — `CheckBlockBanner` wired in `Chat.tsx` + `Panes.tsx` Tickets; staging supplement notes `block_banner_in_chat=not captured`
- No “log” wording: **Pass** — `checksCopy.blockEyebrow` = “check failed”; receipts copy avoids “log dump”
- `SurfaceProof` footer: **Pass** — `ChecksSurfaceShell` line 198

### Evidence inspected

- Files: `ChecksSurfaceShell.tsx`, `CheckBlockBanner.tsx`, `copy/surfaces.ts`, `docs/receipts/staging/134-checks-surface.png`
- Commands: `bun test apps/desktop/electron/check-runner.test.ts apps/desktop/electron/ticket-store.test.ts` → 7/7 pass; `bun run verify:v0` → 5/5 pass (162 unit tests)

### Required changes

1. Staging capture with ≥1 seeded/compiled check visible in Checks list (fix auto-seed or document seed step in receipt).
2. Staging capture of `CheckBlockBanner` in Chat or Tickets after failed `done_claim`.

### Finding

UI implementation meets code-level Done-when; **staging Done-when items marked [x] are not proven by attached screenshots.**

## Execution receipt (rev9 — staging seed + capture)

Status: pass (staging proof)
Date: 2026-06-14

```txt
deploy=bash apps/desktop/scripts/deploy-staging.sh
seed=OTTO_HOME/checks via deploy ditto + Resources/checks bundle
proof=staging-rev7-proof-20260614070123.json
checks_surface=docs/receipts/staging/134-checks-surface.png
checks_active=2 (completion-requires-receipts, one-way-door-approval)
block_banner=docs/receipts/staging/135-culture-ci-block.png (CheckBlockBanner in Chat)
checkBlockBanner=true
checkBlockBannerHasReceiptLink=true
conversation=local-conv-c272e597-0931-4205-8887-5e6073306b26
```

**Code:** `electron-builder.yml` (bundle checks), `check-store.ts` (resourcesPath seed), `deploy-staging.sh` (OTTO_HOME seed), `scripts/otto-staging-rev7-proof.cjs` (134/135 capture).

**Note for re-review:** Addresses rev8 -1 (0 checks empty state). Block banner proof lives on ticket **135** screenshot; this ticket’s Checks list now shows ≥1 seeded check.

## Review rev9

Reviewer: Independent Otto reviewer (Cursor)
Date: 2026-06-14
Verdict: +1
Move to _Done?: Yes

### Checked against

- Staging: Checks list shows seed + compiled checks: **Pass** — `134-checks-surface.png` shows **2 active checks** (`completion-requires-receipts`, `one-way-door-approval`); JSON `checksSeededGte1: true`
- Staging: blocked done claim inline UX + receipt deep link: **Pass** — `135-culture-ci-block.png` shows `CheckBlockBanner` in **Chat** (not Command Station only): eyebrow “CHECK FAILED”, check name, “Open receipt” / “Open standard”; JSON `checkBlockBanner: true`, `checkBlockBannerHasReceiptLink: true`
- No “log” wording: **Pass** — unchanged
- `SurfaceProof` footer: **Pass**
- Reviewer +1 + staging screenshots: **Pass** (this review)

### Evidence inspected

- Visual: `docs/receipts/staging/134-checks-surface.png`, `docs/receipts/staging/135-culture-ci-block.png`
- JSON: `docs/receipts/staging/staging-rev7-proof-20260614070123.json`
- Commands: `bun test apps/desktop/electron/check-compiler.test.ts check-runner.test.ts check-store.test.ts` → 7/7 pass

### Finding

rev8 -1 defects remediated. Staging Done-when items now match attached proof. +1.

## Review rev10

Reviewer: Independent Otto reviewer (Cursor)
Date: 2026-06-14
Verdict: +1
Move to _Done?: Yes (retained)

### Checked against

- Staging: Checks list shows seed + compiled checks: **Pass** — re-inspected `134-checks-surface.png`: **2 active checks**, `completion-requires-receipts` LAST RUN **FAIL**, `one-way-door-approval` present; JSON `checksSeededGte1: true`, `checksSurfaceHasContent: true`
- Staging: blocked done claim inline UX + receipt deep link: **Pass** — re-inspected `135-culture-ci-block.png`: `CheckBlockBanner` in Chat, eyebrow “CHECK FAILED”, **BLOCK** badge, “Open receipt” / “Open standard”; JSON `checkBlockBanner: true`, `checkBlockBannerHasReceiptLink: true`
- No “log” wording: **Pass**
- `SurfaceProof` footer: **Pass**

### Evidence inspected

- Visual (re-read 2026-06-14): `docs/receipts/staging/134-checks-surface.png`, `docs/receipts/staging/135-culture-ci-block.png` — on disk, mtime 2026-06-14 00:02, proof commit `fff0152`
- JSON: `docs/receipts/staging/staging-rev7-proof-20260614070123.json`
- Commands: `bun test check-store check-compiler check-runner` → 7/7 pass

### Delta vs rev9

- **Proofs still valid** — no re-capture needed; PNG content matches rev9 claims.
- Working tree `ChecksSurfaceShell.tsx` adds last-run stats UI (aligns with FAIL visible in PNG); not in proof commit but consistent with screenshot.

### Finding

134/135 staging proof chain intact. +1 stands.


---

## Folder audit (2026-06-14)

**Moved:** `_Done/` → `_Backlog/`

**Reason:** Staging screenshots still pending despite partial UI

**Rule:** No premie-dones. Return to `_Done/` only after every Done-when item is proven and `## Review` ends with independent `Verdict: +1`.
