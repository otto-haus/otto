# AGENTS.md

Start here if you are an AI coding agent working on otto.

## Direction (read first): otto → Paperclip plugin

otto is pivoting from a standalone Electron shell into an extension of
[Paperclip](https://github.com/paperclipai/paperclip) (the open-source agent-orchestration app).
Mental model: **Paperclip is the office, otto is the culture layer, Letta is the memory/runtime.**

- **v1 (in progress): "use Letta from Paperclip."** Ship a `letta_local` external **adapter**
  at `packages/paperclip-letta-adapter` that drives an existing local Letta agent from a Paperclip
  issue (memory continuity via the Letta `agentId`). It targets Paperclip's external-adapter
  contract: a package exporting `createServerAdapter(): ServerAdapterModule`, installed via
  `POST /api/adapters` (`isLocalPath: true`). Provider keys live in Letta; the adapter only observes
  a `providerConfigured` boolean, never the keys.
  - **Network boundary:** the adapter runs where the Paperclip server runs. v1 proof target is a
    **local** Paperclip host + an existing **local** Letta runtime on the **same Mac**. Cloud
    Paperclip → remote Letta or an explicit tunnel is a later step. This is the assumption most
    likely to be wrong; resolve it first.
- **v2: culture loop** ships as a Paperclip **plugin** (receipts to issues; correction → proposal →
  ratification → Standard). Adapters and Plugins are two different Paperclip surfaces — v1 is an
  adapter, not a plugin. v1 carries only a tiny `receiptRef` placeholder, no real culture.
- **Do NOT archive the Electron shell in v1.** Keep `apps/desktop/` as the internal lab / Letta
  cockpit; build the adapter in its own package. Archive shell surfaces only **after** the Paperclip
  adapter completes one real issue round-trip. The governance layer (`standards/`, `practices/`,
  `routines/`, `receipts/`, `skill/`, `autonomy/`) is kept for v2.

The legacy product rules below still describe the active desktop shell (kept as the lab). They remain
in force for `apps/desktop/` (e.g. provider keys belong in Letta; do not show mock data; only
Sebastian accepts done).

## North star

otto makes agent behavior compound.

```txt
correction -> proposal -> ratification -> standard/practice/routine -> receipt -> better next action
```

If a change does not gate irreversibility or make behavior compound, question it.

## Current product rules

- Product/UI name is `otto` lowercase. Use `Otto` only when grammar/platform labels force it.
- Owl/avatar image is the primary mark. Do not reintroduce the old line-drawn owl as the product logo.
- v1 is local-only. **Default ("This Mac"): otto bundles and supervises its own embedded Letta runtime** — download otto and it works, no separate Letta install. **Advanced ("Existing local Letta"): connect to a Letta.app the user already runs** (no silent fallback). Either way, **provider/API keys belong in Letta, not otto** (otto stores only a `hasProviderKey` boolean). See `docs/v1/embedded-letta-bundle.md`.
- Embedded runtime is bundled from the published `@letta-ai/letta-code` package (Apache-2.0), never forked. Carry its LICENSE in the bundle, keep `THIRD_PARTY_NOTICES.md` accurate (`bun run gen:notices`), and attribute as "powered by Letta". Do not ship Letta marks/logos as otto branding (otto's mark is the owl).
- Do not show mock operational data. If a pane is not wired, show an honest empty state.
- Smoke tests must never write into Sebastian's live `conversation=default`; use disposable conversations.

## Git and safety

- Inspect `git status` before editing.
- Protect user changes; stage only intended files.
- **Remotes:** `origin` only → `https://github.com/otto-haus/otto.git`. Do not add remotes or push to archived predecessor repositories.
- Do not publish, tag, release, change visibility, or change license without explicit human approval.
- Do not claim done without receipts.
- Do not add private/product-specific control systems to the OSS core unless behind a clear boundary.

## Agent launch contracts

Keep slash-command launches tiny; the markdown file is the contract:

```txt
/goal Read docs/agent-goals/codex-goal.md and follow it.
/goal Read docs/agent-goals/claude-goal.md and follow it.
/goalbuddy Read docs/agent-goals/composer-goal.md and prepare the board.
```

See `docs/agent-goals/README.md` for parallelism, collision rules, and trunk workflow. Default throughput: one independent ticket = one agent = one branch/worktree. Sebastian is the merge/release/one-way-door gate.

## Current issue/review workflow

- Use GitHub Issues for new nits, bugs, polish requests, and follow-up work. Do not create new local ticket files for ordinary intake.
- Every GitHub Issue must carry exactly one priority label: `p0`, `p1`, `p2`, or `p3`. If Sebastian says P0, use `p0`.
- Agents must respect priority when choosing work: `p0` before `p1` before `p2` before `p3`, then lane/status/severity.
- Any `gh issue create` command must include one priority label at creation time, e.g. `--label p0` or `--label p2`; do not create unprioritized issues.
- Historical `planning/hq-tickets/` files remain archived/mirrored context; do not treat them as the active intake queue unless Sebastian explicitly reopens that lane.
- Chat claims are not state. If Sebastian reports a nit in chat, capture it as a GitHub Issue with evidence/screenshot links when available.
- PRs that need Sebastian's merge attention should carry `status: ready for review` only after CI is green and the implementer has done a real review pass.
- Implementer cannot self-certify Done for consequential changes. Use an unbiased reviewer/subagent when the risk warrants it, and include proof in the PR body or linked issue.
- Sebastian is the merge gate. Keep ready-for-review PR count low; prefer fast, small PRs over large batches.
- Merge/review gates are **per ticket / per PR** — they must not pause the whole lane. After handing off one PR, scout the next file-disjoint Ready issue (`docs/agent-goals/README.md`, `docs/goals/github-ready-loop/`).

## Verify

```sh
bun install
bun run typecheck
bun test
bun run verify:v0
bun run --cwd apps/desktop typecheck
bun run --cwd apps/desktop electron:typecheck
```

Desktop:

```sh
task electron                 # live Electron app in dev
task staging                  # build/package/isolated staging app; background launch (no focus steal)
task staging:build            # build/package only — no launch (preferred for agent verify loops)
task staging:open             # explicit visible launch when debugging UI
task install:release          # canonical otto.app — GitHub Release only; requires OTTO_ALLOW_RELEASE_INSTALL=1
task smoke:release:metadata   # read-only — compare installed otto.app to latest or OTTO_RELEASE_TAG
task smoke:letta-cli          # resolveCli + version/help; opt-in turn with LETTA_AGENT_ID (#295)
task smoke:cli                # isolated disposable conversation; never default
task smoke:cron               # opt-in Letta cron create/list/delete smoke; never default
task smoke:attachments        # fixture save + runtime attachment context + leak checks (#299)
task smoke:permission         # #298 permission allow/deny round-trip (mock transport; no app bundles)
```

Permission round-trip (#298):

```sh
bun scripts/permission-round-trip-smoke.ts
# or: task smoke:permission
```

**Nonintrusive desktop smoke (default for agents):** prefer `task staging:build` plus CDP/Playwright smokes, or `task staging` (background launch). Staging bundles set `OTTO_SMOKE=1` and default `OTTO_WINDOW_MODE=background` so windows do not steal focus. Use `task staging:open` or `OTTO_WINDOW_MODE=visible` only when a human needs a visible window. Never mutate `/Applications/otto.app`.

After any `apps/desktop/` implementation turn, refresh **staging** (not live):

```sh
task staging:build  # preferred — no window focus steal (#326)
# or task staging    # → /Applications/otto-staging.app; background launch; refuses unless HEAD=origin/main (#314)
task staging:main   # fetch origin/main then staging (same gate when on main)
```

Staging smokes (never `/Applications/otto.app`):

```sh
bash apps/desktop/scripts/deploy-staging.sh
NODE_PATH=$HOME/.codex/admin/node_modules OTTO_RECEIPT_DIR=$PWD/docs/receipts/staging   node scripts/otto-staging-two-thread-smoke.cjs   # 046 thread isolation
```

Clean-machine E2E (#291 — isolated HOME, no host Letta config, never live/staging installs):

```sh
bun run --cwd apps/desktop app:dir
NODE_PATH=$HOME/.codex/admin/node_modules task smoke:clean-machine
```

Canonical app boundary:

- `/Applications/otto.app` must only be installed or updated from a published GitHub Release desktop artifact (latest or rollback tag via `OTTO_RELEASE_TAG`).
- Do not use `task refresh` or any local branch build to overwrite the canonical app.
- Use disposable/staging app bundles for local desktop proof unless Sebastian explicitly authorizes touching an official bundle.
- Rollback: `OTTO_RELEASE_TAG=<tag> task smoke:release:metadata` (read-only proof); install only with Sebastian approval via `OTTO_ALLOW_RELEASE_INSTALL=1 OTTO_RELEASE_TAG=<tag> task install:release`.

Do not call Electron “connected” unless `session.initialize()` succeeds against a live Letta agent.

## Repo map

```txt
packages/core/        shared v0 contract types
packages/practices/   PracticeSpec loader, validator, CLI
apps/desktop/         Vite + Electron workspace shell
docs/agent-goals/     file-native Codex/Claude/Composer launch contracts
docs/design/          brand guide, onboarding, motion, reference icons (public canon)
extension/            Letta Code commands and permission gates
skill/                Charter and Routine skills
practices/            practice.yaml specs
routines/             proposed Routine specs
standards/            canon and precedents (earned semver: standards/standards/earned-semver.md)
templates/            Charter, Practice, Routine, Standard, Ticket, Worker packets
receipts/             proof artifacts
planning/hq-tickets/  ticket conveyor (canonical queue)
planning/lane-tickets/ historical lane-numbered tickets (001–016)
SHIP_CHECKS/          per-surface acceptance checks
```

## Public safety boundary

otto may include generic agent behavior governance: Standards, Practices, Routines,
approvals, receipts, reversibility gates, and memory writeback governance.

Keep private/product-specific control systems out of the OSS core.
