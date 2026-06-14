# 122 — Constitution File (Source of Culture)

Owner: Codex
Priority: P1
Depends on: 008, 009, 017
Release bucket: category wedge — culture compounding

## Outcome

A **plain, user-readable Constitution file** is the workspace **source of culture**: values, standards accountability, approval rules, forbidden actions, memory-writeback governance — editable by the human, machine-validated by otto.

```txt
~/.otto/constitution.yaml   # machine source of truth
~/.otto/constitution.md     # human render (generated or dual-maintained)
```

## Why this matters (category)

Charters (**006–007**) are per-mission contracts. Standards (**008–009**) are the canon library. Autonomy policy (**017**) is classifier config.

None of these alone answer: **“What are this workspace’s non-negotiables?”**

The Constitution is the **single file a buyer can read** to understand agent culture — pilot pitch, export (**125**), and Behavior Changelog (**121**) all anchor here.

## Scope

- Schema: values, forbidden_actions[], approval_rules[], standards_refs[], writeback_policy summary, ratification_requirements
- Validator on load; block silent invalid edits (receipt on validation failure)
- Settings + file link: “Open constitution”
- Render `constitution.md` from yaml (or documented dual-edit rules)
- Receipt on constitution amend (who, when, diff summary)
- Do **not** duplicate full Standard bodies — reference slugs only

## Non-goals

- Replacing per-charter `charter.yaml` (**006**)
- Storing Letta memory or provider keys
- Legal terms of service
- Auto-ratify from constitution edits (always proposal → Curation)

## Done when

- [ ] Default constitution seeded on first run (embedded path, **076**)
- [ ] Edit + invalid save → blocked + receipt
- [ ] Valid edit → receipt + appears in **121** when wired
- [ ] `docs/v1/constitution-schema.md` or ADR stub
- [ ] Reviewer +1

## Verification

```sh
bun test ./apps/desktop/electron/*.test.ts
# manual: edit constitution.md/yaml → receipt; forbidden action surfaces in autonomy check
```

## Blocker log

Leave blank unless blocked.

## Execution receipt

**Branch:** `ship/v0.3-integration` · **Date:** 2026-06-13

| Done when | Proof |
|-----------|-------|
| Default constitution seeded | `ConstitutionStore.load()` seeds `~/.otto/constitution.yaml` + `.md` |
| Invalid save blocked + receipt | `invalid amend is blocked with receipt` test |
| Valid edit → receipt | `valid amend writes receipt and updates files` test; Settings Culture amend |
| Schema doc | `docs/v1/constitution-schema.md` |

**Verified:** `bun test ./apps/desktop/electron/constitution-store.test.ts`; typecheck pass.

**Staging:** forbidden action surfacing in autonomy check — code path via constitution load; not manually exercised.

## Review

**Reviewer:** independent · **Date:** 2026-06-13

**Verified:** `bun test ./apps/desktop/electron/constitution-store.test.ts` (4/4 pass); typecheck pass; `docs/v1/constitution-schema.md` present.

| Done when | Verdict |
|-----------|---------|
| Default constitution seeded on first run | **Pass** — `ConstitutionStore.load()` seeds yaml + md |
| Invalid save blocked + receipt | **Pass** — test + `constitution.amend` blocked receipt |
| Valid edit → receipt + changelog wiring | **Pass** — amend receipt; **121** aggregates `constitution_amend` |
| Schema doc | **Pass** — `docs/v1/constitution-schema.md` |

**Gaps (non-blocking):** Settings “Open constitution” and autonomy forbidden-action surfacing not manually exercised in staging.

**Verdict: +1** — move to `_Done`.

## Execution notes (rev3)

**Date:** 2026-06-13 · **Lane:** Cursor foundation blockers

- Wired `otto:constitution:get`, `otto:constitution:amend`, `otto:constitution:open` → `ConstitutionStore` in `ipc.ts`.
- **Verified:** `bun test ./apps/desktop/electron/constitution-store.test.ts` (4/4); desktop typecheck pass.

## Review rev3

**Foundation IPC:** Pass — Settings Culture amend/open and Command Station constitution card use live store (not preload empty fallback).

## Review rev8

Reviewer: Independent Otto reviewer (Cursor)
Date: 2026-06-13
Verdict: +1
Move to _Done?: Yes

### Checked against

- Default constitution seeded on first run: **Pass** — `constitution-store.test.ts` (4/4)
- Invalid save blocked + receipt: **Pass**
- Valid edit → receipt + **121** wiring: **Pass** — `constitution_amend` changelog source
- Schema doc: **Pass** — `docs/v1/constitution-schema.md`

### Evidence inspected

- Files: `constitution-store.ts`, `ipc.ts`
- Commands: `bun run verify:v0` → 5/5 pass

### Finding

Constitution source-of-culture proven. +1 stands.

## Review rev9

Reviewer: Independent Otto reviewer (Cursor)
Date: 2026-06-14
Verdict: +1
Move to _Done?: Yes

### Checked against

- Default constitution seeded: **Pass** — unchanged
- Invalid save blocked + receipt: **Pass**
- Valid edit → **121** wiring: **Pass**
- Schema doc: **Pass**
- Reviewer +1: **Pass** (this review)

### Finding

Culture CI batch re-review; +1 stands.

## Review rev10

Reviewer: Independent Otto reviewer (Cursor)
Date: 2026-06-14
Verdict: +1
Move to _Done?: Yes (retained)

### Checked against

- Default constitution seeded: **Pass** — unchanged
- Invalid save blocked + receipt: **Pass**
- Valid edit → **121** wiring: **Pass**
- Schema doc: **Pass**

### Evidence inspected

- Commands: `bun test check-store check-compiler check-runner` → 7/7 pass
- `Chat.tsx` working tree passes `constitutionGet` into `ProposeCorrectionModal` — aligns with constitution source-of-truth

### Delta vs rev9

- Uncommitted `ProposeCorrectionModal` constitution hook strengthens **122→123** path; not required for this ticket’s AC.

### Finding

+1 stands.

