# 161 — NUX: Quick Start guide for the desktop first run

**Type:** NUX / docs (additive) · **Status:** draft PR · **Surface:** docs / new-user onboarding

## Outcome

A new `docs/QUICKSTART.md` gives a brand-new user a single, honest, five-minute path
from a fresh clone to **otto connected to local Letta with the Chat gate open** — the
first-success milestone. It documents the in-app first-run flow (Welcome → Connect →
first message), and — most importantly — explains the **readiness gate**: why Chat is
locked until otto truly connects, and that "not yet" states are honest, not bugs.

## Why it lifts activation

The desktop onboarding surfaces (the Welcome card, the "Getting started" dock, the
Settings readiness checklist) are truthful but **in-app only**. A newcomer who lands in
the app has no written orientation for the most consequential first-five-minutes
question: *"Did I set this up right, and why is Chat locked?"* `docs/INSTALL.md` covers
getting the code, not the in-app journey. This guide closes that gap by mirroring the
real flow and naming the readiness gate as an intentional, honest mechanism — turning a
"looks broken" moment into expected progress, which is the highest-leverage point to
reduce activation friction and support load.

## What changed

- **New file:** `docs/QUICKSTART.md` (pure addition — no code, no edits to any churned
  surface, zero collision with open PRs).

## Grounding (all verified against origin/main)

- Welcome copy + three CTAs ("Connect local Letta →", "See what Receipts will prove",
  "Skip") and the connect/run dock — `apps/desktop/src/Onboarding.tsx`.
- Required vs. optional readiness items (runtime, agent, memory required; model,
  workspace, skills, practices, mcp, functions, permissions optional) and their honest
  "coming soon / deferred" details — `apps/desktop/src/data/readiness.json`.
- v0.1 scope (Desktop **ship**; Approvals / Runs / Receipts **defer**) and the done-test
  *"Live chat unlocks only after `session.initialize()` succeeds"* — README Status.
- Install commands and env vars — `docs/INSTALL.md`.

## Honesty / No fake done

- Receipts are framed as **deferred** (not "recording"); the "See what Receipts will
  prove" button is described as a preview, matching the app's own copy *"Your first
  Receipt will appear here once Receipts land."*
- No fabricated links (no Discord invite, no `docs/GLOSSARY.md` which is unmerged), no
  invented example IDs, no Receipt mock presented as a real artifact.
- All internal links resolve on origin/main; only real external URLs (GitHub repo +
  issues).
- Onboarding is being reworked (tickets 143–150), so the guide stays at a durable
  altitude and notes the UI is still evolving — minimizing staleness.
