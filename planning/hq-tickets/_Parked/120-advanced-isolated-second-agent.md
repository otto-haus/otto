# 120 — Advanced: Isolated Second Agent Flow

Owner: Codex
Priority: P3
Depends on: 119, 093, 076
Release bucket: vNext / advanced

**Unpark when:** **119** shipped; **093** ADR +1; explicit product need for isolation boundary.

## Outcome

**Advanced** flow to create a **second isolated agent** with documented boundary — not onboarding default, not fleet dashboard.

## Why this matters

Architecture should support N agents for real isolation (finance vs code, different owner, different secrets). Product must not center this until primary-agent loop is proven.

## Scope

- Settings → Advanced → “Create isolated agent”
- Required: boundary reason (enum from **093**), receipt on create
- Separate `agentId`; optional isolated config subtree
- No shared Standards canon write without explicit scope (or block secondary from ratify v1)
- Cloud mirror (**089**) tags agent scope when sync exists

## Non-goals

- Agent fleet dashboard
- Per-agent billing
- Onboarding multi-agent

## Done when

- [ ] Second agent creatable only through Advanced with boundary + receipt
- [ ] Primary agent remains default in Chat
- [ ] Reviewer +1

## Blocker log

Leave blank unless blocked.
