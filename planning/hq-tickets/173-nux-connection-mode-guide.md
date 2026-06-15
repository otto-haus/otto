# 173 — NUX: Connection mode decision guide (docs/design/onboarding.md)

**Type:** NUX / docs (additive section) · **Status:** draft PR · **Surface:** onboarding help doc

## Outcome

Appends a **"Connection mode — This Mac vs Existing Letta"** section to
`docs/design/onboarding.md`, the doc the in-app **Need help?** link targets
(`helpUrl` in `apps/desktop/src/copy/surfaces.ts` points at this exact file). It
explains the onboarding Step 1 mode choice in plain language: what each card means,
when to pick it, the env vars for the existing-Letta path, and that the choice is
reversible in Settings.

## Why it lifts activation

The mode question (*"How should otto connect?"*) is the first real decision in
first-run, and the in-app cards are necessarily terse (*"One app — embedded Letta
runtime"* vs *"Point otto at a local URL and agent ID"*). A new operator hitting
**Need help?** at that moment lands on this doc — but until now it had no answer to
"which path do I pick?" This section closes that gap at the exact moment of need,
auto-discoverable via the existing help link, with **zero collision** (the doc is not
churned and not touched by any open PR). Orthogonal to the journey docs
(#218/#222/#225/#236) — it targets the mode pivot, not the journey.

## What changed

- **Edit (append only):** a new section at the end of `docs/design/onboarding.md`. No
  existing lines modified.

## Grounding (verified against current origin/main, dc3e03a)

- Mode microcopy quoted verbatim — `apps/desktop/src/copy/surfaces.ts`: `modeTitle`
  "How should otto connect?", `modeLede` "Pick one path. You can change this later in
  Settings.", `modeEmbeddedTitle` "This Mac" + `modeEmbeddedBadge` "Recommended" +
  `modeEmbeddedBody`, `modeExistingTitle`/`Body`, `modeContinue` "Continue →".
- Reversibility + the Settings control — `connectionModeLabel` "Connection mode"
  (Settings) in the same file.
- `LETTA_BASE_URL` and `OTTO_AGENT_ID` for the existing-Letta path — `docs/INSTALL.md`.
- The doc is the in-app help target — `helpUrl` in `copy/surfaces.ts`.

## Honesty / No fake done

- Quotes the real shipped microcopy; adds no invented defaults (no fabricated
  `localhost` URL). Matches the doc's existing institutional-calm voice.
- Append-only edit to a collision-free doc; no hot-file edits, no forward-references
  to unmerged PRs.
