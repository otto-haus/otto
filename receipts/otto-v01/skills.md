# Receipt — Skills (Otto v0.1)

- **What changed:** `skill/SKILL.md` (Charter) and `skill/routine/SKILL.md` swept to Otto; runtime-root docs updated to `OTTO_HOME`/`~/.otto`.
- **Demo:** `demo/out/otto-v01-skills.mp4`
- **Test command/output:**
  ```sh
  bun test ./apps/desktop/electron/skill-store.test.ts
  # 2 pass — loads otto slug from skill/SKILL.md
  ```
- **Manual verification (staging):** Skills pane → `storage: files` pill → charter + routine cards visible.
- **Known limitations:** Only the charter + routine skills ship; no broader skill catalog in v0.1.
- **Approval status:** ☐ pending Sebastian.
