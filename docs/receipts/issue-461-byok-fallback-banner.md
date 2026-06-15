# Issue #461 — BYOK fallback banner receipt

**Problem:** Selecting a BYOK handle Letta cannot resolve left users with no honest signal that requested ≠ active model.

**Fix:**
- `resolveModelHandle()` copy names upstream catalog/validation gap; requested handle stays in config.
- WS runtime exposes `modelFallbackReason` separately from transport fallback.
- Chat shows non-blocking `ModelFallbackBanner` (requested → active) above composer when ready.

**Acceptance:**
- [x] Unavailable handle shows banner with requested → active mapping
- [x] Config retains requested handle (`modelHandle`); session uses `resolved.active`
- [x] Unit test: `model-fallback-banner.test.ts` triggers on `fallbackReason`

**Verify:** `bun test apps/desktop/src/chat/model-fallback-banner.test.ts apps/desktop/electron/runtime-transport/letta-discovery.test.ts` + `bun run typecheck` + `bun run --cwd apps/desktop typecheck`

**Skipped:** staging build, #791, otto.app (per handoff).
