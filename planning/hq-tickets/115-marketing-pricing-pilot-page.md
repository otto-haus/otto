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
