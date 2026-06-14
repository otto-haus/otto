# 090 — Otto Cloud: Monorepo Layout ADR (`apps/cloud/`)

Owner: Codex
Priority: P2
Depends on: 082
Release bucket: otto cloud

**Unpark when:** **082** reviewed (before **083** scaffold).

## Outcome

An **ADR** records where Otto Cloud code lives in the otto repo and how it relates to `apps/desktop/` and `packages/core/`.

Deliverable: `docs/v1/adr/090-otto-cloud-monorepo-layout.md` (or `docs/adr/` if that exists).

## Why this matters

**083** will scaffold Cloudflare Pages/Workers. Without a layout decision, agents scatter wrangler config at repo root, duplicate types, or couple cloud to Electron IPC by accident.

## Scope

- Options evaluated (minimum 2):
  - `apps/cloud/` — Pages UI + Workers API + wrangler.toml
  - `packages/cloud-contract/` — shared types consumed by desktop sync (**089**) and Workers
  - Root-level `infra/otto-cloud-env/` for VM template (**086**) — separate from app code
- Decision: package names, build/deploy commands, env var boundaries
- What stays in `packages/core/` vs cloud-only types
- CI sketch: typecheck cloud without building Electron
- Cross-link **083–087** implementers must follow

## Non-goals

- Implementing **083** (separate ticket)
- Publishing npm packages externally

## Done when

- [ ] ADR merged with explicit decision + rejected alternatives
- [ ] `000-index.md` / **083** ticket updated with chosen paths
- [ ] Reviewer +1

## Verification

```sh
test -f docs/v1/adr/090-otto-cloud-monorepo-layout.md || test -f docs/adr/090-otto-cloud-monorepo-layout.md
```

## Blocker log

Leave blank unless blocked.
