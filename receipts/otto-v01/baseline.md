# Receipt — Baseline (Otto v0.1 spec-compliance build)

Established before the spec-compliance phases (PLAN.md Phase 0).

- **Branch:** `letta/otto-v01-integration` (worktree `<repo root>`); 8 commits ahead of the release base; working tree clean.
- **Baseline checks (pre-rename):**
  - `bun run verify:v0` → 5 / 5 pass
  - `bun run typecheck` → exit 0
  - `bun test` → 6 pass / 0 fail
  - `bun --cwd apps/desktop run typecheck` → exit 0
  - `bun --cwd apps/desktop run build` → vite build ok
- **Namespace at baseline:** `@otto-do` / `otto-do/otto` (20 files, 41 occurrences) — swept to `@otto-haus` / `otto-haus/otto` in Phase 1.
- **Electron reference app:** `~/Code/vinny-desktop` exists (electron.vite + src + package.json). Per Sebastian's report it still shows `veto` / `OS · COCKPIT` / `Message Vinny...` and session init fails (memory git-sync HTTP 400 against the local Letta backend). **Treated as reference-only** in this build; canonical desktop is `apps/desktop` (Vite shell). See `docs/desktop-convergence.md` (to be written) and the one-app decision.
- **Known broken flows (carried into the audit):**
  - Electron app: stale branding + session init failure (not yet fixed).
  - `apps/desktop` (Vite): preview shell — file-backed panes work; chat is NOT wired to the Letta runtime.
  - Curation / Approvals / Channels / worker orchestration: spec + templates, no central runtime engine.
  - Knowledge: proposed surface, routing unratified.
- **Stack decision (recorded):** local-first only for v0.1 — files + Letta + Bun/TS + Electron/Vite/React + Git + Remotion. No WorkOS / Supabase / hosted DB / auth / billing / backend.
