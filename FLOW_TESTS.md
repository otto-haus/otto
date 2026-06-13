# Otto v0.1 — Flow Tests

What actually runs locally, per surface. Commands run from the repo root on bun 1.3.14.
Deferred/cut surfaces (approvals, autonomy, tickets, knowledge, runs/receipts, worker
orchestration, channels, curation) have **no closing runtime to flow-test** — that is the
point of the cutline. See [`SPEC_COMPLIANCE.md`](SPEC_COMPLIANCE.md).

## Global checks

| Command | Expected | Actual | Pass |
|---|---|---|:--:|
| `bun run verify:v0` | all core checks pass | `result: 5 passed, 0 failed` | ✅ |
| `bun run typecheck` | exit 0 (tsc packages/core) | exit 0 | ✅ |
| `bun test` | unit tests pass | `6 pass / 0 fail` | ✅ |
| `bun --cwd apps/desktop run typecheck` | exit 0 | exit 0 | ✅ |
| `bun --cwd apps/desktop run build` | vite build ok | built (23 modules, dist/ ~220 kB) | ✅ |

## Practices — **ship**

- **Command:** `bun packages/practices/src/cli.ts`
- **Expected:** validates all 5 practice specs.
- **Actual:**
  ```
  slug        status  result
  ----------  ------  ------
  charter     active  ok
  decision    draft   ok
  field-note  draft   ok
  follow-up   draft   ok
  review      draft   ok
  ```
- **Pass:** ✅ · also `bun test` covers the validator (6 tests). **Evidence:** `packages/practices/`, `practices/*/practice.yaml`.
- **Limitations:** the 4 draft practices reuse Charter primitives; not separately implemented.

## Skills — **ship**

- **Command:** `ls skill/ skill/routine/`
- **Expected/Actual:** `skill/SKILL.md`, `skill/routine/SKILL.md` present. ✅
- **Evidence:** `skill/`, `scripts/install.sh`.
- **Limitations:** loading into a live Letta Code agent via `/reload` is **not** automated-tested (manual).

## Charter — **proposed**

- **Command:** `bun run typecheck` + inspect `extension/charter.ts`.
- **Expected:** the permission-gate hook registers and asks before one-way doors.
- **Actual:** typecheck exit 0; gate hook confirmed — `extension/charter.ts:410` `if (letta.capabilities?.permissions && process.env.CHARTER_GATES !== "off")`. ✅ (gate is live working-code)
- **Limitations:** the **Auditor** (AC-by-AC block-on-missing-receipt) is **not implemented**; "proves done" is manual in v0.1. No live-captured end-to-end run (demo is a re-enactment).

## Routines — **proposed**

- **Command:** `cat routines/morning/routine.yaml`
- **Expected/Actual:** spec conforms to `packages/core` Routine; `requires_approval_to_activate: true`. ✅ (files)
- **Limitations:** no automated Routine YAML validation test; recurring Letta-cron scheduler **deferred** (one-off trials only).

## Standards — **proposed**

- **Command:** `head -1 standards/registry.yaml` + `ls standards/{precedents,anti-patterns}/`
- **Expected/Actual:** registry + 1 precedent + 4 anti-patterns present. ✅ (files)
- **Limitations:** "can block work" is **manual editorial review**; automated enforcement is deferred (needs Curation, which is cut).

## Desktop — **proposed**

- **Command:** `bun --cwd apps/desktop run dev` → http://localhost:5173 (surfaces via `#chat`, `#practices`, …)
- **Expected:** workspace shell launches; sidebar nav works; Practices reads real `practices.json`; chat input **disabled** and labeled.
- **Actual:** typecheck + build pass; headless-Chrome screenshots of Chat/Practices/Curation render; chat input now has `disabled` + "not wired to the Letta runtime" label. ✅ (preview)
- **Limitations:** chat is a prototype, **not wired to the Letta runtime**; not Electron-packaged. See [`docs/desktop-convergence.md`](docs/desktop-convergence.md).
