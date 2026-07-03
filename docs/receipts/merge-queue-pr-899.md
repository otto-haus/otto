# merge-queue PR #899 receipt

**PR:** https://github.com/otto-haus/otto/pull/899 — unified shipping loop orchestrator

**Agent:** merge_prep babysit subagent (unified shipping loop)

**Date:** 2026-07-03

## Head OID

| Stage | OID |
|-------|-----|
| Before fix (remote PR tip) | `f4ae3d1489aac8fa6bb04812acc1b053e7054587` |
| After fix (pushed) | `6cc7ef18da48b31a47313e2708cf4b514150084a` |

## Rebase

- Fetched `origin/cursor/unified-shipping-loop-orchestrator-0760`.
- PR branch already current; rebase not required.

## CI failure investigation

Failing check stopped at **`dependency audit`** (`bun audit`), not at orchestrator logic.

Advisories (pre-existing on branch tree):

- `dompurify <=3.4.10` via `@otto-haus/desktop › streamdown` (moderate)
- `undici >=7.23.0 <7.28.0` via `@electron/get` / electron toolchain (3 high, 3 moderate, 2 low)

Branch `package.json` had only the `esbuild` override; nested lock entries (`@electron/get/undici@7.27.2`, `mermaid/dompurify@3.4.10`) remained vulnerable.

## Fix applied (PR branch only)

Commit `6cc7ef1` on `cursor/unified-shipping-loop-orchestrator-0760`:

- Root `package.json` overrides merged with existing `esbuild` pin: `dompurify ^3.4.11`, `undici >=7.28.0`

Regenerated `bun.lock` via clean `bun install` (removed workspace `node_modules` first so overrides dedupe nested resolutions).

## CI commands run locally

```sh
bun install                    # after overrides (154 resolved; lockfile saved)
bun audit                      # No vulnerabilities found
bun run typecheck
```

## Push status

**Succeeded:** `git push -u origin cursor/unified-shipping-loop-orchestrator-0760` (`f4ae3d1..6cc7ef1`).

## Blockers / follow-ups

- **Remote CI:** await green on pushed commit.
- **Not merged** (per task: DO NOT merge).
- Audit drift is systemic on `main`; this PR carries a minimal override fix so the shipping-loop orchestrator can land.
