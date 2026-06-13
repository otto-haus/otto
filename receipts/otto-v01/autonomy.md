# Receipt — Autonomy (Otto v0.1)

- **What changed:** `docs/autonomy.md`, `docs/ticketcraft.md`, `templates/worker-packet.md` swept to Otto; agent identity "Main Vinny" → "Main Otto"; example worktree paths genericized to `~/Code/otto`.
- **Demo:** `demo/out/otto-v01-autonomy.mp4`
- **Test command/output:** No automated test (spec + templates). `bun run typecheck` → exit 0.
- **Manual verification:** `cat docs/autonomy.md` (green/yellow/red zones); `cat templates/worker-packet.md` (bounded ticket packet).
- **Known limitations:** `/ticket` compiler is spec + templates in v0.1; no end-to-end multi-worker orchestration captured.
- **Approval status:** ☐ pending Sebastian.
