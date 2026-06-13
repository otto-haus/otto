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
| Autonomy / Ticketcraft | ✅ | manual | ✅ | ☐ | ☐ | ☐ | spec + worker/ticket templates |
| Desktop | ✅ | build ✅ | ✅ | ☐ | ☐ | ☐ | preview workspace (Vite + React) |
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

## GitHub metadata (prepared — NOT applied; push is Sebastian's call)

- Owner / repo: `otto-do/otto`  ·  Description: `The behavior layer for persistent AI agents.`
- Topics: `ai-agents` `agent-runtime` `autonomous-agents` `guardrails` `local-first` `letta` `routines` `practices`
- Homepage: blank for v0.1 (or `https://otto.do` once DNS settled)
- Avatar: `~/Library/CloudStorage/Dropbox/This Cycle/otto/otto-pfp-github.png`

## Open issues / honest gaps

- Demo terminals are faithful re-enactments, not live captures (see `demo/README.md`).
- Charter, Routines, Skills, Standards, Autonomy have no automated unit tests yet (manual).
- Knowledge is **proposed**; model-registry ratings are qualitative, routing unratified.
- Namespace `otto-do` vs `otto-hq`: chose `otto-do` per master ticket; confirm below.

## Final gate — Sebastian approves before any push/tag

| Item | Approved? |
|---|:--:|
| README public story | ☐ |
| Feature shipped table (this file) | ☐ |
| Demo videos (8, in `demo/out/`) | ☐ |
| Test receipts | ☐ |
| Remaining old-name hits (all intentional) | ☐ |
| Namespace decision: `otto-do` / `@otto-do/` | ☐ |
| GitHub metadata | ☐ |
| Release/tag name (`v0.1.0`) | ☐ |
| **Push `otto-do/otto` + tag** (Red — explicit) | ☐ |
