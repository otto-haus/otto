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

- `apps/.../package.json` → root `package.json`:
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
