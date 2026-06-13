# Desktop convergence (one-app rule)

Otto must not ship two competing desktop apps. This records the decision.

## Decision

- **Canonical desktop: `apps/desktop`** — now a real **Electron** app (Vite + React renderer +
  an Electron main process with the Letta runtime). It keeps the product shape (sidebar of
  canonical surfaces, chat-primary, house design, file-backed Practices) AND adds the runtime
  layer ported here. It also still runs as a **web preview** (`bun run --cwd apps/desktop dev`)
  for fast iteration.
- **Superseded — reference-only: `~/Code/vinny-desktop`** — the original Electron spike. Its
  useful pieces are ported; it is no longer a product and is not part of any release.

No v0.1 release implies both are active products.

## Two run modes (same renderer)

- **Web preview** (`dev`/`build`) — no `window.otto`; file-backed panes; chat honestly disabled.
  Screenshottable; used for verification.
- **Electron** (`electron:dev`/`electron:build`) — `window.otto` present; the renderer's LiveChat
  calls `runtime.init()` and enables Send only after `session.initialize()` succeeds.

## State of the Electron reference app

Architecturally it matches the Desktop Shell Spec (`_Meta/Veto OS Desktop Shell — Spec.md`):
`electron/main.ts · preload.ts · ipc.ts · letta-runner.ts · trace-writer.ts · lane-store.ts`
plus a `ui/` (Sidebar, Chat, PromptBox, ToolCard, PermissionModal, DebugPanel). But for v0.1
it is **not usable**:

- **Stale/half-renamed branding** — stray `veto` / `cockpit` / `Ni` artifacts and a
  `Message Vinny…` placeholder; data dir `~/.veto-os` (should be `~/.otto`).
- **Session init fails** — `session:start` → "no init message received"; the CLI errors on a
  memory git sync: `git clone http://localhost:<port>/v1/git/agent-…/state.git` → **HTTP 400**.
  Most likely the SDK attempts a MemFS git sync that the **local Letta backend** does not
  expose for local agents. Untested hypothesis: run with `memfs: false` (or skip git sync for
  local-backend agents) so init does not depend on `state.git`.
- **Launch footgun** — Electron fails if `ELECTRON_RUN_AS_NODE=1` is inherited; must launch
  with `env -u ELECTRON_RUN_AS_NODE`.

These are real fixes, but they require touching Letta-backend/runtime integration — out of
scope for a local-first v0.1 (see the Build Contract "stop and ask if Electron runtime
requires Letta backend changes").

## Ported (done) vs still to prove

- **Ported into `apps/desktop` (typechecks + builds):** `electron/main` (BrowserWindow "Otto"),
  `preload` (`window.otto`), `ipc`, `letta-runner` (single session, **memfs off by default**,
  `OTTO_AGENT_ID`, `LETTA_CLI_PATH` override, **conversation recovery**), `config-store`
  (`~/.otto/config.json`), `trace-writer` (`~/.otto/runs`). Renderer LiveChat gates Send on
  `session.initialize()`. No `veto`/`cockpit`/`Ni`/`~/.veto-os`; no hardcoded agent; no lanes.
- **Still to prove (needs a display + Sebastian's Letta backend):** a live launch + one real turn.
  `OTTO_AGENT_ID=<id> bun run --cwd apps/desktop electron:dev` (prefix `env -u ELECTRON_RUN_AS_NODE`
  if that var is inherited). The Letta review confirmed the agent is reachable, so this should connect.
- **Deferred (post-v0.1):** the dedicated permission-gate modal (canUseTool is routed to the
  renderer over IPC but the approval-modal UI is not built — approval buttons stay disabled until it is);
  live token streaming via `extractStreamTextDelta`.

## v0.1 ship decision

**Desktop ships as the canonical Otto workspace shell** (`apps/desktop`). The Electron runtime is
ported and builds; **chat is gated on a real `session.initialize()`** and reports the Letta blocker
truthfully when not connected. The web preview remains an honest, file-backed fallback.
`vinny-desktop` is superseded/reference-only. *(Pending Sebastian's launch to prove the live turn,
and approval of the cutline.)*
