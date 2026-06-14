# 088 — Otto Cloud Phase 6: WorkOS Orgs (Parked)

Owner: Codex
Priority: P3
Depends on: 087
Release bucket: otto cloud

**Parked until** otto has multi-user customers and org-scoped canon requirements.

## Outcome

WorkOS AuthKit + org RBAC for otto Cloud; Letta auth remains separate (Letta OAuth/API key).

## Scope

- WorkOS login on Pages
- `operators` + `tenants` tables wired
- Role gates on API routes

## Non-goals

- Replacing Letta Cloud auth
- SSO for Letta memory API in v1

## Done when

- [ ] Two test users, two orgs, isolated receipts
- [ ] Reviewer +1

## Blocker log

Leave blank unless blocked.
