# Desktop convergence (one-app rule)

Otto must not ship two competing desktop apps. This records the decision.

## Decision

- **Canonical desktop (v0.1): `apps/desktop`** — the Vite + React **workspace shell**.
  It embodies the product shape: a left sidebar of canonical surfaces (Chat · Charters ·
  Standards · Practices · Routines · Curation · Receipts · Autonomy · Settings), a
  chat-primary central pane, the house design system, and a real file-backed Practices
  surface (reads the generated `practices.json`). It typechecks and builds clean.
- **Reference-only: `/Users/seb/Code/vinny-desktop`** — an Electron app on
  `@letta-ai/letta-code-sdk`. **Not part of v0.1.** It is the runtime reference, not a
  shipped product.

No v0.1 release implies both are active products.

## Why the Vite shell is canonical for v0.1

Otto v0.1 is a **local-first artifact**, not a SaaS runtime. The Vite shell honestly
represents the product: file-backed panes are real; the chat pane is explicitly marked a
prototype that is **not wired to the Letta runtime**. That is shippable as a preview.

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

## Ported vs unported

- **Ported (as product shape):** the sidebar-surface model, chat-primary layout, house
  aesthetic, and file-backed Practices — all live in `apps/desktop`.
- **Unported (deferred to post-v0.1):** the Electron `main/preload/ipc`, the Letta SDK
  `Session` runner, lane store, trace writer, and the live permission-gate modal.

## Path to converge (post-v0.1, not in this release)

1. Port `electron/` (main, preload, ipc, letta-runner, trace-writer) into `apps/desktop`.
2. `memfs: false` by default; runtime root `~/.otto`; expose a typed `window.otto` IPC surface.
3. Rebrand fully (Otto, `Message Otto…`, no veto/cockpit/Ni); replace lanes with the canonical surfaces.
4. Fix session init (test the `memfs:false` / skip-git-sync hypothesis against the local backend).
5. Send disabled until a session is ready; runtime-unavailable shown cleanly; debug hidden by default.

## v0.1 ship decision

**Desktop ships as a preview workspace shell** (`apps/desktop`), clearly marked: file-backed
panes are real; chat is a prototype not wired to the Letta runtime. The live Electron+Letta
runtime is **deferred**. `vinny-desktop` is reference-only. *(Pending Sebastian's approval to
keep this cutline, or to fund the Electron port as part of v0.1.)*
