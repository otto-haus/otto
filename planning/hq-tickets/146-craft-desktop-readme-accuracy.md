# 146 — Desktop README: version consistency + truthful dev commands

Owner: Claude
Priority: P2
Depends on: none
Release bucket: later-generated

## Outcome

`apps/desktop/README.md` describes the release as `v0.1` consistently, and its
**Develop** section tells the truth about which command runs the real desktop
app versus the browser-only preview. A developer following the doc no longer
lands on a non-functional web preview by accident.

## Why this matters

Doc craft — the little stuff that wastes real time when wrong.

1. The file called the release `v0` in its opening line while using `v0.1`
   one paragraph later (and the rest of the repo standardizes on `v0.1`). A
   reader can't tell which is authoritative.
2. The **Develop** section listed only `bun run --cwd apps/desktop dev`, which
   runs plain Vite — the **web preview with no desktop bridge**, where chat is
   disabled. For a doc titled "otto Desktop," that silently points developers
   at a preview that can't exercise the app's core flow. The root README
   already distinguishes the two (`task dev` = "Vite web preview; no desktop
   bridge" vs `task electron` = "Electron app wired to local Letta"); the
   per-app README now mirrors that with the package scripts (`dev` vs
   `electron:dev`).

Every claim is traceable to `apps/desktop/package.json` (`dev: vite`,
`electron:dev: electron-vite dev`) and the root README's authoritative labels.

## Scope

- `apps/desktop/README.md`
  - opening line: `v0` → `v0.1` (match line 17 and the repo)
  - Develop section: label `dev` as the no-bridge web preview and add
    `electron:dev` as the full desktop-app command

## Out of scope

- Rewriting/expanding the README beyond these two accuracy fixes
- Changing any scripts in `package.json`
- Paperclip / Cognee / Stacks / broad redesign

## Done when

- The README uses `v0.1` consistently
- The Develop section names both the web preview and the electron dev command,
  with the web preview marked as having no desktop bridge
- No script or behavioral change

## Verification

Commands/checks to run:

```sh
git status --short --branch
grep -nE 'v0\b|v0\.1|electron:dev' apps/desktop/README.md
# cross-check the scripts referenced actually exist:
grep -E '"dev"|"electron:dev"' apps/desktop/package.json
```

## Blocker log

Leave blank unless blocked.
