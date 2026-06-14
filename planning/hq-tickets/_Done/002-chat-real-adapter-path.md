# 002 — Chat: Real Adapter Path

Owner: Cursor
Priority: P0
Depends on: 001

## Outcome

User can send a chat message through the real Letta/Otto adapter path.

## Scope

- Chat composer.
- Transcript.
- Real send path.
- No mock responses as connected state.

## Done when

- Chat is blocked unless readiness is true.
- Sending a message uses the real adapter path.
- Response is rendered in transcript.
- Exact blocker is shown if adapter call fails.

## Execution receipt

Status: blocked
Date: 2026-06-13
Implementer: Claude (canonical repo: /Users/seb/Code/otto/.letta/worktrees/otto-v01-integration)

## What changed

Fixed the connection adapter: init was passing the saved conversationId ("default") as the AGENT id
to resumeSession (`--agent default`) -> failed -> recovered on a 2nd attempt. Now always resumes with
the real agent id -> ONE clean init. The real send path (session.send -> CLI stream) is already wired
with no mock responses; errors render in the transcript.

## Files changed (ticket 002 scope)

- apps/desktop/electron/letta-runner.ts -- init() always resumes with the agent id (removed the
  conversationId-as-resume-id recovery bug).

## Verification run

- bun run --cwd apps/desktop electron:typecheck -> exit 0
- bun run --cwd apps/desktop electron:build      -> exit 0
- Real boot (DEBUG_SDK): ONE init attempt with `--agent agent-local-d8e35a2a-...`, initialized: 1
  (no more `--agent default` first-attempt failure).

## Evidence (Done-when -> proof)

1. Chat is blocked unless readiness is true -> composer disabled={!ready||busy}, gated on
   status.ready (Chat.tsx LiveChat). PASS
2. Sending a message uses the real adapter path -> send() -> session.send(text) -> session.stream();
   no mock responses (letta-runner.ts). PASS
3. Response is rendered in transcript -> BLOCKED (see Blocker log). The render path is correct
   (assistant events -> transcript), but the agent returns no assistant turn.
4. Exact blocker is shown if adapter call fails -> the error event renders in the transcript
   (e.g. "429 ... agent-not-found"). PASS

## Blocker log

BLOCKED on Done-when #3 -- Letta-side, not Otto.

The Letta agent agent-local-d8e35a2a-a89f-45dd-b117-5eae5df8c8f2's llm_config is broken: `model` was
rebound to chatgpt-plus-pro/gpt-5.5 but `model_endpoint` is still the placeholder
https://example.invalid/v1 with null handle/provider_name. Every turn POST to
/v1/agents/<id>/messages returns HTTP 429 {"reasons":["agent-not-found"]} -- the server's generic
wrapper for a failed provider binding (reproduced directly via curl, not through Otto).
session.initialize() succeeds (it only loads the agent record) so CONNECTION is fine; the TURN can't run.

