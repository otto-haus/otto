# 005 — Standards

Status: done
Owner: Claude
Priority: P1
Depends on: 003

## Outcome

Otto has visible canon for principles, rules, and precedents.

## Scope

- Standards surface.
- File-backed standards loading.
- Standard detail view.
- Standards referenced in runs/receipts.

## Done when

- User can view current Standards.
- Runs can cite relevant Standards.
- Standards are file-backed, not hidden app state.

## Proof

- HQ: 008 Standards Contract, 009 Standards Surface
- Smoke: `/Users/seb/.codex/admin/otto-008-standards-smoke-20260613T220000.json`
- Worktree: `standards/` tree, `apps/desktop/electron/standards-store.ts`
- Verified: file-backed registry + surface; cited in runs (2026-06-13)
