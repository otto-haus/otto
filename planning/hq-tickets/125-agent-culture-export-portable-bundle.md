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
