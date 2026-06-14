# otto — onboarding design

**Goal:** get a new operator from launch to their **first Receipt** with no fake-done claim
anywhere in the flow.

> The human ratifies. otto records the proof.

This is a design doc, not code. It informs product tickets **143–149** (onboarding craft epic), plus 001 (chat), 002 (settings/readiness), 004/005 (receipts). Microcopy obeys the brand lexicon and the forbidden-words list.

---

## Style reference — Veto inspo (voice, not content)

**Reference:** Veto sandbox onboarding (2026-06) — screenshots used as **design voice and interaction style**, not as a step-for-step script.

otto and Veto solve different jobs. Veto onboards **escrow offices** (identity, email OTP, second factor, role, office name, team invites). otto onboards **local agent operators** (runtime connection, first real turn, first Receipt). **Never copy Veto’s questions or domain copy into otto.** Port the **feel**: calm, one-thing-at-a-time, high-trust, no theatre.

### What we borrow (style + UX)

| Veto pattern | otto use |
|--------------|----------|
| Full-page step, generous whitespace | Step shell (**143**); welcome may keep inverted-ink card once |
| Thin top **progress rail** | Four segments: Welcome · Connect · Run · Receipt — fill only on **evidence** |
| **← Back** without faking progress | Reversible steps; back does not mark complete |
| One primary pill + outlined secondary + text **Skip** | Welcome CTAs; tertiary skip on later steps where honest |
| **Selection cards** (icon, title, benefit, radio) | Connection **mode** pick (embedded vs existing Letta) — not job titles |
| Single-focus field / status screen | Readiness gate: exact blocker + recovery — not email/OTP |
| **Continue disabled** until valid | Until mode selected, `readiness.ready`, or first message sent |
| Quiet **Need help?** footer | Link to help doc; no fake support chat |
| Clear completion / skip later | Receipt payoff or **Done**; sample path labeled not live |

### What we do not port (content)

These Veto steps have **no otto equivalent** in v0.1 — do not add tickets that recreate them:

- Welcome badge “For escrow & title offices”
- Legal name capture
- Work email + magic code
- Passkey / authenticator enrollment
- Role picker (officer / manager / assistant)
- Office naming
- Team email invites / join link

If a future ticket needs **workspace display name** or **multi-seat**, it must be a **new** otto decision — not a silent import from Veto.

### Voice alignment

- **Sentence shape:** short headline question or statement; one supporting line; then action.
- **Tone:** direct, institutional calm — same register as *The human ratifies. otto records the proof.*
- **Hierarchy:** eyebrow (optional) → H1 → subcopy → control → helper → primary CTA.
- **Honesty:** every step names what it does **and** does not guarantee (readiness, sample receipt).
- **Brand split:** Veto is light-field web; otto desktop keeps **inverted-ink welcome once**, then mostly workspace chrome — do not paste Veto escrow copy.

### Style vs content rule (for implementers)

```txt
STYLE  = layout, spacing, progress rail, card pattern, CTA hierarchy, back/skip/help, motion §09
CONTENT = otto four steps, otto lexicon, local runtime facts — from this doc and tickets 143–148
```

When in doubt: **match Veto’s clarity, not Veto’s questionnaire.**

---

## Final flow definition

Use **one first-run flow**, not a separate app mode. It is a lightweight overlay/card sequence that
starts from Chat and sends the operator to Settings only for the connection step.

1. **Welcome** — explain the boundary in one line: *The human ratifies. otto records the proof.*
   CTA: **Connect runtime** (embedded Letta first on fresh install; existing local Letta as advanced path).
   Secondary: **Inspect a sample Receipt**.
2. **Connect** — open Settings inline. Default path: **embedded Letta** (one app, zero paste). Advanced:
   existing local Letta URL + Agent ID. Provider keys stay in Letta. Chat remains disabled until
   runtime + agent are truly connected.
3. **First run** — return to Chat with one suggested starter prompt and the unlocked composer. The
   first success is a real agent turn, not a demo transcript.
4. **First Receipt** — show the proof card after the first successful run, or the static sample labeled `sample · not live · not from your workspace` on the education path. Never imply live proof from the sample.

Decision: **inline Settings, not a dedicated setup screen.** Fewer surfaces; one truth source for
readiness.

Decision: **yes to a sample Receipt before connection**, but only as static education labeled
`sample · not live · not from your workspace`. It must never count toward progress.

## Principles

1. **Prove, then proceed.** No step reports success without evidence. A step is "done" only when
   its artifact exists — the same anti-fake-done rule as the rest of otto.
2. **One idea per screen.** Welcome, connect, run, receipt — each does one thing.
3. **Name the limit in the same breath.** Every readiness row states what it does *and* what it
   does not guarantee.
