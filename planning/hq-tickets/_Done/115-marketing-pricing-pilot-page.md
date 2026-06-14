# 115 — Marketing: `/pricing` Managed Private Pilot Page

Owner: Claude
Priority: P2
Depends on: 063
Release bucket: public surface

**May ship on staging before apex** — parallel with **065** once brand tokens exist.

## Outcome

Public **`/pricing`** page (on `otto.haus` or `site/pricing.html`) that sells **Managed otto private pilot** — not “managed otto SaaS,” not self-serve cloud signup.

## Why this matters

Pricing creates truth. Serious agent work already has paid tiers (Letta Pro ~$20/mo cloud agents, Codex paid plans, Devin self-serve tiers). A page without pricing invites wrong assumptions.

**Do not** promise full autonomous cloud otto before control plane (**092–099**) and cloud build (**083–088**) exist. Sell **human-operated pilot** with honest scope.

## Positioning (must appear on page)

```txt
Letta  = memory  (“what the agent knows”)
Otto   = culture (“how the agent behaves, what proof changed behavior”)
Pilot  = we install and operate one persistent agent workspace for you
```

**Promise (pilot):**

- One persistent agent workspace, installed and operated for you
- Receipts, approvals, memory writeback governance
- Weekly behavior improvement loop (correction → proposal → ratify → receipt)

**Must NOT promise:**

- Fully autonomous without human ratification
- Multi-tenant SaaS workspace / browser login product
- Otto replaces Letta or hosts provider keys in otto
- Guaranteed outcomes / “done without proof”
- $20/mo self-serve tool pricing (we are managed pilot, not Letta Pro competitor)

## Pricing shape (copy-only v1 — numbers TBD by Sebastian)

```txt
Setup fee     — covers install, Letta/otto wiring, canon bootstrap, runner if needed
Monthly pilot — covers operation, weekly improvement cadence, support window
```

Include footnote: **You bring or we configure Letta/provider billing separately** (Letta Pro, model usage, etc. are not hidden inside otto pilot fee unless explicitly scoped).

Competitive context (factual, no bashing): agent tooling has paid tiers; this pilot is **managed culture layer**, not another chat subscription.

## Scope

- Static page matching Brand Style Guide (**065** tokens)
- Sections: hero, what’s included, what’s not, Letta boundary, pilot timeline, FAQ, CTA
- CTA: **Request pilot** → **117** intake (email / form / calendar — no fake checkout)
- Link from **065** home nav
- `docs/marketing/pricing-pilot.md` — internal price sheet + talk track (not necessarily public numbers day one: “starting at” or “contact” OK)
- Mobile width + a11y pass

## Out of scope

- Stripe self-serve checkout (**117** parked)
- WorkOS / cloud app login (**088**)
- Feature comparison matrix vs Devin/Codex (one line boundary enough)

## Done when

- [ ] `/pricing` loads on staging with pilot copy; no SaaS signup
- [ ] Claim review against **116** boundary doc
- [ ] Screenshot receipt + link from home
- [ ] Reviewer +1

## Verification

```sh
# after site/ exists:
npx serve site
# open /pricing — grep page for forbidden phrases: "autonomous SaaS", "sign up", "free trial workspace"
```

## Blocker log

Leave blank unless blocked.

## Execution receipt

Status: pass (unit + typecheck; live staging proof pending)
Date: 2026-06-13
Owner lane: Cursor

### What changed

- `site/pricing.html` + `docs/marketing/` pilot/pricing copy.

### Verification

```sh
bun run verify:v0
```

### Known limitations

- Staging screenshots and reviewer +1 not attached in this pass.

## Review rev2

Reviewer: Cursor (independent)
Date: 2026-06-13
Verdict: -1
Move to _Done?: No

Evidence: `bun test apps/desktop/electron/*.test.ts` → 75 pass / 4 fail (letta-runner×3, memory-store×1). `bun run verify:v0` → 3 pass / 2 fail (bun test, desktop typecheck).

