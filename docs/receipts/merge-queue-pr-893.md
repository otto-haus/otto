# merge-queue babysit receipt — PR #893

**PR:** https://github.com/otto-haus/otto/pull/893  
**Branch:** `dependabot/bun/multi-dd1c4363d0`  
**Title:** deps(deps): bump archiver and @types/archiver  
**Worker:** merge_prep babysit (tick 002)  
**Date:** 2026-06-30  

## Head OID

| Stage | OID |
|-------|-----|
| Before fix | `f3fbd49c46d1e060f2613635b4d62e4c9676912f` |
| After fix | `497e9f3bbdd6cb2b0cd34427fb0055aaa58528ee` |

## Diagnosis

CI failed on **checks**, **embedded-letta-release-gate**, and **scheduled-checks** — not solely on `bun audit`:

1. **Primary:** `archiver@8` removed the default export factory. `apps/desktop/electron/zip-directory.ts` used `import archiver from 'archiver'` / `archiver('zip', …)`, causing TS1192 and rolldown `MISSING_EXPORT` during `electron:build`.
2. **Secondary (would fail after typecheck):** `bun audit` reported `dompurify` and `undici` advisories (same pattern as #891/#892).

Branch was already up to date with `origin/main` (merge-base `5869ad7`); no rebase required.

## Fix applied

1. **`apps/desktop/electron/zip-directory.ts`** — use `ZipArchive` from `archiver` v8 ESM API instead of default-import factory.
2. **Root `package.json` overrides** — `"dompurify": "^3.4.11"`, `"undici": ">=7.28.0"` (alongside existing `esbuild` override).
3. **`bun.lock`** — refreshed via `bun install`.

Commit: `fix(deps): archiver v8 ZipArchive import + audit overrides for PR #893`

## Local verification

```sh
bun install --frozen-lockfile   # pass
bun run typecheck               # pass
bun run --cwd apps/desktop typecheck           # pass
bun run --cwd apps/desktop electron:typecheck  # pass
bun test apps/desktop/electron/zip-directory.test.ts  # pass
env OTTO_READINESS_IGNORE_LOCAL_CONFIG=1 bun run --cwd apps/desktop electron:build  # pass
bun audit                       # pass — No vulnerabilities found
```

## Push

Pushed to `origin/dependabot/bun/multi-dd1c4363d0` (not merged).

## Out of scope

- Did **not** merge or close PR #893.
- Did **not** push to `main`.
