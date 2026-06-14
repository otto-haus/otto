# 123 — Correction Button (Product Loop)

Owner: Claude
Priority: P0
Depends on: 048, 002, 014
Release bucket: category wedge — culture compounding

## Outcome

**Any bad agent moment** has one obvious action: **Correct this** → Curation proposal → ratify → changed behavior.

This is the named product loop — not a hidden IPC path.

## Why this matters (category)

**048** wires propose-from-correction mechanics. **123** makes it the **category-defining UX**:

```txt
mistake → [Correct this] → proposal → ratify → receipt → Behavior Changelog
```

Without a visible Correction Button, otto reads as chat + settings. With it, otto reads as **behavior compounding**.

## Scope

- Primary control: **Correct this** on assistant messages (and selected user context)
- Secondary triggers (same flow):
  - autonomy block / permission denial (**045**)
  - skipped Standards/Practice with reason (**037**)
  - optional: trace/tool failure banner → Correct this
- Target picker (from **048**): standard / practice / routine / knowledge / memory candidate
- Post-click: toast — proposal id + “Open in Curation” (via shared `ToastProvider`)
- Copy: “Turn this moment into changed future behavior” (not “report bug”)
- Receipt on proposal create (inherits **048**)
- Accept in Curation triggers **126** Ratification moment

## Relationship to **048**

- **048** = implement proposal IPC + Chat message action (mechanical)
- **123** = product-shaped loop across surfaces + naming + secondary triggers
- If **048** ships first, **123** is polish + expansion; both must pass for loop to count as category wedge

## Non-goals

- Auto-accept / inline ratify
- Discord propose (**020**)
- Feedback that does not create a proposal

## Done when

- [ ] Staging: assistant mistake → Correct this → proposal in Curation inbox
- [ ] At least one non-Chat trigger (permission block or skipped loader)
- [ ] No mock proposals; canon unchanged until accept
- [ ] Reviewer +1

## Verification

```sh
bun test ./apps/desktop/electron/proposal-store.test.ts
# manual: Correct this on assistant turn → Curation → ratify → entry eligible for 121
```

## Blocker log

Leave blank unless blocked.
