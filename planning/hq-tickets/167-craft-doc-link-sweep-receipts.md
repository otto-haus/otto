# 167 — Doc link sweep: fix remaining broken links (staging receipts)

Owner: Claude
Priority: P2
Depends on: none
Release bucket: later-generated

## Outcome

The last broken relative markdown links in the committed docs resolve. This
batch fixes the 5 remaining links (in two staging-receipt docs); together with
#170 (`runtime-transport.md`) and #171 (`live-vs-staging.md`), every broken
markdown link surfaced by a repo-wide scan is now addressed.

## Why this matters

Docs accuracy. A repo-wide scan (resolve each `](path)` against its own doc's
directory, check existence on the ship tree) found 12 broken links total — 7 in
two living docs (already in #170 / #171) and 5 in two staging receipts. All were
the same class: paths off by one `../` level, so they landed in a non-existent
`docs/...` directory. Every target exists; only the link depth was wrong.

## Scope

- `docs/receipts/staging/design-pass-20260613/design-pass-receipt.md`
  (4 links): `](../../../apps/…)` → `](../../../../apps/…)` (file is 4 deep)
- `docs/receipts/staging/063-sebastian-gate-packet-v03-20260614.md`
  (1 link): `](../v1/…)` → `](../../v1/…)`

Link text/labels unchanged; only the `../` depth corrected. Receipt *content*
(the substantive proof) is untouched — this is link hygiene only.

## Out of scope

- `runtime-transport.md` (#170) and `live-vs-staging.md` (#171) — the two living
  docs, already in their own PRs
- HTML one-pagers (separate `lang`/`title` work)

## Done when

- All links in both receipt docs resolve
- Repo-wide markdown-link scan is clean (modulo the two docs in #170/#171)
- Labels / receipt content unchanged

## Verification

```sh
git status --short --branch
for f in docs/receipts/staging/design-pass-20260613/design-pass-receipt.md \
         docs/receipts/staging/063-sebastian-gate-packet-v03-20260614.md; do
  d=$(dirname "$f")
  grep -oE '\]\([^)]+\)' "$f" | sed -E 's/^\]\(//;s/\)$//' | while read l; do
    case "$l" in http*|\#*) continue;; esac
    t="${l%%#*}"; r=$(python3 -c "import os,sys;print(os.path.normpath('$d/'+'$t'))")
    test -e "$r" || echo "BROKEN $l"
  done
done   # expect: no output
```

## Blocker log

Leave blank unless blocked.
