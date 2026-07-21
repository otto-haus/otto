# Merge queue babysit — PR #921

**PR:** https://github.com/otto-haus/otto/pull/921  
**Branch:** `dependabot/bun/bun-minor-and-patch-aff21b3a07`  
**Tick:** 024  
**At:** 2026-07-21T01:00:26Z

## Problem

CI `checks` and `scheduled-checks` failed after dependabot bumped `@letta-ai/letta-code` to 0.28.12 and `@letta-ai/letta-code-sdk` to ^0.2.1:

- `electron/runtime-transport/sdk-subprocess-transport.ts` — `ReasoningEffort` type mismatch (`max` → needs `xhigh`), removed `memfs`/`memfsStartup` options, `LettaCodeSession` replaces `Session`, `initialize()` omitted from public type.

Same root cause as #905 (tick 010); #921 re-triggers on fresh dependabot bump.

## Fix (on tick 024 branch)

`apps/desktop/electron/runtime-transport/sdk-subprocess-transport.ts`:

- Map effort levels via `reasoningEffortForSdk()` (`off` → `none`, `max` → `xhigh`).
- Drop `WANT_MEMFS` / `memfs` options (removed in SDK 0.2.x).
- Use `LettaCodeSession` + `InitializableSession` cast for `initialize()`.

`apps/desktop/package.json`:

- Align letta deps with #921 bump (`letta-code@0.28.12`, `letta-code-sdk@^0.2.1`).

Local verify: `bun run --cwd apps/desktop electron:typecheck` → pass.

## Head

- **Before (#921):** `ea3654f8afa3d10d16ba620f66040cbfbb78afaf` — CI red
- **After (tick 024 branch):** pending push on `cursor/unified-shipping-loop-orchestrator-0eb3`

## Notes

Fix applied on orchestrator tick 024 branch (not pushed to foreign dependabot branch — Worker charter rule). Sebastian should cherry-pick sdk fix into #921 or prefer #905 + tick 024 stack once CI confirms green.
