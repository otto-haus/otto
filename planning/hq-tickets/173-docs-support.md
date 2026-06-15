# 173 — SUPPORT.md (help routing)

Owner: Claude
Priority: P2
Depends on: none
Release bucket: docs / contributor experience

## Outcome

A standard `SUPPORT.md` routes visitors to the right channel: Discord for questions/ideas,
GitHub Issues for bugs/features, `SECURITY.md` for vulnerabilities, and the docs for
orientation. GitHub surfaces it in the issue-creation flow and the community profile.

## Why this matters

`SUPPORT.md` is a table-stakes community-health file that signals an actively-maintained,
welcoming project and keeps the issue tracker clean (questions go to Discord, security stays
private). It complements the issue templates (PR #36) and is a low-risk, high-signal win.

Selected by an adversarial discover→select→draft→verify workflow as the safe, fully-groundable
pick after the higher-leverage `START_HERE_BY_ROLE.md` candidate failed verification (it made
ship-status claims that can't be reliably grounded while the README is mid-rewrite across
several open PRs, and linked a doc not yet on main). `START_HERE_BY_ROLE.md` is deferred until
the README status stabilizes.

## Scope

- Add root `SUPPORT.md` routing questions → Discord, bugs/features → GitHub Issues,
  security → `SECURITY.md`, plus doc pointers.
- Honest framing: otto is early/v0.1; support is community-driven, best-effort.

## Out of scope

- Any runtime / app code change
- Editing README/CONTRIBUTING (churned by open PRs)
- A Code of Conduct (declined this session)

## Done when

- Root `SUPPORT.md` exists; every relative link (`README.md`, `SECURITY.md`,
  `CONTRIBUTING.md`, `docs/`) resolves.
- No ship-status overclaiming.

## Verification

```sh
for p in README.md SECURITY.md CONTRIBUTING.md docs; do test -e "$p"; done
git status --short --branch
```

Result: all four linked targets present; Discord link + SECURITY.md grounded against the repo.
