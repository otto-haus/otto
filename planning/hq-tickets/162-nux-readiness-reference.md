# 162 — NUX: Readiness checklist reference (docs/READINESS.md)

**Type:** NUX / docs (additive) · **Status:** draft PR · **Surface:** docs / setup & readiness guidance

## Outcome

A new `docs/READINESS.md` explains every item in the desktop **Settings → Connect
Letta** readiness checklist in plain language: what it is, whether it's required, the
honest status vocabulary (connected / configured / file / missing / not-wired), and
how to resolve each one. It names the gate explicitly — Chat unlocks once the three
required items (Letta runtime, Agent identity, Memory / MemFS) are satisfied.

## Why it lifts activation

The readiness checklist is the literal gate between a new user and first success, but
the in-app labels are terse (e.g. "Memory / MemFS — not-wired — Depends on a live
runtime connection"). A newcomer staring at yellow items has no plain-English answer
to "what is this, is it required, and how do I fix it?" This reference turns the gate
from a wall of jargon into a resolvable checklist — directly reducing setup-stage
drop-off. It complements PR #218's QUICKSTART (the journey) by being the full
item-by-item reference (the lookup).

## What changed

- **New file:** `docs/READINESS.md` (pure addition — no code, no edits to any churned
  surface, zero collision with open PRs).

## Grounding (all verified against origin/main)

- The 10 readiness items, their labels, required/optional flags, details, and
  resolution actions — `apps/desktop/src/data/readiness.json` (quoted faithfully).
- Status vocabulary (`connected | configured | file | missing | not-wired`),
  `isReady`, and "readiness is real, generated from local state" —
  `apps/desktop/src/readiness.ts`.
- The gate / done-test ("Live chat unlocks only after `session.initialize()`
  succeeds") — README Status.
- `OTTO_HOME` and install steps — `docs/INSTALL.md`. Three-zone policy —
  `docs/autonomy.md`.

## Honesty / No fake done

- Faithfully reflects readiness.json's own honest framing: Practices "coming soon —
  not loaded in the v0.1 desktop"; Permissions "not runtime-enforced in v0.1."
- Explicitly states a "not yet" status is an honest report, not a bug, and that
  preview vs connected-desktop statuses differ.
- **No forward-references to unmerged PRs** — links only to files that exist on
  origin/main (README, INSTALL.md, autonomy.md). All internal links resolve.
- Makes no claims about surface rendering (avoids unverifiable Panes.tsx specifics).
