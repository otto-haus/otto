---
name: 1password
description: Document 1Password CLI patterns only — never read or store secrets in Otto config.
---

# 1Password skill (stub)

## Triggers

- 1password, op cli, secret reference, inject credential at runtime

## Constraints

- **Red zone:** any `op read` or secret materialization requires explicit approval
- Otto never persists secret values — use Letta/keychain as system of record
- Document commands only; user runs `op` locally

## Autonomy

- `1password.read`: red
- `1password.inject`: red

```sh
op read "op://vault/item/field" # user-approved only
```
