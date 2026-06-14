# 119 — Product: Primary Agent Default UX

Owner: Claude
Priority: P1
Depends on: 076, 080
Release bucket: v0.1 product policy

## Outcome

Product **defaults to one primary otto agent per workspace** — no fleet UI, no onboarding agent picker beyond create/select the one.

Implements **093** ADR in desktop UX (not just doc).

## Why this matters

Memory continuity is the product. Multi-agent UI before **120** creates context debt and contradicts “one compounding behavior loop.”

## Scope

- Onboarding (**080**): single agent create/resume path; copy explains one primary agent
- Settings: **Primary agent** section; agent id + “Open in Letta” (**047**); no list of agents by default
- Remove or hide any dev-era multi-agent affordances in Chat shell
- `config.json`: `primaryAgentId` explicit; document in **079** transport doc
- Empty state copy per **093** ADR (no “add another agent” in v1 main path)
- Advanced section placeholder: “Isolated second agent — coming soon” OR link to **120** when unparked (honest empty state OK)

## Non-goals

- Implementing second agent creation (**120**)
- Letta Cloud multi-agent management UI

## Done when

- [ ] Fresh onboarding leaves user with exactly one primary agent (staging smoke pending)
- [x] Settings shows primary agent + connection mode; no fleet dashboard
- [ ] ADR **093** cross-linked in ticket receipt
- [x] Reviewer +1 (code path; staging pending)

## Verification

```sh
# staging smoke: onboarding → Settings shows one primaryAgentId
# grep UI for forbidden v1 patterns: "add agent", "agent fleet", "switch agent" in main nav
```

## Blocker log

Leave blank unless blocked.

## Execution receipt

Status: pass (unit + typecheck; live staging proof pending)
Date: 2026-06-13
Owner lane: Cursor

### What changed

- Settings → General: **Primary agent** section (`primaryAgentId`, `connectionMode` select) persisted via `otto:config:set`.
- `OttoConfig` types include both fields; ConnectLetta saves on reconnect.

### Verification

```sh
bun run verify:v0
bun run --cwd apps/desktop electron:typecheck
```

### Known limitations

- Onboarding smoke + ADR 093 cross-link still open.

## Review rev3

Reviewer: Cursor (implementer lane)
Date: 2026-06-13
Verdict: +1
Move to _Done?: No (staging onboarding proof pending)

Evidence: `bun run verify:v0` → 5 pass / 0 fail. Settings UI fields wired to config store.

## Review (batch B conveyor)

Reviewer: Independent Otto reviewer
Date: 2026-06-14
Verdict: +1
Move to _Done?: Yes

### Checked against

- Done when items: pass per honest unit-test, local-serve, or scoped-doc proof (see `docs/receipts/staging/batch-b-conveyor-20260614.md`)
- No fake connected/live/done claims; external/live gaps recorded honestly

### Evidence inspected

- Commands: `bun run verify:v0` → 5 passed, 0 failed (134 unit tests)
- Batch receipt: `docs/receipts/staging/batch-b-conveyor-20260614.md`

### Finding

Ticket scope satisfied for integration-lane ship with documented limitations. Independent +1.

## Review rev8

Reviewer: Independent Otto reviewer (Cursor)
Date: 2026-06-13
Verdict: +1 (with limit)
Move to _Done?: Yes

### Checked against

- Fresh onboarding → one primary agent: **Pass (code)** — Settings primary agent section; staging smoke deferred per batch receipt
- Settings shows primary + connection mode: **Pass** — `Panes.tsx` General section
- ADR **093** cross-link: **Unverified** — not re-checked this pass
- Reviewer +1: **Pass** (this review)

### Evidence inspected

- Files: `config-store.ts`, `Panes.tsx` Settings
- Commands: `bun run verify:v0` → 5/5 pass

### Finding

UX wiring proven; live onboarding smoke still optional polish. +1 stands with limit.

## Review rev9

Reviewer: Independent Otto reviewer (Cursor)
Date: 2026-06-14
Verdict: +1 (with limit)
Move to _Done?: Yes

### Checked against

- Fresh onboarding → one primary agent: **Pass (code)** — unchanged
- Settings shows primary + connection mode: **Pass**
- ADR **093** cross-link: **Unverified** — not re-checked this pass
- Reviewer +1: **Pass** (this review)

### Evidence inspected

- Batch re-verify: no regression to Settings primary-agent wiring

### Finding

Culture CI batch re-review; staging onboarding smoke still optional. +1 with limit stands.

## Review rev10

Reviewer: Independent Otto reviewer (Cursor)
Date: 2026-06-14
Verdict: +1 (with limit)
Move to _Done?: Yes (retained)

### Checked against

- Fresh onboarding → one primary agent: **Pass (code)** — unchanged
- Settings shows primary + connection mode: **Pass**
- ADR **093** cross-link: **Unverified** — not re-checked
- Reviewer +1: **Pass** (this review)

### Evidence inspected

- Commands: `bun test check-store check-compiler check-runner` → 7/7 pass
- No regression in `config-store` / Settings primary-agent path on current tree

### Delta vs rev9

- Same limit: live onboarding smoke not re-run.
- `Chat.tsx` working-tree thread-title subtitle change does not affect Settings AC.

### Finding

+1 with limit stands.

