# 086 — Otto Cloud Phase 4: Remote Env VM Template

Owner: Cursor
Priority: P2
Depends on: 085
Release bucket: otto cloud

## Outcome

One-command deploy of **`letta server --env-name otto-cloud`** on Render, Fly, Railway, or DO — outbound-only, persistent `~/.letta/`.

## Scope

- IaC template in repo (`infra/otto-cloud-env/` or docs + fork link)
- OAuth device-flow runbook + Developer-plan API key option
- Systemd / platform restart policy
- Health: env registers in Letta Cloud; visible in **085** UI

## Non-goals

- Inbound ports or reverse proxy
- Running agent on Cloudflare Workers

## Done when

- [ ] Fresh VM deploy → env shows connected in otto web within 15m
- [ ] Reboot survives auth (persistent volume)
- [ ] Receipt in ticket with platform choice + cost note

## Blocker log

Leave blank unless blocked.
