# 140 — Release Packaging: Ship vs Labs (Sebastian Gate)

Owner: Cursor + Claude
Implementer model: Composer 2.5 Fast
Priority: P1
Depends on: 136, 137, 138, 139, 063
Release bucket: v0.1 functional ship — **release lane**

## Outcome

Release artifacts honestly describe **what works at launch** vs **what is Labs**:

```txt
Ship table  = works with Labs off
Labs table  = experimental; enable in Settings
NOT PUSHED  until Sebastian explicit approval
```

Target tag: **`v0.1.3`** at first Sebastian gate — prepare only, no push.

**Release cut policy** (Sebastian): stay on **`0.1.x`** floor; numbers are earned. Patch = closed proof bundle per gate. Minor (`0.2.0`) = named milestone in `ship-tier-matrix.md` changelog only — not branch merges. Retire public use of `v0.3.0` / integration branch names as semver; see `RELEASE_CHECKLIST.md`.

## Why this matters

README and RELEASE_CHECKLIST currently mix “proposed”, “partial”, and `_Done` ticket counts. Functional ship needs a single story operators and skeptics can trust.

## Scope

### Docs refresh

- `RELEASE_CHECKLIST.md` — two tables: **Ship** / **Labs** / **Cut**; link to `ship-tier-matrix.md`
- `docs/v1/SHIP_STATUS.md` — same tier language; remove stale “demo not refreshed” if **138** proof exists
- `SPEC_COMPLIANCE.md` / `CLAIMS_AUDIT.md` — align public claims to Ship tier only
- `README.md` — hero demo + badges; Labs one paragraph; no Cloud/Discord as shipped
- `docs/v1/labs.md` — linked from README (from **139**)
- `site/` — pricing + hero copy uses Ship/Labs boundary (**116** claim boundary respected)

### PR stack

- Execute or refresh `docs/v1/runbooks/pr-stack-ship-v03.md` split with tier work included
- Pre-merge: `bun run verify:v0`, `bash scripts/release-gate.sh`

### Demo assets

- Primary proof: **135** capture (Culture CI), not Remotion-only
- `demo/out/` + GitHub release asset naming aligned with README (`otto-v01-desktop.mp4`)
- **064** optional refresh after 135 capture exists

### Sebastian gate packet

Append to **063** checklist:

- [ ] Tried staging with **Labs off** — core loop
- [ ] Tried staging with **Labs on** — one lab feature
- [ ] Ship table matches experience
- [ ] Explicit approval for push + tag

## Non-goals

- npm publish, license change, visibility change
- Deploying `otto.haus` apex without Sebastian DNS approval
- Promoting to live `/Applications/otto.app` without explicit request

## Done when

- [ ] `RELEASE_CHECKLIST.md` Ship/Labs/Cut tables filled with evidence links
- [ ] README does not claim Labs features as v1 shipped
- [ ] `bun run verify:v0` + `release-gate.sh` green (receipt date in checklist)
- [ ] Staging proof bundle linked: 138 + 139 receipts
- [ ] **NOT PUSHED** banner until Sebastian sign-off row checked
- [ ] Reviewer +1 on claims audit (no forbidden Veto-style guarantees on marketing)

## Verification

```sh
cd /Users/seb/Code/otto
bun run verify:v0
bash scripts/release-gate.sh

# Claims grep (adjust patterns as needed)
rg -i "discord bot|cloud sync|always.on|paperclip" README.md site/ RELEASE_CHECKLIST.md

curl -sI "https://github.com/otto-haus/otto/releases/latest/download/otto-v01-desktop.mp4" | head -3
```

## Blocker log

Leave blank unless blocked.

## Ticket receipt (140 — 2026-06-14)

| Done-when | Status |
|-----------|--------|
| RELEASE_CHECKLIST Ship/Labs/Cut tables + evidence links | done |
| README Ship/Labs boundary; no Labs as shipped | done |
| `verify:v0` + `release-gate.sh` green | done (2026-06-14) |
| Staging proof bundle 138 + 139 linked | partial — hygiene + 139 linked; **138** gaps logged |
| NOT PUSHED banner | done |
| Claims audit reviewer +1 | pending |

**138 cross-link:** [`138-ship-tier-core-path-proof.md`](138-ship-tier-core-path-proof.md) — staging log lists onboarding/rev8/two-thread/Culture CI as not re-run this session; **076** fresh Mac open. Do not fake Ship declare.

**139 receipt:** [`docs/receipts/staging/124-126-123-139-ui-wedge-20260614.md`](../../docs/receipts/staging/124-126-123-139-ui-wedge-20260614.md)

**Verdict:** partial — docs refresh complete; ticket stays in root until **138** closure + Sebastian sign-off.

## Review

Verdict: partial (implementer)
Reviewer +1 on claims: pending
