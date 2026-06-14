# 083 — Otto Cloud Phase 1: Pages Shell + Health

Owner: Claude
Priority: P2
Depends on: 082, 065
Release bucket: otto cloud

**Unpark when:** Spec (082) accepted; marketing domain (**065**) defines subdomain.

## Outcome

`app.otto.haus` (or chosen subdomain) serves a minimal otto web shell: brand, health, honest “not connected” states — no mock operational data.

## Scope

- Cloudflare Pages project + Workers API route `GET /api/health`
- Static shell: Home status placeholder wired to health
- CF Access or single-tenant admin gate (document choice)
- Deploy via wrangler; secrets in CF Secrets Store

## Non-goals

- D1, Letta API, WorkOS

## Done when

- [ ] Public URL loads with otto branding
- [ ] `/api/health` returns JSON `{ ok: true, version }`
- [ ] Receipt: deploy command + URL in ticket

## Blocker log

Leave blank unless blocked.
