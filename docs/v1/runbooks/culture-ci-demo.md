# Culture CI demo runbook (135)

Canonical 30s vertical slice: [`docs/v1/demo-culture-ci.md`](../demo-culture-ci.md)

Vertical slice: standard → compiled check → runtime block → receipt.

## Prerequisites

- Desktop app built or running from repo
- Seed checks in `checks/` (completion-requires-receipts, one-way-door-approval)
- At least one ticket in `proposed` or `review` state

## Demo steps

1. **List checks** — Settings → Checks surface, or IPC `otto:checks:list`. Confirm seed checks loaded from repo.
2. **Accept a standard** — Curation → accept a proposal whose slug maps to a check (`quality`, `no-fake-done`, `one-way-doors`). Note `compiledCheckId` in result.
3. **Block done claim** — Attempt ticket merge without receipts. Expect culture check failure + receipt with `check.run` action.
4. **Block one-way door** — Autonomy red-zone action (e.g. `cognee.delete`) should require approval per policy + check.
5. **Pass path** — Attach receipt evidence, re-run merge; check passes.

## Verification commands

```sh
cd /Users/seb/Code/otto
bun test ./packages/core/src/check.test.ts
bun test ./apps/desktop/electron/check-store.test.ts
bun test ./apps/desktop/electron/check-runner.test.ts
bun test ./apps/desktop/electron/check-compiler.test.ts
```

## Honest limits (v0.3)

- Checks compile from explicit slug map only — not full YAML standard parser
- Worker bounded loop is stub until 039 transport follow-up
- Cognee is local loopback stub

## Receipt

Record demo date, check IDs exercised, and screenshot of Checks surface + block banner in ticket execution receipt.
