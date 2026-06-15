# 160 — Practices surface subtitle names the wrong primitive

Owner: Claude
Priority: P2
Depends on: none
Release bucket: later-generated

## Outcome

The Practices surface subtitle describes **Practices**, matching every other
surface's self-describing `sub`. It reads "Executable culture with guardrails
and receipt requirements." instead of leading with "Standards" — a different
primitive — on the Practices page.

## Why this matters

Brand/copy accuracy — the little detail that undermines trust in a behavior
product. In `surface-meta.ts`, every `META[surface].sub` describes its own
surface (Charters → operating contracts, Standards → explicit canon, Routines →
bundles of Practices). The Practices entry was the one exception:

```
practices: sub = 'Executable Standards with guardrails and receipt requirements.'
```

A user on the **Practices** surface read a sentence that leads with **Standards**
— the wrong primitive. The repo's own canon defines Practices as "Repeatable
behaviors worth preserving. **Executable culture**." (README concepts table;
`Practices = executable culture`). The minimal fix swaps the cross-wired noun
(`Standards` → `culture`) and keeps the existing "with guardrails and receipt
requirements" framing, which is accurate for Practices.

## Scope

- `apps/desktop/src/surface-meta.ts`, `META.practices.sub`:
  `Executable Standards …` → `Executable culture …` (one noun).

## Out of scope

- The "coming soon" gating / `ComingSoonSurface` (dirty in the active branch)
- Other surface copy (each already self-describes correctly)
- Any layout/CSS change

## Done when

- Practices subtitle leads with the Practices concept, not "Standards"
- `tsc --noEmit` (app) passes
- Before/after screenshots of `#practices` attached

## Verification

```sh
git status --short --branch
grep -n "practices:" apps/desktop/src/surface-meta.ts   # sub now 'Executable culture …'
cd apps/desktop && tsc --noEmit -p tsconfig.json
```

Visual: `#practices` subtitle reads "Executable culture with guardrails and
receipt requirements." Headless Chrome vs Vite preview.

## Blocker log

Leave blank unless blocked.
