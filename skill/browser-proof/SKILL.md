---
name: browser-proof
description: Browser-visible verification — route smoke, screenshots, console errors. Receipt required.
---

# Browser proof skill (stub)

## Triggers

- screenshot, smoke test, browser verify, staging proof, console errors

## Constraints

- Always attach screenshot or log artifact to receipt
- No credential entry in automated flows without approval
- Prefer local/staging URLs only in v1

## Output

Write `receipts/` entry with evidence refs before claiming UI done.

## Autonomy

- `browser.read`: green
- `browser.navigate_external`: yellow
