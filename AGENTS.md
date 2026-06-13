# AGENTS.md

Start here if you are an AI coding agent working on Otto.

## North star

Otto makes agent behavior compound.

```txt
correction -> proposal -> ratification -> standard/practice/routine -> receipt -> better next action
```

If your change does not gate irreversibility or make behavior compound, question it.

## Rules

- Do not claim done without receipts.
- Do not publish, tag, release, change visibility, or change license without explicit human approval.
- Do not add product-specific/private doctrine to the OSS core.
- Keep Letta as canonical memory; Otto owns behavior governance.
- Keep Paperclip/management-plane concerns out of Otto unless integrating through a clear boundary.
- Protect user changes: inspect `git status` before editing and stage only intended files.

## Verify

```sh
bun install
bun run typecheck
bun test
bun run verify:v0
bun run --cwd apps/desktop typecheck
```

Desktop:

```sh
bun run --cwd apps/desktop dev
bun run --cwd apps/desktop electron:dev
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

Otto may include generic agent behavior governance: Standards, Practices, Routines,
approvals, receipts, reversibility gates, and memory writeback governance.

Keep private/product-specific control systems out of the OSS core.
