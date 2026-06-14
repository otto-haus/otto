# Ship Check — Skills

## Spec promise

Skills are reusable capability/context packages an agent loads to do a kind of work.

## Required file contract

- [x] Core Otto skill exists.
  - Evidence: `skill/SKILL.md`

- [x] Routine skill exists if claimed.
  - Evidence: `skill/routine/SKILL.md`

- [x] Skill docs include triggers, workflow, constraints, and outputs.
  - Evidence: frontmatter `description` + workflow sections in both SKILL.md files

- [x] Install/load instructions exist.
  - Evidence: `scripts/install.sh` — symlinks extensions + copies skills to Letta memory dir

## Required runtime behavior

- [x] Skills load from file-backed canon in desktop.
  - Evidence: `SkillStore` (`apps/desktop/electron/skill-store.ts`); IPC `otto:skills:list`; Skills pane with `storage: files` pill

- [~] Skills can be installed or loaded in Letta Code.
  - Partial: `scripts/install.sh` + extensions exist; no CI harness for live Letta `/reload`

- [x] Skills point to real repo artifacts and current naming.
  - Evidence: `skill-store.test.ts` loads `otto` slug from `skill/SKILL.md`

## Required demo

- [x] `demo/out/otto-v01-skills.mp4` shows actual skill files and what they enable.
  - Evidence: `demo/out/otto-v01-skills.mp4` exists

## Required receipt

- [x] `receipts/otto-v01/skills.md` states manual vs automated verification.
  - Evidence: `receipts/otto-v01/skills.md` + `skill-store.test.ts`

## Staging smoke (desktop pane)

- Load: Skills pane lists SKILL.md packages from `skill/`
- Empty: no skills dir → honest empty state (store returns empty list)
- Error: IPC failure surfaces notice banner
- File/live pill: `storage: files` chip visible

## Automated verification

```sh
bun test ./apps/desktop/electron/skill-store.test.ts
```

## Status legend

- `[x]` Done — evidence path required
- `[~]` Partial / prototype / proposed — evidence + gap required
- `[ ]` Not done — missing work required

## Ship decision

**Ship in v0.1** — file-backed loader + desktop surface; Letta install path manual.

## Truth rule

If it cannot be run, inspected, proven, and approved, it is not Shipped.
