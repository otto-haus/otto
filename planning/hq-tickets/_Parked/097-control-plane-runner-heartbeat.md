# 097 — Control Plane: Runner Heartbeat

Owner: Cursor
Priority: P2
Depends on: 092, 086, 085
Release bucket: cathedral / always-on

**Unpark when:** **092** reviewed; **086** VM template or local runner path proven.

## Outcome

Runners report **heartbeat**: env name, agent id, listener up, last turn, active lease, volume ok. Cloud/desktop surfaces stale runner honestly.

## Scope

- Heartbeat schema + write interval
- Status API for otto web (**085**)
- Stale threshold + notification hook (**099**)

## Done when

- [ ] Heartbeat visible on cloud status + desktop System
- [ ] Stale runner shows warning within defined SLA
- [ ] Reviewer +1

## Blocker log

Leave blank unless blocked.
