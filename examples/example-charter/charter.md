# Charter: Ship Charter v0.1 as an OSS goal OS

## Objective
Publish Charter — a reusable, local-first goal operating system for long-running AI
agents — as an installable Letta Code extension + skill, with docs and examples.

## Why now
Long autonomous runs need durable, owned goals with approval gates and receipts;
nothing reusable exists, so build it generic and dogfood it.

## Scope
Compiler (intent -> contract), Runtime (charter.md/state.yaml/ledger/receipts),
Loop (Scout/Judge/Worker/Review), Gates (one-way-door approval overlay), docs, install.

## Non-goals
A heavy project-management UI; cloud service; organization-specific doctrine in core.

## Acceptance criteria
1. `/charter <intent>` produces a structured proposed charter -> proof: receipts/propose.txt
2. approve persists charters/<slug>/{charter.md,state.yaml,ledger.md} -> proof: receipts/state-after-approve.txt
3. operational updates need no approval; legitimacy changes do -> proof: receipts/gate-demo.txt
4. gates force approval on deploy/publish/delete even in yolo -> proof: receipts/gate-block.txt
5. completion requires receipts + summary -> proof: this file's receipts/

## Approval gates (one-way doors)
- publish to public GitHub remote, deploy, merge to main, delete important data,
  credential/security changes

## Plan
1. Write extension (command + gates).
2. Write skill workflow + templates.
3. Write docs + README + license.
4. Install into Letta; dogfood.
5. Gate the public publish for human approval.

## Stop conditions
Stop and ask before any public push, license choice, or repo visibility change.

## First next action
Run /reload and smoke-test `/charter` end to end.
