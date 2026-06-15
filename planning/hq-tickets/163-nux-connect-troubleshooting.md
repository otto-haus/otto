# 163 — NUX: Connection troubleshooting guide (docs/CONNECT.md)

**Type:** NUX / docs (additive) · **Status:** draft PR · **Surface:** docs / connect & recovery guidance

## Outcome

A new `docs/CONNECT.md` is a troubleshooting guide keyed to the **exact status pill
labels** the desktop app shows in Settings → Connect Letta. For each non-connected
state (needs agent, auth needed, unreachable, SDK missing, stale session, not
connected) it explains what the state means and how to clear it.

## Why it lifts activation

QUICKSTART (PR #218) is the journey and READINESS (PR #222) is the item reference,
but neither covers **recovery** — the moment a new user sees a yellow pill and stalls.
The connect step is the single highest-friction failure point in first-run. Keying
the guide to the literal pill text the user is staring at ("needs agent",
"unreachable", …) turns a dead end into a next action, completing the connect-journey
doc set with the troubleshooting leg.

## What changed

- **New file:** `docs/CONNECT.md` (pure addition — no code, no edits to any churned
  surface, zero collision with open PRs).

## Grounding (all verified against origin/main)

- The seven status codes and their pill labels — `apps/desktop/src/runtime.ts`
  (`StatusCode` union) and `apps/desktop/src/surfaces/Panes.tsx` (`codePill` map:
  ready→connected, no-agent→needs agent, no-api-key→auth needed,
  unreachable→unreachable, sdk-missing→SDK missing, stale→stale session,
  error→not connected).
- The human-readable `reason` field and Retry affordance — `RuntimeStatus` in
  runtime.ts; the retry/runtime-not-ready panel in Chat.
- Recovery env vars (`OTTO_AGENT_ID`, `LETTA_BASE_URL`, `LETTA_CLI_PATH`,
  `OTTO_HOME`) and the bundled `@letta-ai/letta-code` CLI — `docs/INSTALL.md`.
- "Provider auth lives in Letta, not otto" — `readiness.json` model item.

## Honesty / No fake done

- Frames non-green states as honest reports and tells the user to read otto's own
  `reason` line first; fixes are presented as the usual causes, not guarantees.
- **No forward-references to unmerged PRs** — links only to README and INSTALL.md
  (both on origin/main). Does not link the in-review QUICKSTART/READINESS docs.
- Section headings use the verbatim pill labels so users can match what they see.
