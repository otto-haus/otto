# merge-queue receipt — PR #891

**PR:** https://github.com/otto-haus/otto/pull/891  
**Title:** deps(deps): bump the bun-minor-and-patch group with 3 updates  
**Branch:** `dependabot/bun/bun-minor-and-patch-b5bd573a47`  
**Agent:** merge_prep babysit subagent  
**Date:** 2026-06-29

## Head OID

| Stage | OID |
|-------|-----|
| Before (dependabot commit) | `6fd42deeb31d9dc9edcd1959960f032f1c6c52f9` |
| After (audit fix pushed) | `f087f36d0534993e286905077c948e41b03bc1b0` |

## Rebase

- Fetched `origin/main` at `5869ad7ecdb6c4110f51e0fc4244e083e052e470`
- PR branch was already 1 commit ahead of main; **no rebase required**

## CI commands run (local)

| Command | Result |
|---------|--------|
| `bun install` | pass |
| `bun install --frozen-lockfile` | pass (after fix) |
| `bun run typecheck` | pass |
| `bun test` | 1005 pass / 3 skip / **1 fail** (flaky `queue-storage > clearQueueStorage` — passes in isolation; CI previously passed full suite) |
| `bun run verify:v0` | 4/5 pass (same flaky test via `bun test`) |
| `bun audit` | **pass** (No vulnerabilities found) after fix |

## Fix applied

CI failed on `bun audit` (dompurify ≤3.4.10 via streamdown; undici 7.23–7.27 via electron toolchain). Added root `package.json` overrides and refreshed `bun.lock`:

```json
"dompurify": "^3.4.11",
"undici": ">=7.28.0"
```

Commit: `f087f36` — `fix(deps): override dompurify and undici for clean bun audit`

## Push status

- **Succeeded:** `git push origin dependabot/bun/bun-minor-and-patch-b5bd573a47`
- Remote updated: `6fd42de..f087f36`

## CI after push (2026-06-29)

All checks **green** on `f087f36`:

| Check | Result |
|-------|--------|
| checks | pass |
| scheduled-checks | pass |
| embedded-letta-release-gate | pass |
| analyze (javascript-typescript) | pass |
| dependency-review | pass |
| CodeQL | pass |
| Cloudflare Pages | pass |

## Blockers

| Blocker | Status |
|---------|--------|
| `bun audit` (checks + scheduled-checks) | **resolved** — CI green |
| Flaky `queue-storage` test under full `bun test` | pre-existing / environmental; CI passed full suite |
| Merge | **not performed** (out of scope) |
| AGENT_LOOP schedules | **not armed** (out of scope) |

**Remaining:** none for CI; PR ready for human merge review.

## Notes

- Dependabot bump updates: `@letta-ai/letta-code` 0.19.5→0.27.14, `pg` 8.21.0→8.22.0, `electron` 42.4.0→42.4.1
- Audit vulnerabilities existed on main before this PR; overrides unblock the dependabot merge queue gate
