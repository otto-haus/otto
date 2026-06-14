# Constitution schema (`otto.constitution.v1`)

Machine source: `~/.otto/constitution.yaml`  
Human render: `~/.otto/constitution.md` (generated from YAML)

## Purpose

Single workspace file for non-negotiable culture: values, forbidden actions, approval rules, standards references, and memory-writeback governance.

## Required fields

| Field | Type | Notes |
|-------|------|-------|
| `schema` | string | Must be `otto.constitution.v1` |
| `version` | string | Semver or label |
| `values` | string[] | Culture principles |
| `forbidden_actions` | string[] | Non-negotiable prohibitions |
| `approval_rules` | string[] | When human ratification is required |
| `standards_refs` | string[] | Standard slugs only — not full bodies |
| `ratification_requirements` | string[] | What happens on accept/reject |
| `writeback_policy` | object | See below |

### `writeback_policy`

| Field | Type | Constraint |
|-------|------|------------|
| `mode` | string | Must be `proposal_only` |
| `requires_curation_accept` | boolean | Must be `true` |
| `silent_apply_forbidden` | boolean | Must be `true` |

## Optional fields

- `amended_at` — ISO timestamp set on successful amend
- `amended_by` — operator id (`user` default)

## Validation

`ConstitutionStore.validateYaml()` runs on load and amend. Invalid saves are **blocked** with a receipt (`constitution.amend`, status `blocked`).

## Amend flow

1. Operator edits YAML (Settings or external editor).
2. `otto:constitution:amend` validates and writes files + receipt on success.
3. Successful amends appear in **Behavior Changelog** (`constitution_amend` source).

Constitution edits do **not** auto-ratify canon — they still require proposal → Curation for standards/practices/routines.

## Related tickets

- **121** Behavior Changelog aggregates constitution amends
- **125** Culture export includes `constitution.yaml` + `constitution.md`
- **128** `writeback_policy` gates memory proposals in UI
