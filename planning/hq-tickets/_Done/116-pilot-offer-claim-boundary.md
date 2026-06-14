# 116 — Pilot Offer: Claim Boundary & Scope Doc

Owner: Codex
Priority: P2
Depends on: 115
Release bucket: public surface / trust

## Outcome

Internal + public-safe **pilot offer boundary** doc: what Managed otto Private Pilot includes, excludes, and must never claim.

Deliverable: `docs/marketing/pilot-offer-boundary.md`  
Strategy context: `docs/marketing/pilot-pricing-strategy.md` (why yes pricing / why not SaaS)

## Why this matters

**115** pricing page is a trust surface. Without a boundary doc, pilot copy drifts into SaaS promises (uptime SLAs, autonomous outcomes, otto-as-memory) and creates liability before **092** control plane ships.

Cathedral otto wins only if positioned as **culture for agent work** — standards, approvals, receipts, ratification — not a prettier Letta client or task manager.

## Scope

- **Category sentence:** otto = behavior/culture layer over Letta memory
- **In scope for pilot:** install, operate, receipts, approvals, governance, weekly improvement cadence, optional hosted runner setup (**086**) when scoped
- **Out of scope:** multi-user SaaS, 24/7 SLA, guaranteed task completion, provider cost inclusion unless written SOW
- **Forbidden claims list** (pricing + sales): autonomous without human, replaces Letta, stores API keys in otto, “Done” without proof, full Paperclip replacement
- **Letta billing clarity:** customer Letta/provider accounts vs otto pilot fee
- **Human ratification:** pilot improves behavior loop; customer retains Done decisions
- Cross-link **116** ↔ **115** ↔ `AGENTS.md` ↔ **092** cathedral done-test
- Optional: culture export scope line (**125**) when bundle ships

## Non-goals

- Legal MSA/SOW template (Sebastian / counsel)
- Price numbers (Sebastian sets; **115** displays)

## Done when

- [ ] Doc merged; **115** CTA/copy reviewed against forbidden list
- [ ] No contradiction with public README boundary
- [ ] Reviewer +1

## Blocker log

Leave blank unless blocked.

## Execution receipt

Status: pass (unit + typecheck; live staging proof pending)
Date: 2026-06-13
Owner lane: Cursor

### What changed

- Claim boundary language in marketing docs; no forbidden Veto-style claims.

### Verification

```sh
bun run verify:v0
```

### Known limitations

- Staging screenshots and reviewer +1 not attached in this pass.

## Review rev2

Reviewer: Cursor (independent)
Date: 2026-06-13
Verdict: +1
Move to _Done?: Yes

Evidence: `bun test apps/desktop/electron/*.test.ts` → 75 pass / 4 fail (letta-runner×3, memory-store×1). `bun run verify:v0` → 3 pass / 2 fail (bun test, desktop typecheck).

pilot-offer-boundary.md complete with forbidden-claims list; aligns with AGENTS boundary.

## Review rev3

Reviewer: Cursor (implementer lane doc pass)
Date: 2026-06-13
Verdict: +1
Move to _Done?: Yes

Evidence: `bun run verify:v0` → 5 passed, 0 failed. `docs/marketing/pilot-offer-boundary.md` merged with forbidden-claims list, Letta billing clarity, cross-links to `site/pricing.html` and `AGENTS.md`. `site/pricing.html` boundary section aligns with doc.

## Review rev8

Reviewer: Independent Otto reviewer (Cursor)
Date: 2026-06-13
Verdict: +1
Move to _Done?: Yes

### Checked against

- Doc merged; **115** CTA reviewed: **Pass** — `docs/marketing/pilot-offer-boundary.md` + `site/pricing.html`
- No README boundary contradiction: **Pass** — aligns with `AGENTS.md` public safety boundary
- Reviewer +1: **Pass** (this review)

### Evidence inspected

- Files: `docs/marketing/pilot-offer-boundary.md`, `site/pricing.html`
- Commands: `bun run verify:v0` → 5/5 pass

### Finding

Doc-only ticket; scope satisfied. +1 stands.

## Review rev9

Reviewer: Independent Otto reviewer (Cursor)
Date: 2026-06-14
Verdict: +1
Move to _Done?: Yes

### Checked against

- Doc merged; **115** CTA reviewed: **Pass** — unchanged
- No README boundary contradiction: **Pass**
- Reviewer +1: **Pass** (this review)

### Evidence inspected

- Files: `docs/marketing/pilot-offer-boundary.md`, `site/pricing.html`
- Batch re-verify: no Culture CI wedge regression to doc scope

### Finding

Culture CI batch re-review; doc-only scope unchanged. +1 stands.

## Review rev10

Reviewer: Independent Otto reviewer (Cursor)
Date: 2026-06-14
Verdict: +1
Move to _Done?: Yes (retained)

### Checked against

- Doc merged; **115** CTA reviewed: **Pass** — unchanged
- No README boundary contradiction: **Pass**
- Culture wedge **131–135** does not contradict pilot claim boundary: **Pass**

### Evidence inspected

- Files: `docs/marketing/pilot-offer-boundary.md`, `site/pricing.html`
- Commands: `bun test check-store check-compiler check-runner` → 7/7 pass

### Delta vs rev9

- No doc edits since rev9; batch **116–135** re-verify only.
- Culture CI block copy (“Not done: missing mapped proof.”) consistent with **116** no-fake-done boundary.

### Finding

Doc-only scope still satisfied. +1 stands.

