# AGENTS.md

Start here if you are an AI coding agent working on otto.

## North star

otto makes agent behavior compound.

```txt
correction -> proposal -> ratification -> standard/practice/routine -> receipt -> better next action
```

If a change does not gate irreversibility or make behavior compound, question it.

## Current product rules

- Product/UI name is `otto` lowercase. Use `Otto` only when grammar/platform labels force it.
- Owl/avatar image is the primary mark. Do not reintroduce the old line-drawn owl as the product logo.
- v1 is local-only: otto connects to a local Letta runtime. Provider/API keys belong in Letta, not otto.
- Do not show mock operational data. If a pane is not wired, show an honest empty state.
- Smoke tests must never write into Sebastian's live `conversation=default`; use disposable conversations.

## Git and safety

- Inspect `git status` before editing.
- Protect user changes; stage only intended files.
- **Remotes:** `origin` only → `https://github.com/otto-haus/otto.git`. Do not add remotes or push to archived predecessor repositories.
- Do not publish, tag, release, change visibility, or change license without explicit human approval.
- Do not claim done without receipts.
- Do not add private/product-specific control systems to the OSS core unless behind a clear boundary.

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
task electron       # live Electron app in dev
task staging        # build/package/install/open isolated /Applications/otto-staging.app
task smoke:cli      # isolated disposable conversation; never default
```

After any `apps/desktop/` implementation turn, refresh **staging** (not live):

```sh
task staging        # → /Applications/otto-staging.app (isolated HOME; never default conversation)
```

Staging smokes (never `/Applications/otto.app`):

```sh
bash apps/desktop/scripts/deploy-staging.sh
NODE_PATH=$HOME/.codex/admin/node_modules OTTO_RECEIPT_DIR=$PWD/docs/receipts/staging   node scripts/otto-staging-two-thread-smoke.cjs   # 046 thread isolation
```

Canonical app boundary:

- `/Applications/otto.app` must only be installed or updated from the latest published GitHub Release artifact.
- Do not use `task refresh` or any local branch build to overwrite the canonical app.
- Use disposable/staging app bundles for local desktop proof unless Sebastian explicitly authorizes touching an official bundle.

Do not call Electron “connected” unless `session.initialize()` succeeds against a live Letta agent.

## Repo map

```txt
packages/core/        shared v0 contract types
packages/practices/   PracticeSpec loader, validator, CLI
apps/desktop/         Vite + Electron workspace shell
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
