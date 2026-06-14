# Ship Check — Namespace

## Spec promise

Otto has one clean public identity.

## Required state

- [ ] Product name is `Otto`.
- [ ] GitHub target is `otto-haus/otto`.
- [ ] Package scope is `@otto-haus/`.
- [ ] Domain reference is `otto.haus`.
- [ ] Future dream domain `ot.to` is documented only as future.
- [ ] `otto-do`, `otto-hq`, `otto.do`, `@otto-do`, `@otto-hq` do not appear except intentional historical/decision notes.
- [ ] `Vinny OS` appears only as historical context if needed.
- [ ] UI language uses `workspace`, not cockpit/console/dashboard.
- [ ] Sidebar/nav labels avoid slashes.

## Required commands

```sh
grep -RIn "otto-do\|@otto-do\|otto-hq\|@otto-hq\|otto.do\|cockpit\|console\|dashboard\|Vinny OS" .   --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist || true
bun install
bun run typecheck
bun test
bun run verify:v0
```

## Evidence paths

- `package.json`
- `packages/*/package.json`
- `README.md`
- `RELEASE_CHECKLIST.md`
- `bun.lock`

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
