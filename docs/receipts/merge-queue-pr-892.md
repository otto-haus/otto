# merge-queue receipt: PR #892

**PR:** https://github.com/otto-haus/otto/pull/892  
**Branch:** `dependabot/bun/types/node-26.0.0`  
**Worker:** merge_prep babysit (tick 002 follow-up)  
**Date:** 2026-06-30

## Head OIDs

| Stage | OID |
|-------|-----|
| Before fix | `b64fbabdb247b34ffd330b215de836fba894baf6` |
| After fix | `c5f3a6cfba928f3a3b949e2907ed199a9b8659a2` |

## CI failure diagnosed

PR failed `checks` and `scheduled-checks` on the **dependency audit** step (`bun audit`).

Vulnerabilities (pre-fix):

- `dompurify <=3.4.10` — transitive via `@otto-haus/desktop` → `streamdown` (moderate)
- `undici >=7.23.0 <7.28.0` — transitive via electron toolchain (3 high, 3 moderate, 2 low)

Same pattern as PR #891.

## Fix applied

Root `package.json` overrides (mirrors #891):

```json
"dompurify": "^3.4.11",
"undici": ">=7.28.0"
```

Regenerated `bun.lock` via `bun install`.

Commit: `fix(deps): override dompurify and undici for clean bun audit`

## Local verification

```sh
bun install --frozen-lockfile   # exit 0
bun run typecheck               # exit 0
bun audit                       # No vulnerabilities found
```

## Push

Target: `origin/dependabot/bun/types/node-26.0.0` (PR head).  
Merge: **not performed** (babysit only).
