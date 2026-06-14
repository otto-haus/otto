# 129 — CI: Verify Gate on Main

Owner: Cursor
Priority: P2
Depends on: 054, 063
Release bucket: engineering hygiene

## Outcome

GitHub Actions (or repo CI) runs the **narrow otto verify suite** on every push/PR to `main` — same commands as `AGENTS.md` — and **blocks merge** on failure.

## Why this matters

**054** cleans the tree; **063** is Sebastian’s release gate. **129** prevents regression between human releases — especially after **076** embedded path lands.

## Scope

- Workflow file (e.g. `.github/workflows/verify.yml`) running:

```sh
bun install
bun run typecheck
bun test
bun run verify:v0
bun run --cwd apps/desktop typecheck
bun run --cwd apps/desktop electron:typecheck
```

- PR + push to `main` triggers
- No secrets in CI (otto v1 local-only; Letta smoke stays out of CI or uses mocked path)
- Document in **063** release checklist: CI green required before Sebastian gate
- Badge optional in README — not required for done

## Non-goals

- Electron E2E in CI (staging smoke stays manual per **091**)
- Deploy/publish on green
- Letta live connection in CI

## Done when

- [ ] CI runs on PR; failing typecheck blocks merge
- [ ] One intentional break → CI red → fix → green (receipt in ticket)
- [ ] Reviewer +1

## Verification

```sh
# local dry-run same commands as workflow
act push  # optional if act installed; else link to first green GitHub run
```

## Blocker log

Leave blank unless blocked.
