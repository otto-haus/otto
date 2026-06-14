# 095 — Control Plane: Execution Leases

Owner: Codex
Priority: P2
Depends on: 094, 060
Release bucket: cathedral / always-on

**Unpark when:** **094** contract exists.

## Outcome

**Execution leases** — exclusive bounded right to run work on a runner (ticket slice, worker, schedule fire) with TTL, holder, and conflict rules.

## Scope

- Lease acquire/release/heartbeat extension
- Bind to ticket id, worker id, or schedule task id
- Refuse second lease on same scope
- Integrate **060** worker loop locally; cloud mirror later

## Done when

- [ ] Lease contract doc + types stub
- [ ] One ticket orchestration holds lease for worktree run
- [ ] Reviewer +1

## Blocker log

Leave blank unless blocked.
