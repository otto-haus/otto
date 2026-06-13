# Ship Check — Practices

## Spec promise

Practices are repeated behaviors worth preserving. They make Standards executable.

## Required file contract

- [x] Core type exists: `PracticeSpec` — `packages/core/src/types.ts` lines 94-121
- [x] Loader exists — `packages/practices/src/load.ts`
- [x] Validator exists — `packages/practices/src/validate.ts`
- [x] CLI exists: `otto-practices` — `packages/practices/src/cli.ts`
- [x] Practice specs exist under `practices/*/practice.yaml` — charter, decision, field-note, follow-up, review
- [x] Templates exist — `templates/practice.yaml`

## Required runtime behavior

- [x] CLI validates all practice specs — `bun packages/practices/src/cli.ts` shows 5/5 ok, 0 errors
- [x] Approval floor is enforced — All specs include (enabling-globally, external-side-effects, permission-expansion); validator enforces at `packages/practices/src/validate.ts:73-77`
- [x] Active practices require implementation — Charter (active) has implementation; validator enforces at line 80-82; all draft specs correctly omit it
- [x] Desktop Practices surface reads real generated data — `apps/desktop/src/surfaces/Panes.tsx:3` imports from generated `practices.json`

## Required commands

```sh
bun test                                   # 6 pass / 0 fail ✓
bun packages/practices/src/cli.ts          # 5 specs validate ✓
bun run --cwd apps/desktop gen:practices   # regenerates practices.json ✓
```

## Required demo

- [x] `demo/out/otto-v01-practices.mp4` exists — valid ISO Media MP4, 2.2 MB

## Required receipt

- [x] `receipts/otto-v01/practices.md` — test output, demo ref, known limitations, pending approval

## Status legend

- `[x]` Done — evidence path required
- `[~]` Partial / prototype / proposed — evidence + gap required
- `[ ]` Not done — missing work required

## Ship decision

**Ship in v0.1**

All file contracts verified. All runtime behaviors confirmed. Tests pass (6/0). Demo valid. Receipt complete. Approval floor enforced in all 5 specs. Charter (active) has implementation; 4 draft specs correctly omit implementation. Desktop surface reads real generated data.

Known: Four draft practices are specs only (reusing Charter primitives); not separately implemented. Acceptable for v0.1.

