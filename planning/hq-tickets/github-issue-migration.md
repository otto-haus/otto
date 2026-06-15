# GitHub Issue Migration

Date: 2026-06-14

## Scope

- Migrated 90 non-Done local tickets from `planning/hq-tickets/` into GitHub Issues.
- Skipped `_Done/` because those tickets are historical archive.
- Skipped `000-*` conveyor documents because they are operating docs, not work tickets.
- Preserved the original local status in each issue body: `active`, `backlog`, `in review`, or `parked`.

## Artifacts

- Machine-readable map: `planning/hq-tickets/github-issue-migration.json`
- Issue template for future work: `.github/ISSUE_TEMPLATE/otto-ticket.yml`
- Repeatable migration helper: `scripts/migrate-hq-tickets-to-github-issues.mjs`

## Commands

```sh
node scripts/migrate-hq-tickets-to-github-issues.mjs \
  --source <live-otto-checkout>/planning/hq-tickets \
  --repo otto-haus/otto
```

Dry runs write to an OS temp file by default so local smoke checks do not dirty
the committed migration map.

```sh
node scripts/migrate-hq-tickets-to-github-issues.mjs \
  --source <live-otto-checkout>/planning/hq-tickets \
  --repo otto-haus/otto \
  --out planning/hq-tickets/github-issue-migration.json \
  --write
```

```sh
node scripts/migrate-hq-tickets-to-github-issues.mjs \
  --source <live-otto-checkout>/planning/hq-tickets \
  --repo otto-haus/otto \
  --out planning/hq-tickets/github-issue-migration.json \
  --write \
  --sync-existing
```

## Result

- Migration map covers synced issues: `https://github.com/otto-haus/otto/issues/59` through `https://github.com/otto-haus/otto/issues/149`, with non-contiguous numbering where GitHub already had activity.
- Spot-checked issue bodies after sync:
  - `#59` uses `planning/hq-tickets/_Parked/019-intake-manual-import.md`
  - `#149` uses `planning/hq-tickets/159-chat-core-working-loop-ws.md`

## Current re-run guard

After rebasing this migration onto current `main`, a full dry run sees additional
non-Done tickets that were created after the original migration. The helper now
stops before any write when the selected ticket set contains duplicate local IDs.

Current duplicate IDs that must be reconciled before another full `--write` run:

- `150`: `planning/hq-tickets/150-craft-workspace-content-fill-center-empty.md` and `planning/hq-tickets/_InReview/150-settings-craft-veto-style-shell.md`
- `152`: `planning/hq-tickets/152-craft-empty-state-heading-balance.md` and `planning/hq-tickets/_InReview/152-ai-frontier-review-idempotent-note.md`
- `155`: `planning/hq-tickets/_InReview/155-craft-readme-repomap-autonomy.md` and `planning/hq-tickets/_InReview/155-proposal-canon-ratification-idempotency.md`
- `156`: `planning/hq-tickets/_InReview/156-ci-audit-gate.md` and `planning/hq-tickets/_InReview/156-curation-decision-record-language.md`
- `157`: `planning/hq-tickets/_InReview/157-ci-dependabot-maintenance.md` and `planning/hq-tickets/_InReview/157-runtime-model-fallback-effort-floor.md`
