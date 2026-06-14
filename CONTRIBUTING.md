# Contributing to Otto

Otto is the behavior layer for persistent AI agents. Keep the core generic:
org-specific doctrine, gates, and templates belong in a separate private repo, not here.

## Principles

- The human owns legitimacy; the agent owns operations.
- One-way doors require human approval — never weaken a gate silently.
- Keep the charter contract compact; detail lives in `notes/`.
- Completion requires evidence (receipts), not assertions.

## Dev

- Install dependencies from the committed lockfile:

  ```sh
  bun install --frozen-lockfile
  ```

- Run the local CI gate before opening a PR:

  ```sh
  task ci
  ```

  This wraps `scripts/ci-local-gate.sh`, the same gate GitHub Actions runs. If
  `task` is not installed yet, run the script directly:

  ```sh
  bash scripts/ci-local-gate.sh
  ```

- The extension is two files: `extension/charter.ts` (Charter operating contracts + permission gates — the Letta Code extension API) and `extension/routine.ts` (Routines — repeated bundles of Practices).
- The skills mirror them: `skill/SKILL.md` (charter) and `skill/routine/SKILL.md` (routine).
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
