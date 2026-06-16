# Follow-up: #578 Labs voice/image gates

**Issue:** https://github.com/otto-haus/otto/issues/578  
**Branch:** `bugfix/578-labs-voice-image-gates`  
**Scout pick:** #578 over #610 — clearer acceptance (config ids + Settings blocked state + docs); #610 window teardown is lifecycle-heavy M.

## Changes

- Added `voice_realtime` and `image_gen` to `LabFeatureId`, `LAB_FEATURE_IDS`, `LAB_FEATURE_META`
- Gate helpers: `isVoiceRealtimeEnabled`, `isImageGenEnabled` (default off; master + feature required)
- Settings → General → **Voice & image (Labs)** panel with master toggle, per-feature opt-in, blocked copy
- Matrix + `docs/v1/labs.md` updated

## Verify

```sh
bun test apps/desktop/electron/labs-config.test.ts apps/desktop/src/surfaces/labs-voice-image-gates.test.ts
bun run check:ship-tier-matrix
bun run --cwd apps/desktop typecheck
bun run --cwd apps/desktop electron:typecheck
```

## Next

- #610 window close teardown (macOS dock reopen / runner leak)
- #510 / #511 wire capture UI and image tool behind these gates