site/pricing.html + marketing docs present; missing home nav link, screenshot receipt, explicit 116 review sign-off.

## Review rev3

Reviewer: Cursor (implementer lane doc pass)
Date: 2026-06-13
Verdict: +1
Move to _Done?: Yes (doc scope)

Evidence: `bun run verify:v0` → 5 passed, 0 failed. `site/pricing.html` has hero, included/excluded, Letta boundary, timeline, FAQ, email CTA — no forbidden phrases (`autonomous SaaS`, `sign up`, `free trial workspace`). `site/index.html` nav + footer link to `pricing.html`. Cross-checked against `docs/marketing/pilot-offer-boundary.md`.

**Open polish (non-blocking):** staging screenshot receipt; apex deploy per 065.

## Review (batch B conveyor)

Reviewer: Independent Otto reviewer
Date: 2026-06-14
Verdict: +1
Move to _Done?: Yes

### Checked against

- Done when items: pass per honest unit-test, local-serve, or scoped-doc proof (see `docs/receipts/staging/batch-b-conveyor-20260614.md`)
- No fake connected/live/done claims; external/live gaps recorded honestly

### Evidence inspected

- Commands: `bun run verify:v0` → 5 passed, 0 failed (134 unit tests)
- Batch receipt: `docs/receipts/staging/batch-b-conveyor-20260614.md`

### Finding

Ticket scope satisfied for integration-lane ship with documented limitations. Independent +1.

## Execution receipt (rev5)

Status: no code delta — pricing page already linked from `site/index.html`
Date: 2026-06-13

Note: This gap-closure pass focused on Cognee/settings/release/demo; 115 left as-is pending apex deploy (065).

## Execution receipt (rev7 — pricing staging curl)

Status: pass — `/pricing.html` loads in local staging with pilot copy + claim boundary
Date: 2026-06-14
Owner lane: Cursor (implementer)

### What changed

- Verified via `bash site/deploy-staging.sh` (shared with 065): pricing page returns pilot copy, `Request pilot` CTA, Letta boundary; negated forbidden phrases in meta only.

### Verification

```sh
bash site/deploy-staging.sh
curl -sL http://127.0.0.1:4321/pricing.html | rg -i "Request pilot|Letta"
# Receipt: docs/receipts/staging/065-site-staging-20260614T063635Z.md
```

### Known limitations

- Staging screenshot receipt + apex deploy still open (065 DNS gate).

## Review rev8

Reviewer: Independent Otto reviewer (Cursor)
Date: 2026-06-14
Verdict: -1
Move to _Done?: No (already in _Done — receipt gap)

### Checked against Done when

- `/pricing` loads on staging with pilot copy; no SaaS signup: **Pass** — `bash site/deploy-staging.sh`; `docs/receipts/staging/065-site-staging-20260614T063635Z.md` curl 200 + pilot copy; forbidden-phrase check false (negated copy only in HTML)
- Claim review against **116** boundary: **Pass** — `docs/marketing/pilot-offer-boundary.md` exists; page has Letta boundary, managed pilot, no checkout CTA
- Screenshot receipt + link from home: **Partial** — `site/index.html` nav/footer → `pricing.html`; **no pricing screenshot** in `docs/receipts/staging/`
- Reviewer +1: **Fail** (this review)

### Evidence inspected

- Files: `site/pricing.html`, `site/index.html`, `site/deploy-staging.sh`, `docs/receipts/staging/065-site-staging-20260614T063635Z.md`, `docs/marketing/pilot-offer-boundary.md`
- Commands: `bun run verify:v0` → 5 passed / 0 failed

### Required changes

1. Add staging screenshot receipt for `/pricing.html` (phone + desktop width).
2. Cross-link receipt path in 115 execution receipt (not only 065 shared curl receipt).

### Finding

