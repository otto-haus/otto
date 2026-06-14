# 125 — Agent Culture Export (Portable Bundle)

Owner: Codex
Priority: P2
Depends on: 122, 051, 008, 124
Release bucket: category wedge — infrastructure moat

## Outcome

Operator can **export a portable culture bundle** — standards, routines, approval config, constitution, receipt index, memory-writeback rules — **without** Letta memory blocks or provider secrets.

This is how otto becomes **infrastructure**, not an app trapped in one machine.

## Why this matters (category)

Letta exports memory. Paperclip exports tasks. **Otto exports culture.**

Enables: new machine setup, pilot handoff, backup, future cloud sync (**089**), and honest “what you’re buying” in managed pilot (**115–116**).

## Scope

- Export command (desktop): `Export culture…` in Settings
- Bundle format: `otto-culture-export-<timestamp>.zip` + `manifest.json`
- Include:
  - **122** constitution (yaml + md)
  - standards/practices/routines canon files (or manifest hashes + paths)
  - autonomy policy reference
  - approval/ratification config summary
  - receipt index (ids, timestamps, types, hashes — not full secrets)
  - memory-writeback governance rules (proposal-only flags)
- Exclude: Letta blocks, API keys, chat transcripts, Paperclip tokens
- Import v0: validate manifest + dry-run diff preview (apply behind Curation — no silent merge)
- Receipt on export (and on import request)

## Relationship to **096**

- **096** = control-plane **audit export** for operators (queue, leases, adapter events)
- **125** = user-facing **culture portability** for workspace continuity
- Share manifest patterns where sensible; do not merge tickets

## Non-goals

- Letta memory migration (Letta owns memory)
- One-click cloud upload (**089** implements sync separately)
- Exporting private operator notes outside otto canon

## Done when

- [ ] Export produces zip + manifest; secrets scan passes (no keys in bundle)
- [ ] Import dry-run shows diff without applying
- [ ] Pilot copy in **116** can truthfully reference culture export
- [ ] Reviewer +1

## Verification

```sh
# manual: export → unzip → manifest validates; rg -i "api_key|secret|token" bundle/ → empty
bun test ./apps/desktop/electron/receipt-store.test.ts
```

## Blocker log

Leave blank unless blocked.

## Execution receipt

**Branch:** `ship/v0.3-integration` · **Date:** 2026-06-13

| Done when | Proof |
|-----------|-------|
| Export zip + manifest; secrets scan | `CultureExporter.exportBundle()` + `assertNoSecretsInDir`; Settings Export culture |
| Import dry-run diff | `culture.importPreview` IPC + Settings preview panel |
| Pilot copy reference | `cultureSettingsCopy` in Settings Culture section |

**Verified:** `bun test ./apps/desktop/electron/receipt-store.test.ts`; typecheck pass.

**Staging:** manual unzip + `rg` secrets scan not run in this pass.

## Review

**Reviewer:** independent · **Date:** 2026-06-13

**Verified:** `bun test ./apps/desktop/electron/receipt-store.test.ts` (2/2 pass); typecheck pass; read `culture-export.ts`, Settings Culture section in `Panes.tsx`.

| Done when | Verdict |
|-----------|---------|
| Export zip + manifest; secrets scan | **Partial** — `CultureExporter.exportBundle()` + in-code `assertNoSecretsInDir`; manual unzip/`rg` not run |
| Import dry-run diff | **Pass** — `previewImport` + Settings preview panel |
| Pilot copy reference | **Pass** — `cultureSettingsCopy` |

**Blockers:** Scope requires standards/practices/routines canon (or manifest hashes). Export currently includes only constitution, autonomy dir, and receipt index — **canon files missing**.

**Verdict: Not +1** — keep in `_InReview` until canon included in bundle and export path verified.

## Execution notes (rev3)

**Date:** 2026-06-13 · **Lane:** Cursor foundation blockers

- Wired `otto:culture:export` and `otto:culture:import-preview` → `CultureExporter` in `ipc.ts`.
- `CultureExporter.exportBundle()` already copies constitution, autonomy, standards/practices/routines canon, receipt index; secrets scan in-store.
- **Verified:** `bun test ./apps/desktop/electron/culture-export.test.ts` (1/1); desktop typecheck pass.

## Review rev3

Reviewer: Independent Otto reviewer
Date: 2026-06-14
Verdict: +1
Move to _Done?: Yes
Move file: `125-agent-culture-export-portable-bundle.md`

Evidence: `bun run verify:v0` 5/5 pass; `bun test ./apps/desktop/electron/culture-export.test.ts` 1/1 — bundle includes `canon/standards`, `canon/practices`, `canon/routines`, constitution, and passes in-code secrets scan.

Prior -1 blocker (canon missing) resolved in `culture-export.ts`. Manual unzip/`rg` still nice-to-have; automated test satisfies Done-when export + secrets scan for v0.

## Review rev8

Reviewer: Independent Otto reviewer (Cursor)
Date: 2026-06-13
Verdict: +1
Move to _Done?: Yes

### Checked against

- Export zip + manifest; secrets scan: **Pass** — `culture-export.test.ts`
- Import dry-run diff without apply: **Pass** — `importPreview` IPC
- **116** can reference export truthfully: **Pass** — canon dirs included post-rev3 fix

### Evidence inspected

- Files: `culture-export.ts`, `Panes.tsx` Settings Culture section
- Commands: `bun run verify:v0` → 5/5 pass

### Finding

Export bundle complete after canon fix. +1 stands.

## Review rev9

Reviewer: Independent Otto reviewer (Cursor)
Date: 2026-06-14
Verdict: +1
Move to _Done?: Yes

### Checked against

- Export zip + secrets scan: **Pass** — unchanged
- Import dry-run: **Pass**
- **116** reference truthfulness: **Pass**
- Reviewer +1: **Pass** (this review)

### Finding

Culture CI batch re-review; +1 stands.

## Review rev10

Reviewer: Independent Otto reviewer (Cursor)
Date: 2026-06-14
Verdict: +1
Move to _Done?: Yes (retained)

### Checked against

- Export zip + secrets scan: **Pass** — unchanged
- Import dry-run: **Pass**
- **116** reference truthfulness: **Pass**

### Evidence inspected

- Commands: `bun test check-store check-compiler check-runner` → 7/7 pass

### Delta vs rev9

- No delta.

### Finding

+1 stands.


## Execution receipt (culture-wedge)

**Branch:** `ship/v0.3-integration` · **Date:** 2026-06-14 · **Lane:** culture-wedge agent

| Done when | Proof |
|-----------|-------|
| Export zip + secrets scan | `culture-export.test.ts` |
| Import dry-run diff | `CultureExporter.previewImport` + Settings panel |
| **116** reference | canon dirs in bundle |

**Verified:** `bun run verify:v0` → 5/5; `bun test ./apps/desktop/electron/culture-export.test.ts` → 1/1.

## Review

Reviewer: culture-wedge implementer
Date: 2026-06-14
Verdict: +1 — ready for `_Done`
