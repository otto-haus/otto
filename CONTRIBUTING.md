# Contributing to Charter

Charter is a local-first goal operating system for long-running AI agents. Keep the
core generic: org-specific doctrine, gates, and templates belong in a separate
private repo, not here.

## Principles

- The human owns goal legitimacy; the agent owns goal operations.
- One-way doors require human approval — never weaken a gate silently.
- Keep the charter contract compact; detail lives in `notes/`.
- Completion requires evidence (receipts), not assertions.

## Dev

- The extension is a single file: `extension/charter.ts` (Letta Code extension API).
- The workflow is a single skill: `skill/SKILL.md`.
- After editing the extension, run `/reload` in Letta Code.
- Prefer deterministic, fast permission checks. Asking is cheap; bypassing is not.

## Adding gates

Extend `BASH_GATES`, `SECRET_PATH`, or `TOOL_NAME_GATE` in `extension/charter.ts`.
Add a row to `docs/gates.md`. Keep patterns conservative to avoid false negatives on
irreversible actions.

## PRs

- Keep changes focused.
- Update docs alongside behavior changes.
- No emojis in code or templates unless explicitly requested.
