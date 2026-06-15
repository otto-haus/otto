# 157 — Readiness skill install action

Owner: Codex
Priority: P1
Depends on: 155
Release bucket: docs

## Outcome

The Settings readiness surface points fresh users to the same skill install path as the README and package script.

## Why this matters

The fresh-user path now tells users to run `bun run install-extension`, with `MEMORY_DIR` only when they want automatic skill copy. The first setup surface can still show the Skills row action as `Install into a live agent via scripts/install.sh`, which sends users away from the documented path and hides the `MEMORY_DIR` condition.

## Scope

- Update the readiness generator copy for the Skills row.
- Update the committed readiness JSON baseline to match the generator.
- Record clean-profile proof that exposed the stale setup-surface action.

## Out of scope

- Changing installer behavior.
- Changing the Letta runtime or connection logic.
- Running or refreshing `/Applications/otto.app`.
- Rewriting old receipts or historical release evidence that mention `scripts/install.sh`.
- Any publish, merge, tag, release, or remote visibility change.

## Done when

- `apps/desktop/scripts/gen-readiness.mjs` no longer emits the stale `scripts/install.sh` action for Skills.
- `apps/desktop/src/data/readiness.json` no longer tells fresh users to install skills via `scripts/install.sh`.
- The new copy names `bun run install-extension` and the `MEMORY_DIR` condition.
- Focused verification and ticket proof are recorded.

## Verification

```sh
git status --short --branch
rg -n "scripts/install\\.sh|bun run install-extension|MEMORY_DIR|Skills" apps/desktop/scripts/gen-readiness.mjs apps/desktop/src/data/readiness.json README.md INSTALL_FOR_AGENTS.md
git diff --check
```

## Blocker log

## Execution receipt

Status: pass
Date: 2026-06-14T15:10:37Z

## What changed

Updated the Skills readiness action in both:

- `apps/desktop/scripts/gen-readiness.mjs`
- `apps/desktop/src/data/readiness.json`

The setup surface now says:

```txt
Run bun run install-extension; set MEMORY_DIR for automatic skill copy
```

instead of pointing fresh users to `scripts/install.sh`.

## Files changed

- `apps/desktop/scripts/gen-readiness.mjs`
- `apps/desktop/src/data/readiness.json`
- `planning/hq-tickets/157-readiness-skill-install-action.md`

## Verification run

- `git status --short --branch` — pass; branch `docs/fresh-user-skill-install-boundary`, only readiness generator/data plus this ticket changed.
- `rg -n "scripts/install\\.sh|bun run install-extension|MEMORY_DIR|Skills" apps/desktop/scripts/gen-readiness.mjs apps/desktop/src/data/readiness.json README.md INSTALL_FOR_AGENTS.md` — pass; readiness action now matches README/install guide path and no stale `scripts/install.sh` hit remains in the checked fresh-user surfaces.
- `git diff --check` — pass.
- `bun run --cwd apps/desktop typecheck` — first attempt failed because `tsc` was not installed in this isolated worktree:

```txt
$ tsc --noEmit
/opt/homebrew/bin/bash: line 1: tsc: command not found
error: script "typecheck" exited with code 127
```

- `bun install && bun run --cwd apps/desktop typecheck` — pass:

```txt
bun install v1.3.14 (0d9b296a)
Saved lockfile

+ typescript@5.9.3 (v6.0.3 available)

437 packages installed [530.00ms]
$ tsc --noEmit
```

- `bun.lock` churn from `bun install` was removed before receipt; final `git diff --stat` shows only readiness generator/data changes.

## Evidence

Clean candidate-branch clone and install path:

```txt
TMP=/tmp/otto-fresh-user-pr23-ui-Yy3bYd
clone_status=0
bun_install_status=0
install_extension_status=0

03-install-extension.log
$ bun scripts/install.mjs
Otto / Charter repo: /private/tmp/otto-fresh-user-pr23-ui-Yy3bYd/otto
linked  /tmp/otto-fresh-user-pr23-ui-Yy3bYd/home/.letta/extensions/charter.ts -> /private/tmp/otto-fresh-user-pr23-ui-Yy3bYd/otto/extension/charter.ts
linked  /tmp/otto-fresh-user-pr23-ui-Yy3bYd/home/.letta/extensions/routine.ts -> /private/tmp/otto-fresh-user-pr23-ui-Yy3bYd/otto/extension/routine.ts
WARN: MEMORY_DIR not set; skipping skill install.
      Copy skill/SKILL.md into your agent's skills/charter/ manually.
      Copy skill/routine/SKILL.md into your agent's skills/routine/ manually.
wrote   /tmp/otto-fresh-user-pr23-ui-Yy3bYd/home/.charter/charters/active.json
runtime /tmp/otto-fresh-user-pr23-ui-Yy3bYd/home/.charter/charters/
Done. Run /reload in Letta Code.
```

