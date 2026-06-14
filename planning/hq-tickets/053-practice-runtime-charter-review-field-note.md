# 053 — Practice Runtime (Charter / Review / Field Note)

Owner: Cursor
Priority: P1
Depends on: 010, 011, 052
Release bucket: v0.1 practices

## Outcome

Core v1 Practices invoke from Letta/extension path with **Run + Receipt** — not just YAML specs on disk.

Focus: Charter, Review, Field Note (Practice Mining deferred to 061).

## Why this matters

Practices one-pager: slash commands are doorways; invocation must create durable proof. Extension only has partial charter/routine hooks.

## Scope

- Wire `packages/practices` + extension commands for charter, review, field-note
- Each invocation: run id, practice ref, receipt path
- Desktop Practices surface shows last run timestamp
- Permission floors from practice.yaml enforced via autonomy

## Out of scope

- Practice Mining automation (061)
- Full slash library for every practice spec

## Done when

- Letta `/charter` or equivalent creates receipt linked to practice id
- Review practice run writes receipt suitable for 051 gate
- Field note run appends to configured artifact path + receipt
- Validator still passes all practice specs

## Verification

```sh
bun packages/practices/src/cli.ts
bun test
bun run verify:v0
```

## Blocker log

Leave blank unless blocked.
