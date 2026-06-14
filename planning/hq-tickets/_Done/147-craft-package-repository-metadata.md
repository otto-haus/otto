# 147 — Root package.json: add repository/homepage/bugs metadata

Owner: Claude
Priority: P2
Depends on: none
Release bucket: later-generated

## Outcome

The root `package.json` carries the standard npm provenance fields —
`repository`, `homepage`, `bugs` — so registry pages, `npm`/tooling, and editors
can link the package back to its source, site, and issue tracker.

## Why this matters

OSS-hygiene craft — the little stuff that signals a package is cared for. The
manifest already declares `name`, `description`, `license: MIT`, `keywords`,
and a `files` allow-list (i.e. it is meant to be publishable), but had no
`repository` field. `npm publish` warns on a missing `repository`, and
registry/editor "go to source / report a bug / homepage" links silently fall
back to nothing. Every value is unambiguous and already used across the repo.

## Scope

- Root `package.json`:
  - `repository`: `git+https://github.com/otto-haus/otto.git` (matches `git
    remote get-url origin`)
  - `homepage`: `https://otto.haus` (the README's "Website" link)
  - `bugs`: `https://github.com/otto-haus/otto/issues`

## Out of scope

- The per-app `apps/desktop/package.json` (private workspace, `"private": true`
  — provenance fields are optional there)
- Bumping or reconciling the `version` field
- Touching the `description` text
- Paperclip / Cognee / Stacks / broad redesign

## Done when

- Root `package.json` has `repository`, `homepage`, and `bugs`
- The file is still valid JSON
- `repository.url` matches the actual git remote

## Verification

Commands/checks to run:

```sh
git status --short --branch
python3 -c "import json; d=json.load(open('package.json')); print(d['repository'], d['homepage'], d['bugs'])"
git remote get-url origin   # should match repository.url
```

## Blocker log

Leave blank unless blocked.

## Execution receipt

- Repo path: `/Users/seb/Code/otto-pr-17`
- Branch: `craft/package-repository-metadata`
- Files changed:
  - `package.json`
  - `docs/receipts/staging/pr-17/summary.json`
- Commands/checks:
  - `python3 -c "import json; d=json.load(open('package.json')); print(d['repository']); print(d['homepage']); print(d['bugs'])"`
  - `git remote get-url origin`
  - `rg -n 'Website: <https://otto.haus>|https://otto.haus' README.md`
  - `bun run typecheck`
  - `bun test`
  - `bun run verify:v0`
  - `bun run --cwd apps/desktop typecheck`
  - `bun run --cwd apps/desktop electron:typecheck`
- Evidence:
  - Package metadata data is recorded in `docs/receipts/staging/pr-17/summary.json`.
  - Current PR diff against `origin/main` contains only `package.json`, the PR receipt, and this ticket.
- Known gaps: none.

## Review

Verdict: +1

Evidence:
- Root `package.json` is valid JSON and now includes `repository`, `homepage`, and `bugs`.
- `repository.url` is `git+https://github.com/otto-haus/otto.git`, matching `origin` after normalizing the npm `git+` prefix.
- `homepage` is `https://otto.haus`, matching the README website link.
- The branch was merged with current `origin/main` so the already-existing `esbuild` override is preserved without appearing as part of this metadata diff.
- `bun test` passed: 36 pass / 0 fail / 162 expects.
- `bun run verify:v0` passed: 5 passed / 0 failed.

Unmet Done when items: none.

Exact fixes required: none.

May move to `_Done`: yes.
