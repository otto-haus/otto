# 156 — README desktop launch choice

Owner: Codex
Priority: P1
Depends on: 155
Release bucket: docs

## Outcome

A fresh user can tell the difference between the development desktop path and the installed app path before trying to connect otto to Letta.

## Why this matters

After the install-extension wording fix, the next confusing README handoff is the desktop launch section. It lists both `task electron` and `task refresh`, then the connection steps say to open `/Applications/otto.app`. That path only applies after `task refresh`; a user who chose `task electron` already has the dev app open.

## Scope

- Clarify that `task electron` is the development launch path and keeps the app open from the terminal.
- Clarify that `task refresh` builds, installs, and opens `/Applications/otto.app`.
- Clarify the matching connection step for each path.
- Mirror the same distinction in `INSTALL_FOR_AGENTS.md`.
- Record clean-profile proof in this ticket.

## Out of scope

- Changing Taskfile behavior.
- Changing Electron runtime behavior.
- Running `task refresh` or writing to `/Applications/otto.app`.
- Any publish, merge, tag, release, or remote visibility change.

## Done when

- README no longer sends users who chose `task electron` to open `/Applications/otto.app`.
- README names `/Applications/otto.app` only as the installed-app path after `task refresh`.
- `INSTALL_FOR_AGENTS.md` distinguishes web preview, development Electron, and installed-app checks.
- Clean-profile proof for install plus `task electron` startup is recorded.
- Focused docs verification runs without unrelated changes.

## Verification

```sh
git status --short --branch
rg -n "task electron|task refresh|/Applications/otto\\.app|development Electron|installed app|electron:dev|dev" README.md INSTALL_FOR_AGENTS.md
git diff --check
```

## Blocker log

## Execution receipt

Status: pass
Date: 2026-06-14T15:02:55Z

## What changed

Clarified the desktop launch section so users choose between:

- `task electron` for a development Electron app that stays open from the terminal;
- `task refresh` for the installed macOS app path that writes and opens `/Applications/otto.app`.

The Letta connection step now tells the user to use the window from whichever launch path they chose. `INSTALL_FOR_AGENTS.md` now distinguishes web preview, development Electron, and installed-app checks, and tells agents not to report the installed app as tested unless they deliberately ran the installed-app path.

## Files changed

- `README.md`
- `INSTALL_FOR_AGENTS.md`
- `planning/hq-tickets/156-readme-desktop-launch-choice.md`

## Verification run

- `git status --short --branch` — pass; branch `docs/fresh-user-skill-install-boundary`, only `README.md`, `INSTALL_FOR_AGENTS.md`, and this ticket changed for ticket 156.
- `rg -n "task electron|task refresh|/Applications/otto\\.app|development Electron|installed app|electron:dev|dev" README.md INSTALL_FOR_AGENTS.md` — pass; docs now name the launch paths and installed-app boundary.
- `git diff --check` — pass.

## Evidence

Fresh-user candidate path with PR 23 applied, clean temp home, and remote branch clone:

```txt
TMP=/tmp/otto-fresh-user-pr23-f7YxTB
clone_status=0
bun_install_status=0
install_extension_status=0
task_list_status=0
logs=/tmp/otto-fresh-user-pr23-f7YxTB/logs

03-install-extension.log
$ bun scripts/install.mjs
Otto / Charter repo: /private/tmp/otto-fresh-user-pr23-f7YxTB/otto
linked  /tmp/otto-fresh-user-pr23-f7YxTB/home/.letta/extensions/charter.ts -> /private/tmp/otto-fresh-user-pr23-f7YxTB/otto/extension/charter.ts
linked  /tmp/otto-fresh-user-pr23-f7YxTB/home/.letta/extensions/routine.ts -> /private/tmp/otto-fresh-user-pr23-f7YxTB/otto/extension/routine.ts
WARN: MEMORY_DIR not set; skipping skill install.
      Copy skill/SKILL.md into your agent's skills/charter/ manually.
      Copy skill/routine/SKILL.md into your agent's skills/routine/ manually.
wrote   /tmp/otto-fresh-user-pr23-f7YxTB/home/.charter/charters/active.json
runtime /tmp/otto-fresh-user-pr23-f7YxTB/home/.charter/charters/
Done. Run /reload in Letta Code.

04-task-list.log
task: Available tasks for this project:
* electron:                 Desktop — Electron app wired to the live Letta runtime
* refresh:                  Build + package + install to /Applications/otto.app + open      (aliases: deploy)
* smoke:desktop:            Non-destructive desktop smoke — launches a temporary second instance, leaves live otto.app alone
* smoke:desktop:live:       DANGEROUS — quits/reopens the live installed app; use only when Sebastian is not chatting in it
```

