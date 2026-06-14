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
