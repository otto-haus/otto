# 077 — Letta Cloud / Remote Mode (Advanced)

Owner: Codex
Priority: P2
Depends on: 076, 039
Release bucket: vNext runtime

**Parked until 076 (embedded default) and 039 (transport seam) land.**

**Canonical contract:** `docs/runtime-transport.md` § Planned / advanced — `cloudRemote`, `cloudApi`, `selfHosted`; explicit opt-in only; **`auto` never falls back to cloud** (079).

## Outcome

Settings **Letta Cloud / remote environment** mode connects otto to a hosted or remote Letta runtime — explicitly opt-in, never silent fallback from embedded local.

## Boundary

- Default remains **076 embedded local**.
- `connectionMode: cloudRemote | cloudApi | selfHosted` — user-selected only.
- Cloud auth in keychain; boolean-only logs.
- No otto storage of provider secrets or canonical memory.

## Scope

- `cloudRemote`: env list + status WS + sync/input (Letta Code remote client)
- `selfHosted`: URL + health check (BYOR)
- `cloudApi`: thinner hosted chat — document limitations vs coding-agent use case
- Settings UI + readiness reasons per mode
- Receipt on mode connect/disconnect

## Non-goals

- Replacing embedded as default
- Silent `auto` fallback local→cloud

## Done when

- [ ] Explicit mode select → connected remote turn with receipt
- [ ] Embedded mode unaffected on same machine
- [ ] Reviewer +1

## Blocker log

Leave blank unless blocked.
