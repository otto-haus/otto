# Otto v0.1 — Release Checklist

**This file is the source of truth for shipped status.** A feature is **Shipped** only when
it is Built, Tested (or failure documented), Demoed, Tried by Sebastian, and **explicitly
approved by Sebastian**. Claude is execution lead; Sebastian is the only release approver.

Status as of the integration branch `letta/otto-v01-integration` (local only — no push, no
tag, no release, no npm publish without explicit approval).

## Release table

| Feature | Built | Tested | Demo | Tried | Approved | Released | Notes |
|---|:--:|:--:|:--:|:--:|:--:|:--:|---|
| Charter | ✅ | manual | ✅ | ☐ | ☐ | ☐ | core — operating contracts + gates (extension + skill) |
| Practices | ✅ | ✅ | ✅ | ☐ | ☐ | ☐ | loader/validator/CLI; 6 unit tests; 5 specs validate |
| Routines | ✅ | manual | ✅ | ☐ | ☐ | ☐ | extension + specs; approval-gated activation |
| Skills | ✅ | manual | ✅ | ☐ | ☐ | ☐ | charter + routine agent workflows |
| Standards | ✅ | manual | ✅ | ☐ | ☐ | ☐ | registry, precedents, anti-patterns |
| Autonomy | ✅ | manual | ✅ | ☐ | ☐ | ☐ | spec + worker/ticket templates |
| Desktop | ✅ | build ✅ | ✅ | ☐ | ☐ | ☐ | preview workspace shell — sidebar surfaces, chat-primary (Vite + React) |
| Knowledge | proposed | — | ✅ | ☐ | ☐ | ☐ | **Built, not Shipped** — proposed AI-frontier surface, routing unratified |
| Channels | deferred | — | — | — | — | ☐ | deferred from v0.1 |
| Curation / Approvals | deferred¹ | — | — | — | — | ☐ | deferred from v0.1 (¹Approval is a core type) |

Legend: ✅ done/automated · `manual` manually verifiable, no automated test · `build`
build+typecheck passes · ☐ pending · "—" not applicable this release.

## Test receipts (this machine, bun 1.3.14)

```
bun run typecheck                       → exit 0 (tsc -p packages/core)
bun test                                → 6 pass / 0 fail (7 expect calls)
bun packages/practices/src/cli.ts       → 5 practice specs validate (charter active)
bun --cwd apps/desktop run typecheck    → exit 0 (tsc --noEmit)
bun --cwd apps/desktop run build        → vite build ok (22 modules, dist/ 204 kB)
bun run verify:v0                        → core checks + this table pointer
```

Per-feature receipts: [`receipts/otto-v01/`](receipts/otto-v01/). Demos: [`demo/`](demo/README.md).

## Rename / packaging sweep

- `Vinny OS` / `Vinny` → `Otto`; `cockpit` → `workspace`; `TryVeto/vinny-os` → `otto-do/otto`.
- Packages: `@vinny-os/*` → `@otto-do/*`; root → `otto`; bin `vinny-practices` → `otto-practices`.
- Local repo renamed `~/Code/vinny-os` → `~/Code/otto` (nested worktrees repaired).
- Lockfile regenerated; workspace resolution verified (`@otto-do/core|practices|desktop`).

### Remaining old-name hits (all intentional)

| Hit | Where | Why kept |
|---|---|---|
| `VINNY_HOME` | `extension/routine.ts`, `skill/routine/SKILL.md` | Back-compat env fallback after `OTTO_HOME` |
| `VINNY_OS_ROOT` | `packages/practices/src/cli.ts` | Back-compat env fallback after `OTTO_DO_ROOT` |
| "Vinny OS" (1) | `README.md` Compatibility section | Documents the rename for migrating users |
| `vinny-os` | `bun.lock` | Generated lockfile only — n/a (no hand-edit) |

`bun run verify:v0` enforces no *product*-name hits (`Vinny OS`/`vinny-os`/`@vinny-os`/`TryVeto`/`cockpit`)
in tracked files; the `VINNY_*` env tokens above are the allowed back-compat fallbacks.

## Compatibility notes

- **Env vars:** `OTTO_HOME` preferred, `VINNY_HOME` fallback; `OTTO_DO_ROOT` preferred,
  `VINNY_OS_ROOT` fallback. Default runtime root `~/.otto`.
- **Bin alias:** the practices CLI is `otto-practices` (was `vinny-practices`).
- **Historical:** the old GitHub remote `origin = TryVeto/vinny-os` is preserved untouched.
- **Namespace is NOT final.** Sebastian owns the `otto-do`, `otto-haus`, and `otto-hq` GitHub orgs, and the `otto.haus` domain (`otto.do` was unavailable). `@otto-do` is only the current *local implementation* choice — the final public org, package scope, and domain are an approval ask before push.

## GitHub metadata (prepared — NOT applied; push is Sebastian's call)

- Owner / repo: `otto-do/otto` *(provisional — namespace pending approval)* · Description: `The behavior layer for persistent AI agents.`
- Topics: `ai-agents` `agent-runtime` `autonomous-agents` `guardrails` `local-first` `letta` `routines` `practices`
- Homepage: blank — Otto v0.1 does not depend on a website (`otto.haus` is the current domain asset)
- Avatar: `~/Library/CloudStorage/Dropbox/This Cycle/otto/otto-pfp-github.png`

## Open issues / honest gaps

- Demo terminals are faithful re-enactments, not live captures (see `demo/README.md`).
- Charter, Routines, Skills, Standards, Autonomy have no automated unit tests yet (manual).
- Knowledge is **proposed**; model-registry ratings are qualitative, routing unratified.
- **Namespace is OPEN** — not yet decided. Orgs owned: `otto-do`, `otto-haus`, `otto-hq`. Domain asset: `otto.haus` (`otto.do` unavailable). `@otto-do` is the current local choice; final org / scope / domain is an approval ask before push.
- Desktop chat is a prototype shell (file-backed panes work; the Letta runtime is not yet wired).

## Final gate — Sebastian approves before any push/tag

**Sequence (nothing is pushed, tagged, published, or changed on GitHub until step 4):**

1. Sebastian watches the demos.
2. Sebastian approves which features ship.
3. Sebastian confirms namespace / org / package scope / domain.
4. Then we push together.

| Item | Approved? |
|---|:--:|
| README public story | ☐ |
| Feature shipped table (this file) | ☐ |
| Demo videos (8, in `demo/out/`) | ☐ |
| Test receipts | ☐ |
| Remaining old-name hits (all intentional) | ☐ |
| Namespace / org / package scope / domain (`otto-do` / `otto-haus` / `otto-hq`; `otto.haus`) | ☐ open — decide before push |
| GitHub metadata (incl. avatar) — not applied yet | ☐ |
| Release/tag name (`v0.1.0`) | ☐ |
| **Push + tag** (Red — explicit, step 4) | ☐ |
