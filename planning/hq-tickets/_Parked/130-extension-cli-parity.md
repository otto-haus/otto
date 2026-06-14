# 130 — Extension CLI Parity (Letta Code Commands)

Owner: Cursor
Priority: P3
Depends on: 053, 076, 039
Release bucket: vNext / advanced

**Unpark when:** **076** embedded path stable; **053** practice runtime proven; explicit need for extension-as-primary dev path.

## Outcome

Otto **extension/** commands and permission gates stay **parity-tested** with embedded desktop runtime — charter, review, field-note, curation gates — for operators who use Letta Code CLI directly (advanced), without making extension the default product path.

## Why this matters

SHIP_STATUS notes extension CLI partial. v0.1 bets on **embedded one-app** (**076**). Advanced users and dogfooders still hit extension gaps. Parity prevents two divergent behavior loops.

## Scope

- Matrix doc: extension command ↔ desktop IPC ↔ receipt type
- Smoke script: extension invoke → receipt → visible in desktop Receipts pane (same `OTTO_HOME`)
- Permission gates in extension match **017** autonomy classes
- Practices **053**: charter/review/field-note invocable from extension with same receipts as desktop
- Gap list with honest “not supported in v1” entries

## Non-goals

- Extension as onboarding default (**080**)
- Replacing embedded engine
- Shipping extension to marketplace

## Done when

- [ ] Parity matrix merged under `docs/v1/extension-parity.md`
- [ ] One charter + one review smoke from extension with receipt in desktop
- [ ] Reviewer +1

## Verification

```sh
bun run verify:v0
# manual: extension command → receipt appears in staging Receipts pane
```

## Blocker log

Leave blank unless blocked.
