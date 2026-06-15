# Issue #278 — composer auto-expand receipt

**Problem:** Chat composer stayed single-line while typing longer prompts.

**Root cause:** Flex layout + `height: auto` reset did not reliably grow the textarea; no internal scroll after the cap.

**Fix:**
- `syncComposerTextareaHeight()` resets to `0px`, measures `scrollHeight`, caps at 200px, toggles `overflow-y`.
- `useLayoutEffect` on draft so height updates before paint (including restored local drafts).
- CSS: `min-width: 0`, `box-sizing: border-box`, `overflow-y: hidden` baseline for flex child.

**Before:** Inline `height: auto` in `useEffect`; textarea visually capped at one row in the prompt box.

**After:** Composer grows with wrapped lines up to ~200px, then scrolls internally; shrinks again when text is cleared.

**Verify:** `bun test apps/desktop/src/chat/composer-textarea.test.ts` + `bun run typecheck`.
