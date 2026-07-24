# Merge queue babysit — PR #921

**PR:** https://github.com/otto-haus/otto/pull/921  
**Branch:** `dependabot/bun/bun-minor-and-patch-aff21b3a07`  
**Tick:** 026 (confirmed from 025)  
**At:** 2026-07-23T01:01:00Z

## Problem

CI `checks` and `scheduled-checks` failed after dependabot bumped `@letta-ai/letta-code` to 0.28.12 and `@letta-ai/letta-code-sdk` to ^0.2.1:

- `electron/runtime-transport/sdk-subprocess-transport.ts` — SDK 0.2.x type breakage (same root cause as #905).
- `bun audit` — bumped deps surface tar, brace-expansion, js-yaml, fast-uri, sharp advisories without root overrides.

## Fix (on tick 025 branch)

`apps/desktop/electron/runtime-transport/sdk-subprocess-transport.ts`:

- Map effort levels via `reasoningEffortForSdk()` (`off` → `none`, `max` → `xhigh`).
- Drop `WANT_MEMFS` / `memfs` options (removed in SDK 0.2.x).
- Use `LettaCodeSession` + `InitializableSession` cast for `initialize()`.

`package.json` overrides:

- `dompurify`, `undici`, `tar`, `brace-expansion`, `js-yaml`, `fast-uri`, `sharp`.

Local verify:

- `bun audit` → no vulnerabilities
- `bun run --cwd apps/desktop electron:typecheck` → pass

## Head

- **Before (#921):** `ea3654f8afa3d10d16ba620f66040cbfbb78afaf` — CI red
- **After (tick 025/#923):** `202b8a6c9c24` on `cursor/unified-shipping-loop-orchestrator-0dd5` — **CI green** (confirmed tick 026)

## Notes

Fix applied on orchestrator tick 025 branch (#923); not pushed to foreign dependabot branch (Worker charter rule). Tick 026 confirms `checks` + `scheduled-checks` SUCCESS on #923. Sebastian should cherry-pick sdk+audit fix into #921 or prefer #905 + tick 025 stack.
