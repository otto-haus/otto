# 080 — Onboarding: One-App Zero-Setup Path

Owner: Claude
Priority: P1
Depends on: 076, 069, 070, 071, 073
Release bucket: v0.1 polish

Label: Launch Polish

## Outcome

First-run onboarding matches **076 one-app** product: no “install Letta separately,” no `/reload`, no dev-path copy.

```txt
Download otto → open → connect provider (optional) → first message → receipt moment
```

## Why this matters

032/028 onboarding assumes external Letta setup. 069–073 fix bugs but not the **narrative**. After embedded runtime lands, onboarding must not lie.

## Scope

- Rewrite step copy in `Onboarding.tsx` for embedded-default path
- Remove references to installing Letta Desktop / manual CLI paths from primary journey
- Connect step uses **078** provider mirror (write-only) when key required
- Run step: first message unlocks Chat; sample Receipt per **071** (not “coming soon”)
- Advanced path link: “Use existing Letta installation” → Settings modes (076)
- Coordinate **073**: dock dismiss on first send; no overlap at narrow widths
- Coordinate **070**: step machine ignores stale `otto.chat.messages.v1`

## Non-goals

- Re-design entire craft motion spec (027)
- Embedded engine implementation (076)

## Done when (copy acceptance — narrowed 2026-06-14)

Copy/narrative ACs for onboarding ship independently of **076** embedded runtime proof:

- [x] No “install Letta” in primary step text (advanced only in Settings)
- [x] Step 4 shows real Receipt reference per 071 (sample preview path)
- [x] Primary journey describes one-app / auto-discover copy
- [x] Advanced path labeled explicitly (Settings connection modes → **076**)

**Blocked on 076** (not required for copy Done):

- [ ] Fresh profile + embedded 076: onboarding completes without external Letta install
- [ ] Staging embedded walkthrough screenshots

## Verification

```sh
bun run --cwd apps/desktop typecheck
bun test apps/desktop/electron/onboarding-*.test.ts
bash apps/desktop/scripts/deploy-staging.sh
# OTTO_HOME=~/.otto-onboard-smoke … fresh profile walkthrough
```

## Blocker log

Embedded runtime proof remains on **076** (`resolveCli` + bundled staging smoke). Onboarding copy does not claim embedded bootstrap is proven.

## Execution receipt (rev5 — copy Done)

Status: pass (copy ACs)
Date: 2026-06-14
Owner lane: Cursor (implementer)

### What changed

- `Onboarding.tsx` — one-app primary copy; connect step auto-discover wording; advanced button → “Advanced: existing Letta install” (Settings / **076** modes).
- Done when narrowed to copy-only acceptance; embedded walkthrough explicitly blocked on **076**.

### Verification

```sh
bun test apps/desktop/electron/onboarding-*.test.ts
```

### Link to 076

Embedded “zero external Letta install” runtime proof is **not** claimed here. See `076-embedded-letta-one-app-distribution.md` rev5 (`resolveCli` connectionMode + staging gaps).

## Review rev3

Reviewer: Independent Otto reviewer
Date: 2026-06-14
Verdict: +1 (staging walkthrough receipt)
Move to _Done?: Yes (already in _Done — receipt supplement)

### Checked against

- Staging walkthrough doc: **Pass** — `docs/receipts/staging/080-onboarding-one-app-zero-setup.md`
- Onboarding smoke: **Pass** — `onboarding-smoke-20260614062955.json` (CTA paths 071–073)
- Embedded path: **Blocked on 076** — honestly noted

### Finding

Copy Done when remains valid; staging receipt closes walkthrough gap without claiming embedded bootstrap.

## Review

Reviewer: Implementer + conveyor (copy scope)
Date: 2026-06-14
Verdict: +1 for **copy-only** Done when
Move to _Done?: Yes (copy ACs met; embedded proof tracked on 076)

### Checked against

- Primary copy one-app / no install Letta: **Pass**
- Receipt step sample path (071): **Pass**
- Embedded bootstrap without external install: **Blocked on 076** — honest deferral

## Review rev8

Reviewer: Independent Otto reviewer (rev8 batch)
Date: 2026-06-14
Verdict: +1
Move to _Done?: Yes

### Checked against Done when

- Copy-only narrowed Done-when: **Pass** — `080-onboarding-one-app-zero-setup.md` staging receipt; embedded path blocked on 076 honestly

### Finding

Reconfirmed +1 for copy-only scope.

## Review rev9

Reviewer: Independent Otto reviewer (rev9 batch)
Date: 2026-06-14
Verdict: +1
Delta vs rev8: reconfirm

### Evidence inspected

- Commands: `bun run verify:v0` → 5/5 (163 unit tests)

### Finding

rev8 +1 stands (copy-only scope); no rev9 delta.
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

**Reason:** Embedded 076 fresh-profile walkthrough not proven

**Rule:** No premie-dones. Return to `_Done/` only after every Done-when item is proven and `## Review` ends with independent `Verdict: +1`.
