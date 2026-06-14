# 153 - Readiness Generator Local Config Opt-In

Owner: Codex
Priority: P1
Related: 038, 150
Release bucket: v0.1 functional ship

## Outcome

`apps/desktop/scripts/gen-readiness.mjs` produces a deterministic committed preview baseline by default, without copying machine-local Letta agent/config state into `apps/desktop/src/data/readiness.json`.

## Why this matters

otto's readiness panel is a trust surface. A normal local build should not turn Sebastian's current `~/.otto/config.json` into committed product preview data, nor imply a bundled preview has a configured agent.

## Scope

- Review the readiness generator and generated fixture.
- Keep live diagnostic rendering possible behind explicit opt-in.
- Add a producer-level regression test.
- Regenerate `apps/desktop/src/data/readiness.json` through the patched script.

## Out of scope

- Reworking the Settings shell from ticket 150.
- Changing runtime connection semantics.
- Reading or printing any secret values.
- Opening a remote PR without Sebastian approval.

## Critique pass - 2026-06-14 Codex

Feature reviewed: Settings readiness preview generation.

Design decisions:

- Right: readiness data is generated from low-risk local facts instead of hand-maintained copy.
- Right: provider auth remains explicitly owned by Letta, not otto.
- Wrong: the generator defaulted to reading machine-local config. Because `predev` and `prebuild` run `gen:readiness`, ordinary local work could rewrite the committed preview fixture with a real agent id and `~/.otto/config.json` source.
- Right fix: committed output should be baseline by default; local diagnostic output should require an explicit env opt-in.

Docs/best-practice context:

- Context7 Node.js docs confirm child processes inherit `process.env` by default, while `execFileSync` can pass an explicit `env` map for deterministic script tests.
- Context7 Node.js docs confirm `execFileSync` throws on non-zero exit and waits for the child process to close, which makes it suitable for a focused generator regression test.

## Rebuild

- Added `OTTO_READINESS_INCLUDE_LOCAL_CONFIG=1` as the explicit gate for reading local readiness config.
- Preserved `OTTO_READINESS_IGNORE_LOCAL_CONFIG=1` as an override.
- Added test-only `OTTO_READINESS_OUTPUT_PATH` and `OTTO_READINESS_CONFIG_PATH` so the real script can be tested without touching the repo fixture.
- Regenerated `apps/desktop/src/data/readiness.json` through the patched script; it now shows `configSource: null`, runtime source `null`, and agent status `missing` in the committed baseline.

## Done when

- [x] Default generator run ignores local config even when a config file exists.
- [x] Explicit opt-in generator run can still render local config for diagnostics.
- [x] Committed `readiness.json` has no machine-local agent id or config source.
- [x] Focused generator tests pass.
- [x] Desktop typecheck passes.
- [ ] Independent reviewer +1.
- [ ] PR opened after approval and clean branch review.

## Verification

```sh
node apps/desktop/scripts/gen-readiness.mjs
bun test ./apps/desktop/scripts/gen-readiness.test.ts
bun run --cwd apps/desktop typecheck
```

Result: all passed on 2026-06-14.

## Blocker log

- Independent reviewer +1 pending.
- PR not opened: remote publication is approval-gated, and the worktree contains unrelated dirty files outside this ticket.
