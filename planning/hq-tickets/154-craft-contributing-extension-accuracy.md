# 154 — CONTRIBUTING.md: fix stale "single file / single skill" claims

Owner: Claude
Priority: P2
Depends on: none
Release bucket: later-generated

## Outcome

CONTRIBUTING.md's **Dev** section accurately describes the extension and skill
layout: two extension files (`extension/charter.ts`, `extension/routine.ts`) and
two skills (`skill/SKILL.md`, `skill/routine/SKILL.md`), instead of claiming the
project is a "single file" / "single skill."

## Why this matters

Docs accuracy — CONTRIBUTING.md is a GitHub "special" file surfaced on the
public repo, so it's the first orientation a new contributor reads. It said:

- "The extension is a single file: `extension/charter.ts`"
- "The workflow is a single skill: `skill/SKILL.md`"

Both drifted when the Routine feature landed. `origin/main` actually ships
`extension/routine.ts` (Routines — repeated bundles of Practices) alongside
`charter.ts`, and `skill/routine/SKILL.md` (the `routine` skill) alongside
`skill/SKILL.md` (the `charter` skill). A contributor following the doc would
miss half the surface and assume routine code lived where it doesn't.

## Scope

- `CONTRIBUTING.md`, Dev bullets — replace the two stale lines with accurate
  descriptions of both extension files and both skills. Descriptions taken from
  the files' own headers.

## Out of scope

- The "Adding gates" section (`BASH_GATES`/`SECRET_PATH`/`TOOL_NAME_GATE` in
  `extension/charter.ts`) — verified still accurate; untouched
- Any code change
- Paperclip / Cognee / Stacks / broad rewrite

## Done when

- Dev section names both extension files and both skills, correctly
- Every referenced path exists in `origin/main` (verified)
- No code change (docs-only; no typecheck applicable)

## Verification

```sh
git status --short --branch
for p in extension/charter.ts extension/routine.ts skill/SKILL.md skill/routine/SKILL.md; do
  git cat-file -e origin/main:"$p" && echo "ok $p"
done
grep -n 'routine' CONTRIBUTING.md
```

## Blocker log

Leave blank unless blocked.
