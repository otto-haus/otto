# 132 — Compile Ratified Standard → Check

Owner: Codex
Priority: P0
Depends on: 131, 048, 126, 008, 009
Release bucket: category wedge — **Culture CI** (prose); product primitive **Checks**

## Outcome

When Curation **accepts** a proposal whose target ratifies a **Standard** (or amends one), otto **compiles** (or updates) a **Check** linked to that Standard.

Compression:

```txt
Correction → Proposal → Ratified Standard → Check → (runtime enforces)
```

## Why this matters

Without compilation, ratification only updates files humans may read. With compilation, ratification updates **what the system can block next time**.

Pairs with **126** (“Behavior updated”) — toast is the human moment; compiled Check is the machine consequence.

## Naming (locked)

- **Checks** — product primitive (peer to Standards, Practices, Receipts); UI labels, IPC, code
- **Culture CI** — category thesis in README/marketing prose only — not a nav or pane title
- **Practices** — repeatable behavior specs; **Checks** — executable regressions compiled from ratified **Standards** (see **131**)

## Scope

- **Compiler module:** `apps/desktop/electron/check-compiler.ts` (or `packages/core` if shared)
- **Inputs:** accepted proposal, target standard path/id, standard body metadata
- **Output:** Check artifact per **131** schema (`otto.check.v1`) written to `~/.otto/checks/<id>.yaml`
- **Provenance:** `source`, `compiled_from_proposal_id`, `compiled_at`, `standard_hash`
- **Idempotency:** re-accept / amend updates check version; does not duplicate ids
- **Fallback:** standards without machine-compilable rules → no check (honest log/receipt), not silent fake check
- **IPC:** `checks.list`, `checks.get` (read-only for UI **134**)
- Hook: Curation accept path after canon apply (**016**, **126**)

## Non-goals

- Compiling Practices/Routines automatically (future; manual seed only in **133**)
- LLM-generated check logic from free text (v1: explicit mapping table / tagged standard sections only)
- Letta memory compilation (**128** remains separate gate)

## Done when

- [ ] Accept fixture proposal targeting Standard → check file exists with correct `source`
- [ ] Re-accept updates version; `checks.list` returns active checks
- [ ] Receipt records `check_compiled` with check id + standard ref
- [ ] Unit tests: compile, idempotent update, skip non-compilable standard
- [ ] Reviewer +1

## Verification

```sh
bun test ./apps/desktop/electron/check-compiler.test.ts
bun test ./apps/desktop/electron/proposal-store.test.ts
```

## Blocker log

Leave blank unless blocked.
