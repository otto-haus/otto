# Worker receipt — Standards surface (#448)

**Branch:** `surface-standards-448`  
**Lead pickup:** Scout + Worker subagents hit usage limits

## Changed
- Removed `standards` from `WORKSPACE_PREVIEW_SURFACES`
- Added `standards-filter.ts` (+ tests) for search/status/domain filtering and grouping
- Extended Standards UI: filters, domain groups, rationale excerpt, curation path
- Added optional `domain` on registry refs + `StandardRecord`
- Tagged domains in `standards/registry.yaml`

## Verify
```sh
bun run --cwd apps/desktop typecheck          # pass
bun run --cwd apps/desktop electron:typecheck # pass
bun test apps/desktop/src/standards-filter.test.ts apps/desktop/src/surface-tiers.test.ts apps/desktop/electron/standard-store.test.ts # pass
```

## Not done
- Judge independent review pending
- CI on PR pending
- Sebastian merge gate
