# 155 — README skill install boundary

Owner: Codex
Priority: P1
Depends on: none
Release bucket: docs

## Outcome

A fresh user following the README can tell that `bun run install-extension` always installs Letta Code command files, while skill installation requires `MEMORY_DIR` or a manual copy.

## Why this matters

The fresh-user install path currently exits successfully while printing `WARN: MEMORY_DIR not set; skipping skill install.` The README still says the command installs "extension and skills," which overclaims success and hides the first confusing point in the path.

## Scope

- Clarify the README install step for Letta Code extension command files versus optional skills.
- Clarify `INSTALL_FOR_AGENTS.md` so AI agents report skipped skills honestly when `MEMORY_DIR` is not set.
- Record clean-profile proof in this ticket.

## Out of scope

- Changing installer behavior.
- Changing Letta Code runtime behavior.
- Desktop app UI or onboarding changes.
- Hosted agent setup.
- Any publish, merge, tag, release, or remote visibility change.

## Done when

- README no longer claims skills are always installed by `bun run install-extension`.
- `INSTALL_FOR_AGENTS.md` names the `MEMORY_DIR` condition and manual fallback.
- Clean-profile install proof is recorded in the execution receipt.
- Focused docs verification runs without introducing generated or unrelated changes.

## Verification

```sh
git status --short --branch
rg -n "install-extension|MEMORY_DIR|skill install|skills" README.md INSTALL_FOR_AGENTS.md
git diff --check
```

## Blocker log

## Execution receipt

Status: pass
Date: 2026-06-14T14:55:49Z

## What changed

Clarified the fresh-user install path so the README and agent install guide no longer imply that skills are always installed by `bun run install-extension`. The docs now state:

- command files install under `~/.letta/extensions/`;
- automatic skill install requires `MEMORY_DIR=/path/to/agent/memory`;
- when `MEMORY_DIR` is unset, the installer succeeds for command files and prints manual skill copy paths.

## Files changed

- `README.md`
- `INSTALL_FOR_AGENTS.md`
- `planning/hq-tickets/155-readme-skill-install-boundary.md`

## Verification run

- `git status --short --branch` — pass; branch `docs/fresh-user-skill-install-boundary`, only this ticket/docs patch changed.
- `rg -n "install-extension|MEMORY_DIR|skill install|skills|\\.letta/extensions" README.md INSTALL_FOR_AGENTS.md` — pass; both docs name the command/skill boundary.
- `git diff --check` — pass.
- Temp-home installer smoke — pass:

```txt
TMP=/tmp/otto-docfix-install-smoke-wD9mdg
cmd_status=0
$ bun scripts/install.mjs
Otto / Charter repo: /Users/seb/Code/otto-fresh-user-skill-install-boundary
linked  /tmp/otto-docfix-install-smoke-wD9mdg/home/.letta/extensions/charter.ts -> /Users/seb/Code/otto-fresh-user-skill-install-boundary/extension/charter.ts
linked  /tmp/otto-docfix-install-smoke-wD9mdg/home/.letta/extensions/routine.ts -> /Users/seb/Code/otto-fresh-user-skill-install-boundary/extension/routine.ts
WARN: MEMORY_DIR not set; skipping skill install.
      Copy skill/SKILL.md into your agent's skills/charter/ manually.
      Copy skill/routine/SKILL.md into your agent's skills/routine/ manually.
wrote   /tmp/otto-docfix-install-smoke-wD9mdg/home/.charter/charters/active.json
runtime /tmp/otto-docfix-install-smoke-wD9mdg/home/.charter/charters/
Done. Run /reload in Letta Code.
```

## Evidence

Fresh-user path run before the patch, using a clean temp home and public default clone:

```txt
TMP=/tmp/otto-fresh-user-main-6BPO1p
clone_status=0
bun_install_status=0
install_extension_status=0
logs=/tmp/otto-fresh-user-main-6BPO1p/logs

03-install-extension.log
$ bun scripts/install.mjs
Otto / Charter repo: /private/tmp/otto-fresh-user-main-6BPO1p/otto
linked  /tmp/otto-fresh-user-main-6BPO1p/home/.letta/extensions/charter.ts -> /private/tmp/otto-fresh-user-main-6BPO1p/otto/extension/charter.ts
linked  /tmp/otto-fresh-user-main-6BPO1p/home/.letta/extensions/routine.ts -> /private/tmp/otto-fresh-user-main-6BPO1p/otto/extension/routine.ts
WARN: MEMORY_DIR not set; skipping skill install.
      Copy skill/SKILL.md into your agent's skills/charter/ manually.
      Copy skill/routine/SKILL.md into your agent's skills/routine/ manually.
wrote   /tmp/otto-fresh-user-main-6BPO1p/home/.charter/charters/active.json
runtime /tmp/otto-fresh-user-main-6BPO1p/home/.charter/charters/
Done. Run /reload in Letta Code.
```

## Known limitations

- Docs-only fix. The installer still exits 0 when skills are skipped; this ticket intentionally fixes the misleading README/onboarding text, not installer behavior.
- No desktop runtime proof was needed because no desktop code changed.

Reviewer verdict: pending

## Review

Reviewer: Codex independent reviewer
Date: 2026-06-14T14:57:47Z
Verdict: +1

### Checked against

- README no longer claims skills are always installed by `bun run install-extension`: pass; README now says the command installs Letta Code command files under `~/.letta/extensions/` and separates optional skill installation behind `MEMORY_DIR`.
- `INSTALL_FOR_AGENTS.md` names the `MEMORY_DIR` condition and manual fallback: pass; it says skills require `MEMORY_DIR`, skipped skills must be reported honestly, and manual copy paths should be used if skills are required.
- Clean-profile install proof is recorded in the execution receipt: pass; receipt includes clean temp-home/default-clone proof showing exit 0 plus `WARN: MEMORY_DIR not set; skipping skill install.` and manual copy paths.
- Focused docs verification runs without generated or unrelated changes: pass; focused `rg`, `git diff --check`, and temp-home installer smoke were clean.

### Evidence inspected

- Files: `README.md`, `INSTALL_FOR_AGENTS.md`, `scripts/install.mjs`, `package.json`, ticket receipt.
- Commands: `git status --short --branch`; `rg -n "install-extension|MEMORY_DIR|skill install|skills|\\.letta/extensions" README.md INSTALL_FOR_AGENTS.md`; `rg -n "install-extension|scripts/install" package.json`; `git diff --check`; temp-home `bun scripts/install.mjs`.
- UI/artifacts: not applicable; docs-only ticket.
- Git diff: docs-only changes to `README.md` and `INSTALL_FOR_AGENTS.md`.

### Passes

The docs now distinguish command-file installation from optional skill installation, and the clean-profile proof supports the claimed first new-user confusion: the installer succeeds while warning that skills were skipped when `MEMORY_DIR` is unset.

### Defects

None blocking.

### Required changes

None.

### Optional polish

None.

### Finding

No fake done found.

### Final call needed from Sebastian

None; ticket may move to `_Done`.
