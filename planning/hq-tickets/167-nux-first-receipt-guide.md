# 167 — NUX: First Receipt reading guide (docs/FIRST_RECEIPT.md)

**Type:** NUX / docs (additive) · **Status:** draft PR · **Surface:** docs / first-success payoff

## Outcome

A new `docs/FIRST_RECEIPT.md` explains the artifact a new user produces at the
**end** of first-run: their first Receipt. It covers what a Receipt is (durable proof
in `~/.otto/receipts/`, not chat history), the three outcomes (success / blocked /
failed), how to read one (action, subject, outcome, evidence, source practice/routine,
summary), where they live, and the act → prove → correct → ratify loop.

## Why it lifts activation

origin/main now ships Receipts as the **fourth onboarding step** ("First Receipt").
That makes the first Receipt part of first-success — but a newcomer who lands on a
proof record with no orientation just sees an unfamiliar artifact. This guide names
what they're looking at and why it matters, converting the payoff moment from "what is
this?" into "I see the proof." It is the natural completion of the first-run journey
(connect → first message → **first receipt**) and does not overlap QUICKSTART
(journey), READINESS (gate reference), or CONNECT (recovery).

## What changed

- **New file:** `docs/FIRST_RECEIPT.md` (pure addition — no code, no edits to any
  churned surface, zero collision with open PRs).

## Grounding (all verified against current origin/main, dc3e03a)

- The Receipt is durable proof in `~/.otto/receipts/` — "authority and evidence, not
  chat logs"; "Authority, evidence, and outcome — not a log dump. Each receipt states
  who decided and what changed." — receipts surface copy in
  `apps/desktop/src/copy/surfaces.ts`.
- Three outcomes (`success | blocked | failed`) and the readable fields (action,
  subject, summary, blockerCode, evidenceCount, practiceSlug, routineSlug) —
  `ReceiptStatus` / `ReceiptSummary` in `apps/desktop/src/runtime.ts`.
- "Receipts emit when otto completes, blocks, or fails an action with proof";
  "First turn recorded — open Receipts to inspect the proof record";
  receiptLede "what the workspace relied on before it acted — sources, limits, and
  review signature" — `copy/surfaces.ts`.
- Receipts SHIP in v0.1 (Status table row 3) — README.

## Honesty / No fake done

- Grounds every claim in the shipped receipt contract + surface copy; describes a
  `blocked` Receipt as honest (proof it stopped where it should), not an error.
- **No forward-references to unmerged PRs** — links only to README and INSTALL.md
  (both on origin/main); does not link the in-review QUICKSTART/READINESS/CONNECT.
- Keeps ratification light and accurate (accept applies canon; reject/defer write a
  Receipt without changing behavior) — no overclaiming of the agent's tool reach.
