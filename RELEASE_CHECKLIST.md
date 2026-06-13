# Otto v0.1 — Release Checklist

**This file is the source of truth for shipped status.** A feature is **Shipped** only when
it is Built, Tested (or failure documented), Demoed, Tried by Sebastian, and **explicitly
approved by Sebastian**. Claude is execution lead; Sebastian is the only release approver.

Status as of the integration branch `letta/otto-v01-integration` (local only — no push, no
tag, no release, no npm publish without explicit approval).

## v0.1 honesty framing

Otto v0.1 is a **local-first, file-backed artifact**, not a runtime. **Nothing here is
automatically enforced.** The shared **Curation** proposal/ratification engine is **not built**
(no schema, no queue, no lifecycle), so Standards, Approvals, and Knowledge "enforcement" is
**manual editorial judgment**, not an automated gate. The `/ticket` compiler, worker
orchestration, and a live Letta runtime are **not in v0.1**. The one genuinely live runtime
hook is **Charter's permission gate** (asks before one-way doors). Per-surface evidence and the
full cutline are in [`SPEC_COMPLIANCE.md`](SPEC_COMPLIANCE.md); Ship Checks in [`SHIP_CHECKS/`](SHIP_CHECKS/); claims classified in [`CLAIMS_AUDIT.md`](CLAIMS_AUDIT.md).

**v0.1 cutline:** Ship — namespace · practices · skills. Proposed (honest preview) — desktop ·
charter · routines · standards. Defer (Built, not Shipped) — approvals · autonomy · tickets ·
knowledge · runs-receipts · worker-orchestration · channels. **Cut — curation** (engine not built).

## Release table

| Feature | Built | Tested | Demo | Tried | Approved | Released | Notes |
|---|:--:|:--:|:--:|:--:|:--:|:--:|---|
| Feature | Built | Tested | Demo | v0.1 | Notes |
|---|:--:|:--:|:--:|:--:|---|
| Practices | ✅ | ✅ | ✅ | **ship** | loader/validator/CLI; 6 unit tests; real `practices.json` on desktop |
| Skills | ✅ | manual | ✅ | **ship** | charter + routine skill packages + install.sh; live `/reload` load unproven |
| Charter | ✅ | manual | ✅ | proposed | operating contract; permission **gates are live**; AC-by-AC auditing is **manual** (Auditor not coded) |
| Routines | ✅ | manual | ✅ | proposed | specs + one-off trials + approval gate; recurring Letta-cron scheduler **deferred** |
| Standards | ✅ | manual | ✅ | proposed | canon + precedents; can block work **via review**; automated enforcement deferred (needs Curation) |
| Desktop | ✅ | build ✅ | ✅ | proposed | preview workspace shell (Vite); chat is a **prototype**, not wired to the Letta runtime |
| Autonomy | ✅ files | — | ✅ | defer | spec + worker/ticket templates; **`/ticket` compiler is not runtime**; single-worker only |
| Knowledge | ✅ files | — | ✅ | defer | **Built, not Shipped** — proposed AI-frontier surface; routing unratified, no runtime |
| Runs / Receipts | ✅ types | — | — | defer | Run/Receipt types + receipts exist; **no run engine** (runs not created at runtime) |
| Approvals | ✅ type | — | — | defer | Approval is a core type; **cannot be emitted** (no Curation); gates don't read records by status/scope |
| Worker orchestration | ✅ spec | — | — | defer | worker packets + worktree policy; **no orchestrator runtime** |
| Channels | — | — | — | defer | no runtime / config / send pathway — fully deferred |
| Curation | — | — | — | **cut** | engine not built (no schema/queue/lifecycle) — the missing spine; removed from v0.1 claims |

Legend: ✅ done · `✅ files`/`✅ types`/`✅ spec` = artifacts exist, no closing runtime · `manual`
manually verifiable, no automated test · `build` build/typecheck passes · v0.1 = ship / proposed /
defer (Built, not Shipped) / cut · "—" not present. **Tried + Approved are Sebastian's and all pending.**

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

- `Vinny OS` / `Vinny` → `Otto`; `cockpit` → `workspace`; `TryVeto/vinny-os` → `otto-haus/otto`.
- Packages: `@vinny-os/*` → `@otto-haus/*`; root → `otto`; bin `vinny-practices` → `otto-practices`.
- Local repo renamed `~/Code/vinny-os` → `~/Code/otto` (nested worktrees repaired).
- Lockfile regenerated; workspace resolution verified (`@otto-haus/core|practices|desktop`).

### Remaining old-name hits (all intentional)

| Hit | Where | Why kept |
|---|---|---|
| `VINNY_HOME` | `extension/routine.ts`, `skill/routine/SKILL.md` | Back-compat env fallback after `OTTO_HOME` |
| `VINNY_OS_ROOT` | `packages/practices/src/cli.ts` | Back-compat env fallback after `OTTO_ROOT` |
| "Vinny OS" (1) | `README.md` Compatibility section | Documents the rename for migrating users |
| `vinny-os` | `bun.lock` | Generated lockfile only — n/a (no hand-edit) |

`bun run verify:v0` enforces no *product*-name hits (`Vinny OS`/`vinny-os`/`@vinny-os`/`TryVeto`/`cockpit`)
in tracked files; the `VINNY_*` env tokens above are the allowed back-compat fallbacks.

## Compatibility notes

- **Env vars:** `OTTO_HOME` preferred, `VINNY_HOME` fallback; `OTTO_ROOT` preferred,
  `VINNY_OS_ROOT` fallback. Default runtime root `~/.otto`.
- **Bin alias:** the practices CLI is `otto-practices` (was `vinny-practices`).
- **Historical:** the old GitHub remote `origin = TryVeto/vinny-os` is preserved untouched.
- **Namespace target: `otto-haus` (NOT final).** Target identity = org `otto-haus`, repo `otto-haus/otto`, scope `@otto-haus`, domain `otto.haus`, future dream `ot.to`. Also owned but non-canonical: `otto-do`, `otto-hq` (`otto.do` was unavailable, not owned). Implemented locally as `@otto-haus`; the final public namespace is an approval ask before push.

## GitHub metadata (prepared — NOT applied; push is Sebastian's call)

- Owner / repo: `otto-haus/otto` *(provisional — namespace pending approval)* · Description: `The behavior layer for persistent AI agents.`
- Topics: `ai-agents` `agent-runtime` `autonomous-agents` `guardrails` `local-first` `letta` `routines` `practices`
- Homepage: blank — Otto v0.1 does not depend on a website (`otto.haus` is the current domain asset)
- Avatar: `~/Library/CloudStorage/Dropbox/This Cycle/otto/otto-pfp-github.png`

## Open issues / honest gaps

- Demo terminals are faithful re-enactments, not live captures (see `demo/README.md`).
- Charter, Routines, Skills, Standards, Autonomy have no automated unit tests yet (manual).
- Knowledge is **proposed**; model-registry ratings are qualitative, routing unratified.
- **Namespace target `otto-haus` — not locked.** Implemented locally (org `otto-haus`, `@otto-haus`, `otto.haus`, future `ot.to`). Also owned, non-canonical: `otto-do`, `otto-hq`; `otto.do` unavailable. Final org / scope / domain is an approval ask before push.
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
| Namespace target `otto-haus` / `@otto-haus` / `otto.haus` (otto-do + otto-hq also owned) | ☐ confirm before push |
| GitHub metadata (incl. avatar) — not applied yet | ☐ |
| Release/tag name (`v0.1.0`) | ☐ |
| **Push + tag** (Red — explicit, step 4) | ☐ |
