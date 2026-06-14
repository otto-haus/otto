# Ship Check — Practices

## Implementation status (2026-06-13)

Ship decision: **Ship as Proposed**

- [x] Practice specs under `practices/` + Practices surface
- [x] Smoke: `otto-010-practices-smoke-20260613T221500.json`, `otto-011-practices-surface-smoke-20260613T223000.json`
- [~] CLI validator path exists in monorepo; not fully wired to desktop runtime
- [ ] Demo + repo receipt not refreshed

## Spec promise

Practices are repeated behaviors worth preserving. They make Standards executable.

## Required file contract

- [ ] Core type exists: `PracticeSpec`.
- [ ] Loader exists.
- [ ] Validator exists.
- [ ] CLI exists: `otto-practices`.
- [ ] Practice specs exist under `practices/*/practice.yaml`.
- [ ] Templates exist for at least relevant practices.

## Required runtime behavior

- [ ] CLI validates all practice specs.
- [ ] Approval floor is enforced.
- [ ] Active practices require implementation.
- [ ] Desktop Practices surface reads real generated data.

## Required commands

```sh
bun test
bun packages/practices/src/cli.ts
bun --cwd apps/desktop run gen:practices
```

## Required demo

- [ ] `demo/out/otto-v01-practices.mp4` shows real validator output.

## Required receipt

- [ ] `receipts/otto-v01/practices.md` includes test output and limitations.

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
