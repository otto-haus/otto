# 117 — Pilot Intake: Request Flow (No Fake Checkout)

Owner: Claude
Priority: P3
Depends on: 115, 116
Release bucket: public surface

**Unpark when:** **115** staging `/pricing` exists.

## Outcome

**Request pilot** CTA works end-to-end: qualified lead reaches Sebastian — no fake Stripe, no mock “account created.”

## Why this matters

High-touch pilot ($ setup + monthly) should not look like $20/mo SaaS signup. Intake must match managed sale.

## Scope (pick one in implementation; document in receipt)

- **Option A:** `mailto:` + short qualification form (name, workspace, Letta status, goal)
- **Option B:** Cal.com / Calendly embed for 30m pilot fit call
- **Option C:** Typeform/Tally → email/Slack notification
- **Option D (later):** Stripe **deposit link** for setup fee only — manual fulfillment

Default recommendation: **B or C** for v1; no self-serve provisioning.

- Spam/abuse: honeypot or CF Turnstile on form
- Auto-reply email copy aligned with **116**
- Receipt: test submission screenshot

## Non-goals

- Customer portal
- Automated pilot provisioning
- Recurring Stripe subscription without human SOW

## Done when

- [ ] CTA from **115** completes one test intake
- [ ] Notification reaches operator channel
- [ ] Reviewer +1

## Blocker log

Leave blank unless blocked.
