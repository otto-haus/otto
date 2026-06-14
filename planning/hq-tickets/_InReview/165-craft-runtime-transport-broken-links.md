# 165 — docs/runtime-transport.md: 5 broken cross-links (root paths, not relative)

Owner: Claude
Priority: P2
Depends on: none
Release bucket: later-generated

## Outcome

Every cross-link in `docs/runtime-transport.md` resolves. The five links that
pointed at repo-root-style paths now use paths relative to the doc's own
location (`docs/`), so they work on GitHub and in local markdown viewers.

## Why this matters

Docs accuracy — `runtime-transport.md` is the "canonical contract" doc for how
the desktop app reaches the Letta runtime, and its **Cross-links** section (plus
one inline link) were all dead. The links were written as repo-root paths:

```
[`docs/v1/contracts/adapter-seam.md`](docs/v1/contracts/adapter-seam.md)
[`planning/hq-tickets/039-…`](planning/hq-tickets/039-…)
```

But the file lives in `docs/`, and GitHub resolves relative links against the
file's directory — so `docs/v1/…` became `docs/docs/v1/…` (404) and
`planning/…` became `docs/planning/…` (404). All five targets exist; only the
link paths were wrong.

## Scope

- `docs/runtime-transport.md`, link URLs only (labels kept as the readable
  repo-root paths):
  - `](planning/…)` → `](../planning/…)`  (3 links)
  - `](docs/v1/…)` → `](v1/…)`  (2 links)

## Out of scope

- Other docs with the same root-vs-relative slip
  (`docs/v1/runbooks/live-vs-staging.md`, staging receipt docs) — separate passes
- Any content change (link text/labels untouched)

## Done when

- All 5 links resolve relative to `docs/`
- No bare `](docs/…)` / `](planning/…)` links remain in the file
- Labels unchanged

## Verification

```sh
git status --short --branch
grep -oE '\]\((docs/|planning/)[^)]+\)' docs/runtime-transport.md   # expect: none
# each fixed URL resolves from docs/:
for u in \
  ../planning/hq-tickets/039-cathedral-ws-runtime-transport.md \
  ../planning/hq-tickets/076-embedded-letta-one-app-distribution.md \
  ../planning/hq-tickets/_Parked/077-letta-cloud-remote-mode.md \
  v1/contracts/adapter-seam.md \
  v1/runbooks/live-vs-staging.md; do
  test -f "$(python3 -c "import os;print(os.path.normpath('docs/'+'$u'))")" && echo ok
done
```

## Execution receipt

2026-06-14 Codex review/repair:

- Confirmed the committed docs diff changes only five `docs/runtime-transport.md`
  link targets; visible link labels are unchanged.
- Confirmed no bare `](docs/...)` or `](planning/...)` URLs remain in
  `docs/runtime-transport.md`.
- Confirmed all five changed URLs resolve from the `docs/` directory:
  `../planning/hq-tickets/039-cathedral-ws-runtime-transport.md`,
  `../planning/hq-tickets/076-embedded-letta-one-app-distribution.md`,
  `../planning/hq-tickets/_Parked/077-letta-cloud-remote-mode.md`,
  `v1/contracts/adapter-seam.md`, and `v1/runbooks/live-vs-staging.md`.
- Moved this ticket to `_InReview` after proof and expanded the verification
  snippet to cover all five links, not only examples.
- Checked open PR file overlap: no currently open PR overlaps this branch's
  changed files.
- Checked `git merge-tree $(git merge-base HEAD origin/ship/functional-labs) HEAD origin/ship/functional-labs`:
  no conflicts.
- Verification passed: `bun install --frozen-lockfile`; `bun run typecheck`;
  `bun run --cwd apps/desktop typecheck`; `bun run --cwd apps/desktop electron:typecheck`;
  `bun test` (223 pass, 1 skip, 0 fail); `bun run verify:v0` (5 passed, 0
  failed); `git diff --check`.
- Screenshots: N/A, docs-only markdown link target change.

## Blocker log

Leave blank unless blocked.
