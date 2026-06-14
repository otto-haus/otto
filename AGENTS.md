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

## Branch and release model

- `main` is the only long-lived integration branch.
- Feature/fix work happens on short-lived PR branches only.
- Merge/review gates block the PR, not the whole lane; keep working on the next independent issue.
- Releases are tags + GitHub Release artifacts from `main`, not long-lived release branches.
- `/Applications/otto.app` is installed only from the latest approved GitHub Release artifact.
- `/Applications/otto-staging.app` should track latest `main` or an explicit release-candidate commit and must show a visible build/channel/source marker.
- Temporary integration/cutover branches are allowed only to unwind existing PR backlog, not as the steady-state model.

## Ticket/review workflow

- GitHub Issues are the active intake and work queue.
- GitHub PRs are short-lived merge vehicles; do not let PR branches become durable workspaces.
- Native Codex Cloud exhaustive review is the default deep code-review signal on every push.
- Local agents should focus on implementation, AC/proof mapping, labels, receipts, staging proof, and release readiness — not duplicate exhaustive code review on every PR.
- Implementer cannot self-certify Done for consequential changes; use independent review or native Codex Cloud review plus receipt checks.
- Use REST Issues/PRs + labels for hot-loop workflow state. Treat Project V2 as batched dashboard sync, not the live conveyor.
- Chat claims are not state. If Sebastian reports a nit in chat, capture it as a GitHub Issue with evidence/screenshot links when available.
- Sebastian is the merge/release/one-way-door gate.

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
task refresh        # live /Applications/otto.app replacement; requires OTTO_ALLOW_LIVE_REFRESH=1
task smoke:cli      # isolated disposable conversation; never default
```

After any `apps/desktop/` implementation turn, refresh **staging** (not only live):

```sh
task staging        # → /Applications/otto-staging.app (isolated HOME; never default conversation)
```

Use `task refresh` when Sebastian needs `/Applications/otto.app` updated; otherwise default end-of-turn deploy is **staging**.

Staging smokes (never `/Applications/otto.app`):

```sh
bash apps/desktop/scripts/deploy-staging.sh
NODE_PATH=$HOME/.codex/admin/node_modules OTTO_RECEIPT_DIR=$PWD/docs/receipts/staging \
  node scripts/otto-staging-two-thread-smoke.cjs   # 046 thread isolation
```

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
