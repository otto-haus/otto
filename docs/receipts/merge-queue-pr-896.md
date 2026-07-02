# merge-queue receipt — PR #896

**PR:** https://github.com/otto-haus/otto/pull/896  
**Title:** deps(deps): bump the bun-minor-and-patch group  
**Branch:** `dependabot/bun/bun-minor-and-patch-87831248fc`  
**Agent:** merge_prep babysit subagent  
**Date:** 2026-07-02

## Head OID

| Stage | OID |
|-------|-----|
| Before (dependabot bump) | `3c99e6a31b8789a10244146541978a9a9c3f3b3a` |
| After (SDK + audit fix pushed) | `31ebeb0e01f51ad00ab8776880136af1fe771260` |

## Rebase

- Fetched `origin/main` at `5869ad7ecdb6c4110f51e0fc4244e083e052e470`
- PR branch was already up to date with main; **no rebase required**

## CI commands run (local)

| Command | Result |
|---------|--------|
| `bun install` | pass |
| `bun run --cwd apps/desktop electron:typecheck` | pass |
| `bun run typecheck` | pass |
| `bun audit` | **pass** (No vulnerabilities found) after fix |

## Fix applied

Dependabot bumped `@letta-ai/letta-code` to 0.27.18 and `@letta-ai/letta-code-sdk` to 0.2.1. SDK 0.2.x changed the public session surface:

1. **`sdk-subprocess-transport.ts`** — adapt to `@letta-ai/letta-code-sdk` 0.2.x:
   - Use `LettaCodeSession` instead of `Session` for stored session type
   - Cast to `InitializableSession` for `initialize()` (still implemented on stdio subprocess sessions, omitted from public interface)
   - Map otto effort levels to SDK `ReasoningEffort`: `max` → `xhigh`, `off` → `none`
   - Remove `memfs` / `memfsStartup` from `CreateSessionOptions` (removed from SDK 0.2.x public options)

2. **`package.json` overrides** — CI `bun audit` failures (dompurify via streamdown; undici via electron toolchain):

```json
"dompurify": "^3.4.11",
"undici": ">=7.28.0"
```

Commit: `31ebeb0` — `fix(desktop): adapt sdk-subprocess-transport to letta-code-sdk 0.2.x`

## Push status

- **Succeeded:** `git push origin dependabot/bun/bun-minor-and-patch-87831248fc`
- Remote updated: `3c99e6a..31ebeb0` (fix), then receipt commit on branch tip

## Notes

- Did **not** merge PR #896.
- Did **not** arm AGENT_LOOP schedules.
- `OTTO_MEMFS=1` no longer passes memfs flags via `CreateSessionOptions`; follow-up may be needed if memfs-on-resume is still required with SDK 0.2.x.
