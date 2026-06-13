# Receipt — Desktop (Otto v0.1)

- **What changed:** Reworked from a static dashboard into a **Letta-style workspace shell** — a left
  sidebar of canonical surfaces (Chat · Charters · Standards · Practices · Routines · Curation ·
  Receipts · Autonomy · Settings), a **chat-primary** central pane, and the house aesthetic
  (near-monochrome warm paper, Inter + IBM Plex Mono, hairline-first, one inverted "ink moment" for
  the one-way-door approval). `@otto-do/desktop`; "cockpit" → "workspace". Old dashboard components removed.
- **Demo:** `demo/out/otto-v01-desktop.mp4`
- **Run command (verify app can run):** `bun --cwd apps/desktop run dev` → http://localhost:5173
  (surfaces deep-link via `#chat`, `#practices`, `#curation`, …). Build: `bun --cwd apps/desktop run build`.
- **Test command/output:** `bun --cwd apps/desktop run typecheck` → exit 0. `… run build` → vite ok,
  23 modules, `dist/` ~220 kB; `gen:practices` wrote 5 specs. Ran headless Chrome against the dev
  server and screenshotted Chat / Practices / Curation — all render correctly.
- **What appears — interactive vs prototype:**
  - **Real / file-backed:** the **Practices** surface reads the generated `practices.json` (Charter
    `active` + 4 drafts, with invocations, guardrails, evidence standard, and the approval floor).
  - **Prototype (sample data, read-only):** Chat thread + ink-moment approval gate; Charters,
    Standards, Routines, Curation queue, Receipts, Autonomy zones, Settings. Sidebar navigation and
    surface switching are interactive; action buttons (Approve / Deny / Send) are not yet wired.
  - **Not built yet:** the live Letta runtime (streaming, real tools, real permission gates) — wires
    through `@letta-ai/letta-code-sdk` in a later phase (see `_Meta/Veto OS Desktop Shell — Spec.md`).
- **Known limitations:** Preview shell only; chat is not connected to the runtime; not Electron-packaged.
  The demo video is a faithful re-enactment, not a live UI capture.
- **Approval status:** ☐ pending Sebastian (Tried + Approved).