`task electron` startup proof from the same temp clone and clean home:

```txt
$ electron-vite dev
vite v8.0.16 building ssr environment for development...
out/main/index.cjs  318.23 kB
electron main process built successfully
out/preload/index.cjs  3.47 kB
electron preload scripts built successfully
dev server running for the electron renderer process at:

  Local:   http://localhost:5173/

starting electron app...
```

The temp dev process was stopped with Ctrl-C after startup proof:

```txt
task: Signal received: "interrupt"
task: Failed to run task "electron": exit status 130
```

Follow-up process check:

```txt
ps aux | rg '/tmp/otto-fresh-user-pr23-f7YxTB' | rg -v 'rg ' || true
```

returned no matching processes.

## Known limitations

- Docs-only fix. The ticket does not change `task electron`, `task refresh`, or Electron behavior.
- `task refresh` was intentionally not run because it writes `/Applications/otto.app`.
- No connected-state claim is made; the proof only covers install/readme path and development Electron startup.

Reviewer verdict: pending

## Review

Reviewer: Codex independent reviewer
Date: 2026-06-14T15:05:12Z
Verdict: +1

### Checked against

- README no longer sends users who chose `task electron` to open `/Applications/otto.app`: pass. The connection step says to use the window from the selected launch path.
- README names `/Applications/otto.app` only as the installed-app path after `task refresh`: pass. README uses the path in the `task refresh` launch/install context.
- `INSTALL_FOR_AGENTS.md` distinguishes web preview, development Electron, and installed-app checks: pass. It separates web preview from development Electron and warns not to claim installed-app testing unless `task refresh` was deliberately run.
- Clean-profile proof for install plus `task electron` startup is recorded: pass. The receipt records clean temp-home install output, task list output, development Electron startup output, Ctrl-C shutdown, and the narrowed temp-clone process check.
- Focused docs verification runs without unrelated changes: pass. Focused `rg` checks and `git diff --check` passed; current diff is limited to `README.md` and `INSTALL_FOR_AGENTS.md`, with the ticket file untracked in `_InReview`.

### Evidence inspected

- Files: `README.md`, `INSTALL_FOR_AGENTS.md`, `Taskfile.yml`, `planning/hq-tickets/_InReview/156-readme-desktop-launch-choice.md`.
- Commands: `git status --short --branch`; `rg -n "task electron|task refresh|/Applications/otto\\.app|development Electron|installed app|electron:dev|dev" README.md INSTALL_FOR_AGENTS.md`; `rg -n 'Open `/Applications/otto\\.app`|open `/Applications/otto\\.app`|Use the window from your launch path|development app|installed-app path|installed app|Web preview only|Development Electron' README.md INSTALL_FOR_AGENTS.md planning/hq-tickets/_InReview/156-readme-desktop-launch-choice.md`; `rg -n 'connected|live|session\\.initialize|No connected-state claim|task refresh|task electron|process check|ps aux' planning/hq-tickets/_InReview/156-readme-desktop-launch-choice.md README.md INSTALL_FOR_AGENTS.md`; `git diff --check`; `git diff -- README.md INSTALL_FOR_AGENTS.md`.
- UI/artifacts: no UI run required for this docs-only ticket; ticket receipt includes clean-profile startup artifact excerpts.
- Git diff: only README and install-agent docs changed in tracked diff; no Taskfile or runtime behavior changes.

### Passes

The docs now route `task electron` users to the already-open development app window, keep `/Applications/otto.app` tied to the `task refresh` installed-app path, and avoid connected/live claims. The receipt also honestly states that `task refresh` was not run.

### Defects

None found.

### Required changes

None.

### Optional polish

None.

### Finding

Ticket 156 satisfies every Done when item without scope creep.

### Final call needed from Sebastian

Ticket may move to `_Done`; reviewer did not move it.
