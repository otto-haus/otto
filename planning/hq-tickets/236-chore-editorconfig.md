# 236 - Cover MDX docs in editor config

Status: Active
Owner: Codex
Lane: ci

## Outcome

Editors treat MDX docs like Markdown for trailing whitespace, so local editing does not fight intentional Markdown/MDX line-break syntax before CI.

## What changed

- Changed the Markdown trailing-whitespace exception from `[*.md]` to `[*.{md,mdx}]`.

## Why

The repo already has a root `.editorconfig` and a Mintlify DevEx docs tree under `devex/*.mdx`. MDX is Markdown-flavored content, so it should inherit the same trailing-whitespace exception used for `.md` files.

## Done when

- `.editorconfig` still declares `root = true`.
- Default files still use UTF-8, LF endings, final newlines, two-space indentation, and trailing whitespace trimming.
- Markdown and MDX keep trailing whitespace allowed.
- The full local gate still passes.
- The PR's own `CI / checks` run passes.

## Execution receipt

- 2026-06-14: Context7 lookup for EditorConfig/tooling syntax was attempted, but the configured Context7 quota was exceeded; used the official EditorConfig reference as fallback.
- 2026-06-14: `bun install --frozen-lockfile` passed in `/tmp/otto-ci-editorconfig`.
- 2026-06-14: Verified `.editorconfig` still has `root = true`, includes `[*.{md,mdx}]`, and maps that section to `trim_trailing_whitespace = false`.
- 2026-06-14: `git diff --check` passed before commit.
- 2026-06-14: `task ci` passed on a clean worktree, including typechecks, tests, `verify:v0`, Mintlify validate/link checks, desktop build, `bun audit`, whitespace, and clean-diff checks.
- 2026-06-14: `git diff --check HEAD~1 HEAD` passed.
