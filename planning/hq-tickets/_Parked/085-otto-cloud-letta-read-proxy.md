# 085 — Otto Cloud Phase 3: Letta Cloud Read (Envs + Schedules)

Owner: Codex
Priority: P2
Depends on: 084, 079
Release bucket: otto cloud

## Outcome

Otto web displays **Letta Cloud** remote environments and schedules — read/proxy only; no otto Letta broker.

## Scope

- Letta Cloud API integration (agents, env connection status, cron list)
- UI: remote envs panel + schedules panel with “listener required” banner
- Cache short TTL in Workers KV or D1 `letta_links`
- Align with **077** / **079** mode matrix

## Non-goals

- Creating schedules from web (v2 — may deep-link Letta app first)
- Storing provider keys

## Done when

- [ ] Connected `otto-cloud` env visible when VM running
- [ ] Schedule list matches `letta cron list` for test agent
- [ ] Disconnected listener shows honest warning
- [ ] Reviewer +1

## Blocker log

Leave blank unless blocked.
