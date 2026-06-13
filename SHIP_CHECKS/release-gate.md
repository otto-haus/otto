# Ship Check — Final Release Gate

## Required before push

- [ ] `bun run verify:v0` passes.
- [ ] `bun run typecheck` passes.
- [ ] `bun test` passes.
- [ ] `bun --cwd apps/desktop run typecheck` passes.
- [ ] `bun --cwd apps/desktop run build` passes.
- [ ] Namespace approved by Sebastian.
- [ ] README approved by Sebastian.
- [ ] Ship decisions approved per feature.
- [ ] Demo videos watched by Sebastian.
- [ ] Tried/Approved statuses updated only after Sebastian confirms.
- [ ] No private info in public files.
- [ ] No accidental old names.
- [ ] Git status clean or intentionally documented.

## Do not do without explicit approval

- [ ] No push.
- [ ] No tag.
- [ ] No GitHub release.
- [ ] No npm publish.
- [ ] No GitHub metadata/avatar changes.

## Final answer format

1. Shipped table
2. Spec compliance scorecard
3. Demo links
4. Test receipt summary
5. Blockers
6. Exact approval asks

## Status legend

- `[x]` Done — evidence path required
- `[~]` Partial / prototype / proposed — evidence + gap required
- `[ ]` Not done — missing work required

## Ship decision

Choose one:
- Ship in v0.1
- Ship as Proposed
- Defer
- Cut from public claims

## Truth rule

If it cannot be run, inspected, proven, and approved, it is not Shipped.
