# 158 - Settings Retry vs Override Copy

Owner: Codex
Priority: P1
Depends on: 157
Release bucket: fresh-user-install-readme

## Outcome

A fresh user who remains disconnected after launch understands Settings as the normal place to read the blocker and retry, while the URL/Agent ID fields stay framed as advanced overrides.

## Why this matters

The current fresh-user path sends disconnected users to Settings, but nearby copy says Settings is only for advanced overrides. That makes the first blocked moment feel contradictory instead of actionable.

## Scope

- Clarify README connection steps after auto-discovery.
- Clarify first-run onboarding copy for the disconnected state.
- Clarify the Settings Letta panel copy.
- Keep the change to docs/onboarding copy only.

## Out of scope

- Runtime discovery behavior.
- Letta connection/session code.
- Provider/model credential handling.
- Browser/runtime staging proof against live apps.
- Broad onboarding redesign.

## Done when

- README names Settings as the blocker/retry surface when auto-discovery does not connect.
- First-run onboarding no longer says Settings is only for advanced overrides while routing the user there.
- Settings Letta panel distinguishes blocker/retry from advanced URL/Agent ID fields.
- No runtime behavior changes are made.
- Focused verification and proof are recorded in this ticket.

## Verification

Commands/checks to run:

```sh
git status --short --branch
rg -n "Open Settings|advanced override|auto-discovery|blocker|reconnect|Settings" README.md apps/desktop/src/Onboarding.tsx apps/desktop/src/surfaces/Panes.tsx apps/desktop/src/surfaces/Chat.tsx
git diff --check
bun run --cwd apps/desktop typecheck
```

## Blocker log

## Execution receipt

- repo path: `/Users/seb/Code/otto-fresh-user-skill-install-boundary`
- branch: `docs/fresh-user-skill-install-boundary`
- git status before review move: `README.md`, `apps/desktop/src/Onboarding.tsx`, and `apps/desktop/src/surfaces/Panes.tsx` modified; this ticket added.
- files changed:
  - `README.md`
  - `apps/desktop/src/Onboarding.tsx`
  - `apps/desktop/src/surfaces/Panes.tsx`
  - `planning/hq-tickets/158-settings-retry-vs-override-copy.md`
- implemented:
  - README now says disconnected users should open Settings -> General to read the blocker and retry, editing runtime/agent fields only if auto-discovery picked the wrong target.
  - First-run onboarding now says Open Settings is for blocker/retry, while overrides are only for wrong discovery targets.
  - Settings Letta panel now distinguishes blocker/reconnect from advanced URL/Agent ID fields.
  - No runtime discovery, session, provider, or connection code changed.
- commands run:
  - `git status --short --branch`
  - `rg -n "Open Settings|advanced override|auto-discovery|blocker|reconnect|Settings" README.md apps/desktop/src/Onboarding.tsx apps/desktop/src/surfaces/Panes.tsx apps/desktop/src/surfaces/Chat.tsx`
  - `git diff --check`
  - `bun run --cwd apps/desktop typecheck`
- test/build output:
  - `git diff --check`: passed with no output.
  - `bun run --cwd apps/desktop typecheck`: passed (`$ tsc --noEmit`).
- proof mapped to Done when:
  - README criterion: `README.md:207` now names Settings -> General as blocker/retry surface.
  - Onboarding criterion: `apps/desktop/src/Onboarding.tsx:121` now says Open Settings is for blocker/retry and overrides are only for wrong discovery targets.
  - Settings panel criterion: `apps/desktop/src/surfaces/Panes.tsx:1669` now says the panel is for blocker/reconnect and fields are edited only when discovery picks the wrong target.
  - Runtime behavior criterion: diff touches only README text and display strings; no connection logic changed.
- screenshots/artifacts:
  - not produced; this is a copy-only correction verified by source inspection and typecheck.
- known gaps:
  - No live Letta connection proof was attempted; ticket scope is docs/onboarding copy only.

## Review

Reviewer: Codex
Date: 2026-06-14
Verdict: +1

### Checked against

- README names Settings as blocker/retry surface: pass. `README.md:207` now tells a disconnected fresh user to open Settings -> General to read the blocker and retry, and frames runtime/agent edits as only for wrong auto-discovery targets.
- First-run onboarding no longer frames Settings as only advanced overrides while routing there: pass. `apps/desktop/src/Onboarding.tsx:121` says Open Settings is for blocker/retry and narrows overrides to wrong discovery targets.
- Settings Letta panel distinguishes blocker/retry from advanced URL/Agent ID fields: pass. `apps/desktop/src/surfaces/Panes.tsx:1669` names blocker/reconnect; `:1676` and `:1686` still label the URL and Agent ID fields as advanced overrides.
- No runtime behavior changes: pass. The diff is three copy changes in `README.md`, `Onboarding.tsx`, and `Panes.tsx`; no `Chat.tsx` diff and no connection/session code changes.
- Focused verification and proof recorded: pass. The execution receipt maps proof to each Done when item, and reviewer re-ran focused checks.

### Evidence inspected

- Files: `README.md`, `apps/desktop/src/Onboarding.tsx`, `apps/desktop/src/surfaces/Panes.tsx`, `apps/desktop/src/surfaces/Chat.tsx`.
- Git diff: `README.md`, `Onboarding.tsx`, and `Panes.tsx` only; 3 insertions and 3 deletions.
- Commands:
  - `git status --short --branch`
  - `git diff -- README.md apps/desktop/src/Onboarding.tsx apps/desktop/src/surfaces/Panes.tsx apps/desktop/src/surfaces/Chat.tsx`
  - `git diff --name-only -- README.md apps/desktop/src/Onboarding.tsx apps/desktop/src/surfaces/Panes.tsx apps/desktop/src/surfaces/Chat.tsx`
  - `rg -n "Open Settings|advanced override|advanced overrides|auto-discovery|blocker|reconnect|Settings|connected|disconnected" README.md apps/desktop/src/Onboarding.tsx apps/desktop/src/surfaces/Panes.tsx apps/desktop/src/surfaces/Chat.tsx`
  - `git diff --check`
  - `bun run --cwd apps/desktop typecheck`

### Passes

- Copy now treats Settings as the normal blocker/retry surface without making the override fields feel like the primary fresh-user path.
- No connected-state overclaim found; existing Chat copy continues to show `not connected` and exposes Retry/Open Settings when runtime is not ready.
- `git diff --check` passed with no output.
- `bun run --cwd apps/desktop typecheck` passed (`tsc --noEmit`).

### Defects

- None found.

### Required changes

- None.

### Optional polish

- None required for this ticket.

### Residual risk

- No browser/runtime staging proof was produced or re-run; acceptable for this copy-only ticket, but visual wrapping was not inspected.

### Final call needed from Sebastian

- None. Ticket may move to `_Done`.