4. **Earn progress, not a tour.** No coachmark spam, no confetti. The product teaches by doing.
5. **The human ratifies.** A consequential change never compounds without Curation or approval.

---

## The journey — four steps to first proof

```
Welcome → Connect (readiness gate) → Run one behavior → First Receipt
```

### Step 0 · Welcome
- **Goal:** orient in one breath; set the authority boundary.
- **Surface:** a single centered **inverted-ink** card (the signature motif, spent once), the owl
  mark, and the line *"The human ratifies. otto records the proof."*
- **Copy:** eyebrow `OTTO` · headline "The behavior layer for persistent agents." · sub "otto records
  what your agent relied on before it acted — and changes the next run only when you ratify it."
  Primary CTA **"Connect runtime →"** · secondary **"Inspect a sample Receipt"** (labeled
  *sample · not live*).
- **Motion (§09):** the ink card settles in once — 240ms fade + 0.98→1 scale. Nothing else moves.
- **Exit:** operator clicks Connect.

### Step 1 · Connect — the readiness gate  *(product: 002)*
- **Goal:** reach a **truthful** "connected." Never imply connected when it isn't.
- **Surface:** the Connect panel — embedded Letta bootstrap first, then existing local URL + Agent ID if
  needed; provider auth stays in Letta — and the live readiness rows (runtime · agent · model · memory)
  with the Connected pill.
- **Copy / states:**
  - *Not configured:* "Setup required — otto is not connected. N items missing: …" Chat disabled.
  - *Loading:* "Checking runtime…" (calm, indeterminate — never a fast spinner).
  - *Error:* the **exact** blocker, mapped — e.g. "No agent selected" or "Local Letta unreachable" with a recovery action (Open Settings / Retry).
  - *Connected:* "otto is connected to Letta." The pill cross-fades to Connected (120ms, **no blink**).
- **Gate:** Chat stays disabled until live `readiness.ready` is true. The gate is truthful, not cosmetic.
- **Exit:** readiness true → Chat unlocks.

### Step 2 · Run one behavior  *(product: 001)*
- **Goal:** the operator sends one message and watches otto do **real** work that yields an artifact.
- **Surface:** Chat. Empty state explains the next action; composer; the brand's primary verb,
  **"Run one behavior loop."**
- **Copy / states:**
  - *Empty (connected):* "Connected to {agent} — message otto to start a session."
  - *Loading:* "thinking…" (static idle dot — no pulse)
  - *Error:* preserve the operator's input (restore the draft) + show the blocker + Open Settings.
  - *Success:* the assistant reply fades in (≤240ms).
- **Gate:** no send unless `ready && !busy`.
- **Exit:** a successful exchange tied to a run/receipt hook.

### Step 3 · First Receipt — the ratification moment  *(product: 004/005)*
- **Goal:** the payoff. The operator sees their first **Receipt**: what otto relied on, what changed,
  what's blocked. This is the inverted-ink climax of onboarding.
- **Surface:** a Receipt card (stage elevation) with source rows that show their limits, status pills,
  and — if a consequential change is proposed — an approval card.
- **Copy:** "A Receipt shows what the workspace relied on before it acted — sources, changes, and the
  review signature." Source rows name their limit ("A callback is evidence, never permission.").
- **Gate:** a consequential behavior change requires **Curation or approval** before it compounds.
- **Motion (§09):** the Receipt writes with the one allowed emphasis — 240ms fade + slight settle.
- **Exit:** the operator holds a first Receipt and has seen the loop:
  `real action → receipt → proposal → curation → changed future behavior`.

---

## Progress model

A quiet step indicator (three dots / a thin rail). A step is marked complete **only when its evidence
exists** — connected only when readiness is true, "ran" only when a turn produced an artifact, "receipt"
only when one is written. No checkmark on a step that isn't truly done.

## What onboarding never does

- No coachmark/tooltip tour, no confetti, no celebratory theatre.
- No forbidden claims: *autonomous, guaranteed, fully handled, learned automatically, set it and forget it.*
- No fake `connected` / `ready` state before truthful readiness.
- No status dot that blinks or pulses (cross-fade only).

## Success metric

- **% of new operators who reach a first Receipt**, and **time-to-first-Receipt.** That is the only
  onboarding goal that matters; everything else serves it.

## Decisions

1. Connect inline through Settings; no dedicated setup screen.
2. Include a static sample Receipt before connection, labeled `sample · not live · not from your workspace`; it never counts as progress.
3. Veto onboarding screenshots are **style reference only** — see § Style reference above. Implementation tickets: `planning/hq-tickets/143-*.md` … `149-*.md`.
