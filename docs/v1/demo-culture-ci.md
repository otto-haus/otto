# Culture CI — 30-second vertical slice (135)

Reproducible demo proving:

```txt
Watch Otto learn a rule once, then enforce it.
```

Product noun in UI: **Checks** (Culture CI category in prose).

## Prerequisites

- Staging bundle deployed (`task staging` → `/Applications/otto-staging.app`)
- Disposable conversation — **never** `conversation=default`
- Seed checks in repo `checks/` (or `~/.otto/checks/` after first launch)
- Letta runtime connected on staging (`runtime_ready: true`)

Deploy + isolate paths: [`live-vs-staging.md`](runbooks/live-vs-staging.md)

## Reset (≤5 min setup)

```sh
cd /Users/seb/Code/otto
task staging
OTTO_SMOKE=1 /Users/seb/.codex/admin/otto-staging/launch-otto-staging-smoke.sh
```

In staging app:

1. Chat → use disposable conversation from smoke launcher (not `default`).
2. Optional: delete prior demo proposals under Curation if re-running.

## Demo script (~30s on screen)

| Step | Actor | Action | Expected |
|------|-------|--------|----------|
| 1 | Agent | Says **"Done."** with no receipt attached | No block yet (first time) |
| 2 | Human | **"No proof. Not done."** → **Correct this** on the message | Correction captured |
| 3 | Otto | Proposal appears in **Curation** | Proposal card with correction context |
| 4 | Human | **Ratify** → **Behavior updated** moment (126) | Standard/practice accepted; check compiles (132) |
| 5 | — | Open **Checks** surface (⌘9) | Compiled check listed; `done_claim` trigger visible |
| 6 | Agent | Tries **"Done."** again (same ticket/thread) | **Blocked** — banner: missing receipts mapped to ACs |
| 7 | Otto | **Receipt** inline card in Chat (124) | `check.run` receipt with check id + source Standard |

Chat command alternative for step 6–7:

```txt
check ticket <ticket-id>
```

## Exact clicks (staging)

1. **Chat** — send worker-style done claim without proof.
2. **Correct this** on human reply → confirm proposal path.
3. **Curation** — open proposal → **Accept** / ratify.
4. **Checks** — verify new or updated check; note `sourceStandard` / slug.
5. **Chat** — repeat done claim → read **CheckBlockBanner** (check name, open receipt, open standard).
6. **Receipts** — confirm `check.run` or compile receipt from ratification step.

## Verification commands

```sh
cd /Users/seb/Code/otto
bun test ./packages/core/src/check.test.ts
bun test ./apps/desktop/electron/check-store.test.ts
bun test ./apps/desktop/electron/check-runner.test.ts
bun test ./apps/desktop/electron/check-compiler.test.ts
```

## Demo fixtures (reset without mock prod data)

Seed checks ship in repo `checks/` and auto-copy on first launch (`check-store.ensureSeeded`):

- `checks/completion-requires-receipts.yaml` — `done_claim` block for No Fake Done path
- `checks/one-way-door-approval.yaml` — autonomy red-zone gate

Disposable profile only — never seed into `conversation=default`. Staging deploy copies seeds into isolated `$OTTO_HOME/checks` (`apps/desktop/scripts/deploy-staging.sh`).

## Marketing hooks (065 otto.haus)

Copy block for hero + behavior loop diagram — **Culture CI** step (prose category; product noun **Checks**):

```txt
Category (prose): Culture CI
Product noun (UI): Checks
Hero: Otto is CI for agent behavior. Every correction can become a regression test.
Loop step: Correction → ratify → compiled Check → next violation blocked with receipt
Block line (demo): Not done: missing mapped proof.
Boundary pill: The human ratifies. otto records the proof.
```

Loop diagram labels (left → right): *Correct* → *Curation* → *Checks* → *Block + Receipt*

Hero asset: `docs/receipts/staging/135-culture-ci-block.png` (CheckBlockBanner in Chat)

## Capture for marketing (064)

- Resolution: 1280×720, captions on block message
- Hero line: *Otto is CI for agent behavior. Every correction can become a regression test.*
- Save screenshot to `docs/receipts/staging/135-culture-ci-block.png`

## Honest limits (v0.3)

- Checks compile from explicit slug map — not full YAML standard parser
- Demo may use staging embedded path (076) without live Letta if runtime mock is on — label recording accordingly
- Worker bounded loop stub until transport follow-up (039)

## Receipt block (append to ticket 135)

```txt
staging_app=/Applications/otto-staging.app
conversation=<disposable id — not default>
check_id=<id from Checks surface>
block_message=<exact banner text>
screenshot=docs/receipts/staging/135-culture-ci-block.png
runtime_ready=true|false
```