App-facing evidence from generated readiness data in that same clean clone:

```txt
"key": "skills",
"label": "Skills",
"status": "file",
"detail": "SKILL.md · routine/SKILL.md",
"source": "skill/",
"action": "Install into a live agent via scripts/install.sh"
```

Browser note:

```txt
The in-app browser was unavailable in this session: Browser is not available: iab.
Fallback inspection used the local Vite preview, source for Onboarding/Settings, and generated readiness data.
```

Local preview startup evidence:

```txt
VITE v8.0.16 ready in 205 ms
Local: http://127.0.0.1:5187/
```

## Known limitations

- Docs/onboarding-data fix only. This ticket does not change installer behavior or Letta runtime connection logic.
- The readiness generator was not rerun in-place because it rewrites machine-specific workspace source fields; the matching committed data action was updated directly.
- Historical receipts/release docs that mention `scripts/install.sh` were intentionally left unchanged.

Reviewer verdict: pending

## Review

Reviewer: Codex independent reviewer
Date: 2026-06-14T15:13:05Z
Verdict: +1

### Checked against

- Done when item 1: pass. `apps/desktop/scripts/gen-readiness.mjs` Skills action no longer emits `scripts/install.sh`; it now points to `bun run install-extension` and `MEMORY_DIR`.
- Done when item 2: pass. `apps/desktop/src/data/readiness.json` Skills action matches the generator and does not point fresh users to `scripts/install.sh`.
- Done when item 3: pass. The checked fresh-user surfaces name `bun run install-extension` and the `MEMORY_DIR` condition.
- Done when item 4: pass. The execution receipt records focused verification, the clean-profile stale-surface evidence, the browser fallback, and the initial typecheck setup failure plus post-install pass.

### Evidence inspected

- Files: `AGENTS.md`, `planning/hq-tickets/AGENTS.md`, `planning/hq-tickets/000-canonical.md`, `planning/hq-tickets/000-index.md`, `planning/hq-tickets/000-workflow.md`, this ticket, `README.md`, `INSTALL_FOR_AGENTS.md`, `apps/desktop/scripts/gen-readiness.mjs`, `apps/desktop/src/data/readiness.json`.
- Commands: `git status --short --branch`; `git diff --stat`; `git diff -- apps/desktop/scripts/gen-readiness.mjs apps/desktop/src/data/readiness.json README.md INSTALL_FOR_AGENTS.md planning/hq-tickets/_InReview/157-readiness-skill-install-action.md`; `rg -n "scripts/install\\.sh|bun run install-extension|MEMORY_DIR|Skills" apps/desktop/scripts/gen-readiness.mjs apps/desktop/src/data/readiness.json README.md INSTALL_FOR_AGENTS.md`; `rg -n "scripts/install\\.sh" README.md INSTALL_FOR_AGENTS.md apps/desktop/src apps/desktop/scripts`; `git diff --check`; `bun run --cwd apps/desktop typecheck`.
- UI/artifacts: no live app or `/Applications/otto.app` action run. The ticket's browser fallback note was inspected and is honest.
- Git diff: only `apps/desktop/scripts/gen-readiness.mjs` and `apps/desktop/src/data/readiness.json` change, with the Skills action copy updated in both.

### Passes

The implementation satisfies the ticket scope and avoids installer/runtime behavior changes. Current typecheck passes, `git diff --check` is clean, and no checked fresh-user surface still routes users to `scripts/install.sh`.

### Defects

None.

### Required changes

None.

### Optional polish

None.

### Finding

The ticket may move to `_Done`; I did not move it per the review prompt.

### Final call needed from Sebastian

None for this review.