Exact fix (Letta-side, Sebastian): rebind the FULL llm_config, not just `model` -- run `letta /model`
and pick a chatgpt-plus-pro/* (or lc-gemini/*) model, OR PATCH the agent with a complete llm_config
(model + model_endpoint + handle + provider_name) from a configured provider. Changing only `model`
leaves the placeholder endpoint and keeps 429ing. All 28 local agents are affected.

Once a turn returns HTTP 200, Done-when #3 passes unchanged -- Otto's adapter + render path is ready.

Reviewer verdict: pending

## Follow-up implementation receipt

Status: fixed locally; not submitted for review yet because `Depends on: 001` is still not in `_Done`
Date: 2026-06-13 18:33 PDT
Implementer: Codex (new worktree: `/Users/seb/Code/otto/.letta/worktrees/ship-001-settings-readiness`)

### What changed

- `apps/desktop/electron/letta-runner.ts`
  - Prefers the installed Letta Desktop CLI at `/Applications/Letta.app/Contents/Resources/app.asar.unpacked/node_modules/@letta-ai/letta-code/letta.js` before the stale bundled CLI, unless `LETTA_CLI_PATH` is explicitly set.
  - Forces `session.initialize()` and `resumeSession()` to use the configured Letta agent id, not the stored `conversationId` value such as `default`.
  - Publishes runtime status updates when a stream emits an error or failed result, so the UI does not remain falsely `connected` after an adapter failure.
  - Stops treating a missing local API key as a blocker for local Letta unless the runtime error actually mentions API key/auth.
- `apps/desktop/electron/shared/types.ts`
  - Adds typed runtime status events alongside message events.
- `apps/desktop/src/runtime.ts`
  - Consumes runtime status events from Electron and updates the shared UI readiness state.
- Installed fixed app bundle over both `/Applications/Otto.app` and `/Applications/otto.app`.
  - Backups: `/Users/seb/.codex/admin/otto-app-backups/20260613-183240`.

### Verification

- `bun run --cwd apps/desktop typecheck` -> pass
- `bun run --cwd apps/desktop electron:typecheck` -> pass
- `OTTO_READINESS_IGNORE_LOCAL_CONFIG=1 bun run --cwd apps/desktop electron:build` -> pass
- `OTTO_READINESS_IGNORE_LOCAL_CONFIG=1 bun run verify:v0` -> 5 passed, 0 failed
- `git diff --check` -> pass
- Local proof bundle send smoke:
  - Result: `/Users/seb/.codex/admin/otto-002-chat-send-smoke-20260613-183144.json`
  - Screenshot: `/Users/seb/.codex/admin/otto-002-chat-send-smoke-20260613-183144.png`
  - Proof: `ok=true`, `sent=true`, `has429=false`, `cliDesktop=true`
- Installed app send smoke:
  - Result: `/Users/seb/.codex/admin/otto-002-installed-chat-send-smoke-20260613-183305.json`
  - Screenshot: `/Users/seb/.codex/admin/otto-002-installed-chat-send-smoke-20260613-183305.png`
  - Proof: `ok=true`, `sent=true`, `has429=false`, `cliDesktop=true`, `errors=[]`, `console=[]`

### Finding

The visible `429 {"reasons":["agent-not-found"]}` was reproducible through the stale/bundled CLI path and bad resume target behavior, not a remaining Otto UI mock-state issue. The installed app now sends through the real adapter path without the 429 in browser/Electron proof. The ticket should be resubmitted to `_InReview` only after `001-settings-letta-readiness.md` is accepted into `_Done`, unless Sebastian explicitly overrides the dependency gate.

## Follow-up implementation receipt (canonical repo)

Status: fixed locally; dependency-blocked from review
Date: 2026-06-13 18:43 PDT
Implementer: Codex
Repo path: `/Users/seb/Code/otto/.letta/worktrees/otto-v01-integration`

### What changed

- Ported the chat adapter fixes into the canonical review repo:
  - Prefer installed Letta Desktop CLI before stale bundled CLI unless `LETTA_CLI_PATH` is explicitly set.
  - Always resume by configured agent id, never by stored `conversationId` such as `default`.
  - Publish runtime status events when a stream result fails, so Chat/Sidebar/Settings do not stay falsely connected after adapter failure.
  - Do not classify local Letta as missing an Otto API key unless the runtime error actually mentions API key/auth.

### Verification

- `bun run --cwd apps/desktop typecheck` -> pass
- `bun run --cwd apps/desktop electron:typecheck` -> pass
- `OTTO_READINESS_IGNORE_LOCAL_CONFIG=1 bun run --cwd apps/desktop electron:build` -> pass
- `OTTO_READINESS_IGNORE_LOCAL_CONFIG=1 bun run verify:v0` -> 5 passed, 0 failed
- Canonical minimal-PATH send smoke:
  - JSON: `/Users/seb/.codex/admin/otto-001-002-canonical-minpath-send-smoke-20260614T014259Z.json`
  - Screenshot: `/Users/seb/.codex/admin/otto-002-canonical-chat-send-20260614T014259Z.png`
  - Result: `ok=true`, `ready=true`, `sent=true`, `has429=false`, `cliDesktop=true`, `console=[]`
  - Visible excerpt: `YOU` -> `Say hello in one short sentence.` -> `OTTO` -> `Hello - ready when you are.`

### Dependency status

This ticket is not moved to `_InReview` because `Depends on: 001`, and `001-settings-letta-readiness.md` is currently in `_InReview`, not `_Done`.

## Review

Reviewer: Codex
Date: 2026-06-13 18:42 PDT
Verdict: blocked

### Checked against

- Chat is blocked unless readiness is true: Pass in current canonical code. `LiveChat` derives `ready` from runtime status and disables both the input and send button when `!ready` or busy.
- Sending a message uses the real adapter path: Pass in current canonical code. Renderer `rt.send()` invokes `window.otto.runtime.send()`, Electron handles `otto:send`, and `LettaRunner.send()` calls `session.send(text)` followed by `session.stream()`.
- Response is rendered in transcript: Evidence exists. The installed-app smoke JSON and screenshot show a real user message and streamed Otto response with `ok=true`, `sent=true`, `has429=false`, `cliDesktop=true`, `errors=[]`, and `console=[]`.
- Exact blocker is shown if adapter call fails: Pass in current canonical code. Runner emits error events, renderer maps them to `who: 'error'`, and Chat renders error text in the transcript.
- Dependency gate: Blocked. `002` depends on `001`; `_Done` is empty and `001-settings-letta-readiness.md` remains in root after reviewer rejection.

### Evidence inspected

- Files:
  - `/Users/seb/Code/otto/.letta/worktrees/otto-v01-integration/apps/desktop/src/surfaces/Chat.tsx`
  - `/Users/seb/Code/otto/.letta/worktrees/otto-v01-integration/apps/desktop/src/runtime.ts`
  - `/Users/seb/Code/otto/.letta/worktrees/otto-v01-integration/apps/desktop/electron/ipc.ts`
  - `/Users/seb/Code/otto/.letta/worktrees/otto-v01-integration/apps/desktop/electron/preload.ts`
  - `/Users/seb/Code/otto/.letta/worktrees/otto-v01-integration/apps/desktop/electron/letta-runner.ts`
  - `/Users/seb/Code/otto/.letta/worktrees/otto-v01-integration/apps/desktop/electron/shared/types.ts`
- Commands:
  - `bun run --cwd apps/desktop typecheck` -> pass
  - `bun run --cwd apps/desktop electron:typecheck` -> pass
  - `OTTO_READINESS_IGNORE_LOCAL_CONFIG=1 bun run --cwd apps/desktop electron:build` -> pass
  - `OTTO_READINESS_IGNORE_LOCAL_CONFIG=1 bun run verify:v0` -> 5 passed, 0 failed
  - `git diff --check` -> pass
  - `rg -n "Vinny|vinny|Veto|veto|cockpit|Cockpit" apps/desktop/src apps/desktop/electron` -> no matches
- UI/artifacts:
  - `/Users/seb/.codex/admin/otto-002-installed-chat-send-smoke-20260613-183305.json`
  - `/Users/seb/.codex/admin/otto-002-installed-chat-send-smoke-20260613-183305.png`
  - `/Users/seb/.codex/admin/otto-002-chat-send-smoke-20260613-183144.json`
- Git diff: current canonical worktree has dirty implementation changes; no whitespace errors found by `git diff --check`.

### Passes

The current canonical code and the attached smoke artifact support the real adapter path, connected chat send, transcript rendering, and visible error path. No mock connected state or old Vinny/Veto/cockpit naming was found in the inspected user-facing desktop code.

### Defects

- Acceptance is blocked by the ticket dependency: `001` is not in `_Done`.
- The ticket's own follow-up receipt also says it should not be submitted for review until `001-settings-letta-readiness.md` is accepted into `_Done`, unless Sebastian explicitly overrides the dependency gate.

### Required changes

- Get `001-settings-letta-readiness.md` through independent review and into `_Done`.
- Resubmit/re-review `002` after the dependency is satisfied, or get an explicit Sebastian override of the dependency gate.

### Optional polish

- None required for this ticket before dependency satisfaction.

### Finding

The implementation appears technically ready, but the conveyor rules do not allow `+1` while the declared dependency is still rejected/rooted.

### Final call needed from Sebastian

Only Sebastian can override the dependency gate. Without that override, this remains blocked.

## Follow-up implementation receipt (fresh canonical proof)

Status: fixed locally; dependency-blocked from review
Date: 2026-06-13 18:58 PDT
Implementer: Codex
Repo path: `/Users/seb/Code/otto/.letta/worktrees/otto-v01-integration`

### What changed

- Kept the real adapter path fixes in canonical code:
  - Desktop CLI override uses installed Letta Desktop CLI.
  - `resumeSession()` uses the configured agent id, not `conversationId`.
  - Failed stream results publish runtime status updates back to the renderer.
  - Chat composer uses the live shared runtime state and sends through Electron IPC to `LettaRunner.send()`.

### Verification

- `bun run --cwd apps/desktop typecheck` -> pass
- `bun run --cwd apps/desktop electron:typecheck` -> pass
- `OTTO_READINESS_IGNORE_LOCAL_CONFIG=1 bun run --cwd apps/desktop electron:build` -> pass
- `OTTO_READINESS_IGNORE_LOCAL_CONFIG=1 bun run verify:v0` -> 5 passed, 0 failed
- `git diff --check` -> pass
- Fresh canonical chat-send smoke:
  - JSON: `/Users/seb/.codex/admin/otto-002-canonical-chat-send-smoke-20260614T015722Z.json`
  - Screenshot: `/Users/seb/.codex/admin/otto-002-canonical-chat-send-20260614T015722Z.png`
  - Result: `ok=true`, `ready=true`, `sent=true`, `assistantReply=true`, `has429=false`, `cliDesktop=true`, `console=[]`
  - Visible excerpt: `YOU` -> `Say hello in one short sentence.` -> `OTTO` -> `Hello — ready when you are.`

### Dependency status

This ticket remains in root because `Depends on: 001`; `001-settings-letta-readiness.md` is currently in `_InReview`, not `_Done`.

## Execution receipt (revision 4 — dependency unblocked)

Status: pass
Date: 2026-06-13 19:40 PDT
Implementer: Codex
Repo path: `/Users/seb/Code/otto/.letta/worktrees/ship-001-settings-readiness-codex-20260613`
Branch: `letta/ship-001-settings-readiness-codex-20260613`
Base integration commit: `e53894e docs: add public install and community links`
Dependency status: `001-settings-letta-readiness.md` is in `_Done` with reviewer `+1`.

## What changed

- Reused the now-reviewed ticket-001 runtime foundation and current integration chat code.
- Confirmed the chat composer is gated by live runtime readiness.
- Confirmed send uses the real Electron -> `LettaRunner.send()` -> `session.send()` -> `session.stream()` path.
- Confirmed assistant messages render in the transcript.
- Confirmed the prior `429 {"reasons":["agent-not-found"]}` failure class is not left displayed as connected; stale-agent stream errors mark runtime not-ready.
- Confirmed smoke tests do not touch `conversation=default`; the proof uses disposable `local-conv-*` conversations.

## Files changed

Ticket-relevant code in the shipper worktree:

- `apps/desktop/electron/letta-runner.ts`
- `apps/desktop/src/runtime.ts`
- `apps/desktop/src/surfaces/Chat.tsx` (current integration implementation)
- `apps/desktop/electron/ipc.ts`
- `apps/desktop/electron/preload.ts`
- `apps/desktop/electron/shared/types.ts`

The staged shipper diff also includes ticket-001 Settings/readiness files already accepted by reviewer `+1`.

## Verification run

- `bun run --cwd apps/desktop typecheck` -> pass
- `bun run --cwd apps/desktop electron:typecheck` -> pass
- `OTTO_READINESS_IGNORE_LOCAL_CONFIG=1 bun run --cwd apps/desktop electron:build` -> pass
- `git diff --cached --check && git diff --check` -> pass
- `codesign --verify --deep --strict --verbose=2 apps/desktop/dist-app/mac-arm64/otto.app` -> valid on disk / satisfies its Designated Requirement

## Evidence

- Fresh disposable chat-send smoke:
  - JSON: `/Users/seb/.codex/admin/otto-002-chat-send-smoke-20260614T023917Z.json`
  - Screenshot: `/Users/seb/.codex/admin/otto-002-chat-send-20260614T023917Z.png`
  - Result: `ok=true`, `ready=true`, `code=ready`, `sessionMode=smoke`, `conversationId=local-conv-27`, `consoleIssues=[]`
  - Messages: user `smoke test: reply with ok`; Otto `ok`
- Signed bundle:
  - `/Users/seb/Code/otto/.letta/worktrees/ship-001-settings-readiness-codex-20260613/apps/desktop/dist-app/mac-arm64/otto.app`
- Codesign log:
  - `/Users/seb/.codex/admin/otto-002-shipper-codesign-20260613-1940.log`
- Smoke runner:
  - `/Users/seb/.codex/admin/otto-electron-cdp-smoke-20260613.mjs`

## Done-when mapping

- Chat is blocked unless readiness is true:
  - `LiveChat` gates textarea/send on `ready`; smoke starts from `RuntimeStatus.ready === true`.
- Sending a message uses the real adapter path:
  - Renderer calls `window.otto.runtime.send()`, IPC calls `LettaRunner.send()`, runner calls `session.send()` and consumes `session.stream()`.
- Response is rendered in transcript:
  - Smoke screenshot and JSON show transcript rows `YOU` -> `smoke test: reply with ok` and `OTTO` -> `ok`.
- Exact blocker is shown if adapter call fails:
  - Runner emits error messages into the transcript and marks classified stale/auth/unreachable errors not-ready.

## Known limitations

- The chat-send proof is from `OTTO_SMOKE=1` disposable conversation mode by design; live app use of `conversation=default` remains allowed.
- The worktree is not committed or pushed.

Reviewer verdict: pending

## Review

Reviewer: Codex independent reviewer
Date: 2026-06-14
Verdict: +1

### Checked against

- Chat is blocked unless readiness is true: pass. `LiveChat` derives `ready` from shared runtime status, refuses submit when not ready, disables the textarea and send button when `!ready`, and `useRuntime().send()` also returns unless `status.ready`.
- Sending a message uses the real adapter path: pass. Renderer `rt.send()` calls `window.otto.runtime.send()`, preload exposes `otto:send`, IPC handles `otto:send` through `LettaRunner.send()`, and the runner calls `session.send(text)` followed by `session.stream()`.
- Response is rendered in transcript: pass. The named smoke JSON and screenshot show `YOU` -> `smoke test: reply with ok` and `OTTO` -> `ok`.
- Exact blocker is shown if adapter call fails: pass. Runner forwards stream error messages to the renderer, marks classified failures not-ready with the friendly exact reason, and Chat renders error messages plus the not-ready blocker panel.
- Dependency gate: pass. `001-settings-letta-readiness.md` is in `_Done` and contains reviewer `+1`.
- Smoke conversation safety: pass. The named smoke artifact used `status.conversationId=local-conv-27`, `sessionMode=smoke`, and kept both `beforeConfig.conversationId` and `afterConfig.conversationId` at `default`; the runner also refuses smoke initialization if the runtime returns `conversation=default`.

### Evidence inspected

- Files:
  - `/Users/seb/Library/CloudStorage/Dropbox/HQ/Otto Tickets/_Done/001-settings-letta-readiness.md`
  - `apps/desktop/src/surfaces/Chat.tsx`
  - `apps/desktop/src/runtime.ts`
  - `apps/desktop/electron/ipc.ts`
  - `apps/desktop/electron/preload.ts`
  - `apps/desktop/electron/letta-runner.ts`
  - `apps/desktop/electron/shared/types.ts`
  - `/Users/seb/.codex/admin/otto-electron-cdp-smoke-20260613.mjs`
- Commands:
  - `git status --short --branch`
  - `git log --oneline --decorate -n 8`
  - `jq '.' /Users/seb/.codex/admin/otto-002-chat-send-smoke-20260614T023917Z.json`
  - `file /Users/seb/.codex/admin/otto-002-chat-send-20260614T023917Z.png`
  - `rg -n "disabled|ready|runtime\\.send|send\\(|who: 'error'|who: \\\"error\\\"" apps/desktop/src/surfaces/Chat.tsx apps/desktop/src/runtime.ts`
  - `rg -n "otto:send|runtime:send|send\\(|LettaRunner|session\\.send|session\\.stream|resumeSession|conversationId|local-conv|OTTO_SMOKE|status" apps/desktop/electron apps/desktop/src/runtime.ts apps/desktop/src/surfaces/Chat.tsx`
  - `rg -n "mock|sample|fake|agent-not-found|429|Vinny|vinny|Veto|veto|cockpit|Cockpit" apps/desktop/src apps/desktop/electron`
  - `git diff --cached --check`
  - `git diff --check`
  - `bun run --cwd apps/desktop typecheck`
  - `bun run --cwd apps/desktop electron:typecheck`
  - `OTTO_READINESS_IGNORE_LOCAL_CONFIG=1 bun run verify:v0`
  - `OTTO_READINESS_IGNORE_LOCAL_CONFIG=1 bun run --cwd apps/desktop electron:build`
  - `codesign --verify --deep --strict --verbose=2 apps/desktop/dist-app/mac-arm64/otto.app`
  - `jq -e '.ok == true and .status.ready == true and .smokeMode == true and .status.sessionMode == "smoke" and .status.conversationId != "default" and .beforeConfig.conversationId == "default" and .afterConfig.conversationId == "default" and ([.assertions[].pass] | all) and (.messages | map(.who) == ["you", "otto"])' /Users/seb/.codex/admin/otto-002-chat-send-smoke-20260614T023917Z.json`
  - `rg -n "conversation=default|Smoke test refused|OTTO_SMOKE|local-conv|smoke conversation|beforeConfig|afterConfig" /Users/seb/.codex/admin/otto-electron-cdp-smoke-20260613.mjs apps/desktop/electron/letta-runner.ts apps/desktop/src/surfaces/Chat.tsx`
- UI/artifacts:
  - `/Users/seb/.codex/admin/otto-002-chat-send-smoke-20260614T023917Z.json`
  - `/Users/seb/.codex/admin/otto-002-chat-send-20260614T023917Z.png`
- Git diff:
  - Current shipper worktree is dirty with the existing staged ticket diff on branch `letta/ship-001-settings-readiness-codex-20260613`; no unstaged diff remained after verification.

### Passes

- Source typecheck, Electron typecheck, `verify:v0`, Electron build, diff whitespace checks, smoke JSON assertions, screenshot inspection, and codesign verification all passed.
- The smoke did not use `conversation=default`; it used disposable `local-conv-27` and did not mutate the persisted config conversation.
- No mock connected response path was found. Web preview still states it is not wired and does not show fake messages.
- No old Vinny/Veto/cockpit naming was found in the inspected desktop source or by `verify:v0`.

### Defects

None blocking.

### Required changes

None.

### Optional polish

- Future receipts should include a source diff hash so proof artifacts can be tied to a staged tree without extra git inspection.

### Finding

Ticket 002 satisfies every Done-when item against the requested shipper worktree and the latest proof artifacts.

### Final call needed from Sebastian

None for ticket 002.
