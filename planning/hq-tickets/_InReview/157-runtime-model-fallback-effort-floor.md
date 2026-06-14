# 157 - Runtime Model Fallback Effort Floor

Owner: Codex
Priority: P1
Related: 039, 076, 078
Release bucket: v0.1 runtime

## Outcome

Runtime invalid-model fallback retries unavailable model presets without ever raising the selected reasoning effort above the user's configured preference.

## Why this matters

Settings exposes model and reasoning effort as operator preferences. Falling back from an unavailable preset is useful, but silently retrying a `low` or `off` selection at `medium`, `high`, or `max` breaks the user's runtime intent and makes the connection path less truthful.

## Scope

- Review `modelInitAttempts()` ordering for invalid-model recovery.
- Preserve direct-handle and alternate-provider fallback behavior.
- Ensure fallback attempts move only from selected effort to lower effort.
- Cap alternate provider attempts at medium-or-lower while also respecting lower user choices.
- Add focused runtime-common tests for `low` and `off`.

## Out of scope

- Changing Settings UI or provider picker copy.
- Changing model preset names.
- Changing `SdkSubprocessTransport` retry orchestration.
- Live Letta runtime smoke; this is pure fallback-order logic.
- Opening a remote PR without Sebastian approval.

## Critique pass - 2026-06-14 Codex

Feature reviewed: runtime invalid-model fallback.

Design decisions:

- Right: invalid model errors should recover automatically where possible instead of leaving Chat disconnected on a stale preset.
- Right: named presets are tried before direct provider handles because some Letta builds accept one form and not another.
- Wrong: the previous fallback order rotated through the full effort list, so selecting `low` or `off` could retry higher-effort presets.
- Wrong: alternate provider direct handles could inherit `max` or `high` from the selected effort even though alternate attempts were intended to be conservative.
- Right fix: treat `EffortLevel` as an ordered preference and only try the selected effort plus lower-effort variants. Alternate providers stay capped at medium-or-lower and also respect `low`/`off`.

Docs/best-practice context:

- Context7 TypeScript docs describe string literal unions as a way to restrict APIs to a finite set of accepted values.
- That supports treating `EffortLevel = off | low | medium | high | max` as a finite ordered contract rather than an arbitrary string to rotate through.
- Exa was not available in this session; tool discovery exposed Context7 but no Exa capability.

## Rebuild

- Added `fallbackEffortsFrom()` so model fallback slices the ordered effort list downward from the selected value.
- Added `alternateFallbackEffortsFrom()` so alternate provider attempts are both medium-capped and no higher than the user's selected effort.
- Added focused coverage that `low` never retries `medium`/`high`, and `off` never retries `low`/`medium`/`high`.

## Done when

- [x] `high` still steps down to lower presets and can try direct handles/alternates.
- [x] `low` fallback never emits medium, high, or max attempts.
- [x] `off` fallback emits only off attempts.
- [x] Focused runtime-common tests pass.
- [x] Electron typecheck passes after final edit.
- [x] Independent reviewer +1.
- [ ] PR opened after approval and clean branch review.

## Execution receipt

Repo path: `/Users/seb/Code/otto`

Branch: `ship/functional-labs`

Git status summary:

- Dirty worktree with multiple unrelated in-progress files.
- Ticket 157 shares `apps/desktop/electron/runtime-transport/runtime-common.ts` and `.test.ts` with existing uncommitted runtime model fallback work.
- Ticket-scoped files: `apps/desktop/electron/runtime-transport/runtime-common.ts`, `apps/desktop/electron/runtime-transport/runtime-common.test.ts`.
- Ticket receipt file: `planning/hq-tickets/_InReview/157-runtime-model-fallback-effort-floor.md`.

Files changed:

- `apps/desktop/electron/runtime-transport/runtime-common.ts`
- `apps/desktop/electron/runtime-transport/runtime-common.test.ts`
- `planning/hq-tickets/_InReview/157-runtime-model-fallback-effort-floor.md`

Commands run:

```sh
bun test ./apps/desktop/electron/runtime-transport/runtime-common.test.ts
bun run --cwd apps/desktop electron:typecheck
git diff --check -- apps/desktop/electron/runtime-transport/runtime-common.ts apps/desktop/electron/runtime-transport/runtime-common.test.ts
rg -n "[[:blank:]]$" apps/desktop/electron/runtime-transport/runtime-common.ts apps/desktop/electron/runtime-transport/runtime-common.test.ts planning/hq-tickets/_InReview/157-runtime-model-fallback-effort-floor.md
```

Result: tests/typecheck/diff-check passed on 2026-06-14. The trailing-whitespace `rg` check returned no matches, as expected.

Proof mapped to Done when:

- High fallback proof: `steps down effort presets before trying direct handle and alternates`.
- Low/off floor proof: `never retries above the selected effort`.

Known gaps:

- PR not opened because remote publication is approval-gated and the worktree contains unrelated dirty files.

## Review

Reviewer: GoalBuddy Judge subagent (`019ec6af-457c-74e3-9dff-5ef36eceea59`)
Date: 2026-06-14
Verdict: +1

### Checked against Done when

- High still steps down and can try direct handles/alternates: Pass.
- Low fallback never emits medium/high/max attempts: Pass.
- Off fallback emits only off attempts: Pass.
- Focused runtime-common tests: Pass.
- Electron typecheck: Pass.

### Evidence

- `runtime-common.ts` emits selected effort plus lower presets, direct handle at selected effort, and alternates capped through `alternateFallbackEffortsFrom`.
- `runtime-common.test.ts` covers high stepdown and low/off effort floors.
- `sdk-subprocess-transport.ts` calls `modelInitAttempts()` and only continues fallback on invalid-model errors.
- Reviewer reran or accepted passing evidence for `bun test ./apps/desktop/electron/runtime-transport/runtime-common.test.ts`, `bun run --cwd apps/desktop electron:typecheck`, scoped `git diff --check`, and trailing-whitespace scan.

### Remaining gate

PR/open-state Done when remains approval-gated and not complete.