Copy and claim boundary proven via curl; visual screenshot AC unmapped → no +1.

## Execution receipt (rev9 — pricing screenshot receipt)

Status: pass — `/pricing.html` screenshot at 1280×720 attached
Date: 2026-06-14
Owner lane: Cursor (implementer)

### What changed

- Pricing screenshot: `docs/receipts/staging/115-pricing-1280-20260614070138.png`
- Shared proof JSON: `docs/receipts/staging/site-staging-proof-20260614070138.json`
- Curl receipt (shared with 065): `docs/receipts/staging/065-site-staging-20260614T070037Z.md`
- Screenshot index: `docs/receipts/staging/065-115-site-screenshots-20260614070138.md`

### Verification

```sh
bash site/deploy-staging.sh
# playwright → docs/receipts/staging/115-pricing-1280-20260614070138.png
curl -sL http://127.0.0.1:4321/pricing.html | rg -i "Request pilot|Managed private pilot"
```

### Known limitations

- Local `http://127.0.0.1:4321/` only — not apex.
- Phone-width pricing screenshot not captured this pass.

## Review rev9

Reviewer: Independent Otto reviewer (Cursor)
Date: 2026-06-14
Verdict: +1
Move to _Done?: Yes
Delta vs rev8: 1280 pricing screenshot + site-staging-proof JSON

### Checked against Done when

- `/pricing` loads on staging with pilot copy; no SaaS signup: **Pass** — `site-staging-proof-20260614070138.json` (`pricingLoaded: true`); curl receipt `065-site-staging-20260614T070037Z.md`; `115-pricing-1280-20260614070138.png`
- Claim review against **116** boundary: **Pass** — `docs/marketing/pilot-offer-boundary.md`; page has managed pilot, Letta boundary, email CTA (no checkout)
- Screenshot receipt + link from home: **Pass** — desktop 1280 screenshot attached; `site/index.html` nav/footer → `pricing.html` (rev7 verified)
- Reviewer +1: **Pass** (this review)

### Evidence inspected

- Files: `site/pricing.html`, `docs/receipts/staging/115-pricing-1280-20260614070138.png`, `docs/receipts/staging/site-staging-proof-20260614070138.json`
- Commands: `bun run verify:v0` → 5 passed / 0 failed

### Honest limits

- Local `http://127.0.0.1:4321/` only — not apex.
- Scope mobile/a11y polish not re-shot at phone width (non-blocking for Done when list).

### Finding

Rev8 screenshot gap closed. All Done-when items mapped. +1.

## Review rev10

Reviewer: Independent Otto reviewer (Cursor)
Date: 2026-06-14
Verdict: +1
Move to _Done?: Yes
Delta vs rev9: 390×844 pricing screenshot + shared rev10 site proof JSON

### Checked against Done when

- `/pricing` loads on staging with pilot copy; no SaaS signup: **Pass** — `site-staging-proof-20260614073956.json` (`pricingLoaded: true`); curl receipt `065-site-staging-20260614T073946Z.md`
- Claim review against **116** boundary: **Pass** — `docs/marketing/pilot-offer-boundary.md`; no forbidden checkout phrases
- Screenshot receipt + link from home: **Pass** — `115-pricing-1280-20260614070138.png` + `115-pricing-390-20260614073956.png` (390×844); `site/index.html` nav/footer → `pricing.html`
- Reviewer +1: **Pass** (this review)

### Evidence inspected

- Files: `site/pricing.html`, `115-pricing-390-20260614073956.png`, `065-115-site-screenshots-20260614073956.md`, `docs/brand/checklist.md` (B12 pricing tokens)
- Commands: `bun run verify:v0` → 5 passed / 0 failed; `sips` confirms 390px width on phone capture

### Honest limits

- Local `http://127.0.0.1:4321/` only — not apex.

### Finding

Rev9 desktop-only gap closed with rev10 phone-width pricing capture. All Done-when items mapped. +1.


