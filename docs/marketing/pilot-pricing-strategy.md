# Managed otto — Pricing & Pilot Strategy

**Status:** proposed  
**Tickets:** **115**, **116**, **117**  
**Audience:** Sebastian + anyone writing public copy

---

## Go / no-go

**Yes:** put up a **pricing page**.  
**No:** do not sell **managed otto SaaS** yet.

---

## Why yes (pricing page)

Pricing creates **truth**. Prospects need to know this is serious work with serious scope.

Comparable paid agent tooling exists:

- [Letta Pro](https://docs.letta.com/letta-code/pricing/) — ~$20/mo, cloud stateful agents
- [Codex pricing](https://developers.openai.com/codex/pricing/) — free → paid tiers
- [Devin plans](https://cognition.ai/blog/new-self-serve-plans-for-devin) — self-serve paid tiers

Nobody should be shocked that agent infrastructure costs money. Silence implies either hobby project or hidden pricing surprise.

---

## Why not full SaaS yet

A page that promises **“managed autonomous otto in the cloud”** inherits before the product exists:

- cloud reliability & uptime expectations
- security & tenant isolation
- auth & org model (**088**)
- cost controls & runaway spend
- support & outcome SLAs
- control plane semantics (**092–099**)

Selling that now is **overclaim**. It trades short-term leads for long-term trust debt.

---

## What to sell instead

**Managed otto private pilot**

| Element | Copy direction |
|---------|----------------|
| **Promise** | One persistent agent workspace, installed and operated for you, with receipts, approvals, memory governance, and weekly behavior improvement |
| **Price shape** | **Setup fee** + **monthly pilot** — high enough to include human setup; **not $20/mo** tool pricing |
| **Letta/providers** | Customer Letta/provider billing separate unless explicit SOW |
| **Category** | Letta = memory · otto = culture · pilot = we operate the loop |

Implementation: **115** `/pricing`, **116** claim boundary, **117** intake.

---

## Forbidden on pricing / sales (see **116**)

- Self-serve cloud workspace signup
- Fully autonomous without human ratification
- Otto replaces Letta or stores provider keys
- Guaranteed task completion / “Done” without proof
- $20/mo “otto Pro” parity with Letta

---

## When to upgrade offer

Move from **pilot** → **product SaaS** only when:

1. **092** cathedral spec +1  
2. **083–084** cloud records live  
3. **094–097** queue, leases, heartbeat proven  
4. **088** WorkOS if multi-customer  
5. **105** cloud release lane passes  

Until then: **pilot = human-operated**, not **SaaS = self-serve**.

---

## Culture vs memory (why pilot price is defensible)

Letta answers: *what should the agent remember?*  
Otto answers: *how should it behave, and what proof shows behavior improved?*

Pilot buyers pay for **compounding culture** — standards, approvals, receipts, ratification — not another chat subscription.

Cathedral otto wins only if it stays obsessively on that loop. It fails as a prettier Letta client, task manager, or cloud wrapper.

Optional public explainer: **118**.
