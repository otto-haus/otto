# Receipt — Desktop (Otto v0.1)

- **What changed:** `@otto-do/desktop`; all components/data swept to Otto; "cockpit" → "workspace".
- **Demo:** `demo/out/otto-v01-desktop.mp4`
- **Test command/output:** `bun --cwd apps/desktop run typecheck` → exit 0. `bun --cwd apps/desktop run build` →
  vite build ok, 22 modules, `dist/` 204 kB; `gen:practices` wrote 5 specs.
- **Manual verification:** `bun --cwd apps/desktop run dev` then open the workspace (Practices/Runs/Approvals/Receipts panels).
- **Known limitations:** Preview only — reads mock/file data; not production-complete. Demo embeds the real build log, not a live UI capture.
- **Approval status:** ☐ pending Sebastian.
