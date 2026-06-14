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
- Do not publish, tag, release, change visibility, or change license without explicit human approval.
- Do not claim done without receipts.
- Do not add private/product-specific control systems to the OSS core unless behind a clear boundary.

## Ticket/review workflow

- Folder/ticket state is truth. Chat claims are not state.
- Implementer cannot self-certify Done.
- Current reviewer topology: one Claude lane + one Codex lane.
- For review, the implementer manually launches an unbiased reviewer subagent with the ticket packet, diff, checks, and receipts.
- The reviewer grades AC-by-AC. No proof mapped to Done-when means no `+1`.
- No required Claude -> Codex or Codex -> Claude handoff. Use each standing agent for its strengths; use a fresh unbiased subagent for review.

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
task refresh        # build/package/install/open /Applications/otto.app
task smoke:cli      # isolated disposable conversation; never default
```

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
extension/            Letta Code commands and permission gates
skill/                Charter and Routine skills
practices/            practice.yaml specs
routines/             proposed Routine specs
standards/            canon and precedents
templates/            Charter, Practice, Routine, Standard, Ticket, Worker packets
receipts/             proof artifacts
SHIP_CHECKS/          per-surface acceptance checks
```

## Public safety boundary

otto may include generic agent behavior governance: Standards, Practices, Routines,
approvals, receipts, reversibility gates, and memory writeback governance.

Keep private/product-specific control systems out of the OSS core.
