# merge-queue PR #894 receipt

**PR:** https://github.com/otto-haus/otto/pull/894 — `ci(deps): bump actions/checkout from 6.0.3 to 7.0.0`

**Agent:** merge_prep babysit subagent (unified shipping loop)

**Date:** 2026-06-29

## Head OID

| Stage | OID |
|-------|-----|
| Before fix (remote PR tip) | `a2d74141bf4ef653f5eb895bf06f89e7bdb1473a` |
| After fix (pushed) | `497b7b295f995dcf61ebc2545b752344619d1e02` |

## Rebase

- Fetched `origin/main` (`5869ad7ecdb6c4110f51e0fc4244e083e052e470`).
- PR branch already based on current `main`; rebase not required.

## CI failure investigation

Both failing checks (`checks`, `scheduled-checks`) stopped at **`dependency audit`** (`bun audit`), not at the `actions/checkout` bump.

Advisories (pre-existing on `main` tree; new since last green main CI on 2026-06-16):

- `dompurify <=3.4.10` via `@otto-haus/desktop › streamdown` (moderate)
- `undici >=7.23.0 <7.28.0` via `@electron/get` / electron toolchain (3 high, 3 moderate, 2 low)

## Fix applied (PR branch only)

Commit `497b7b2` on `dependabot/github_actions/actions/checkout-7.0.0`:

- Root `package.json` overrides: `dompurify ^3.4.11`, `undici >=7.28.0`
- Regenerated `bun.lock`

## CI commands run locally

```sh
bun install --frozen-lockfile   # initial repro (8 vulns)
bun audit                       # after fix: No vulnerabilities found
bun run typecheck
bun run --cwd apps/desktop typecheck
bun run --cwd apps/desktop electron:typecheck
bun run check:docs-tools
env OTTO_READINESS_IGNORE_LOCAL_CONFIG=1 bun run --cwd apps/desktop electron:build
bun audit
```

Partial `bun run ci` also run; stopped at one Linux-local unit test flake (`queue-storage > clearQueueStorage removes queue and inflight keys`). GitHub CI had already passed all tests before the audit gate on the prior run.

## Push status

**Succeeded:** `git push origin dependabot/github_actions/actions/checkout-7.0.0` (`a2d7414..497b7b2`).

## Blockers / follow-ups

- **Remote CI:** green on `497b7b2` — `checks` and `scheduled-checks` both **SUCCESS** (2026-06-29).
- **Not merged** (per task: DO NOT merge).
- **No AGENT_LOOP_* schedules armed** (per task).
- Audit drift is systemic on `main`; this PR carries a minimal override fix so the checkout bump can land. Consider a dedicated main-line fix if other open PRs need the same overrides without duplicating commits.
