# 158 — GitHub issue templates (bug report + feature request)

Owner: Claude
Priority: P2
Depends on: none
Release bucket: docs / contributor experience

## Outcome

New visitors who hit a bug or have an idea get a guided issue form instead of a blank
box. Reports arrive structured (area, repro, expected vs actual, checks run) and auto-
labeled, so maintainers triage faster and contributors know what "a good issue" looks like.

## Why this matters

Issue templates are a standard signal that a repo is maintained and welcoming — they lower
the bar to a first contribution and raise the quality of incoming reports. Blank issues
were enabled and there was no triage scaffolding; this is a low-risk, docs-only on-ramp
that makes otto more star-worthy and contributor-friendly without touching runtime code.

## Scope

- Add `.github/ISSUE_TEMPLATE/config.yml` — disable blank issues, route questions to
  Discord and security reports to SECURITY.md.
- Add `.github/ISSUE_TEMPLATE/bug_report.yml` — structured form with an Area dropdown
  (extension / skill / desktop / packages / docs), repro steps, and the real proof
  commands (`bun run typecheck`, `bun test`, `bun run verify:v0`).
- Add `.github/ISSUE_TEMPLATE/feature_request.yml` — frames proposals around the
  "keep the core generic" principle from CONTRIBUTING.md.

## Out of scope

- Any runtime / app code change
- Changing repo description or topics (proposed in PR body only)
- New CI or workflow automation

## Done when

- Three files exist under `.github/ISSUE_TEMPLATE/` and parse as valid YAML.
- Referenced labels (`bug`, `enhancement`) already exist in the repo.
- Referenced paths/commands map to real files and package.json scripts.
- Verification recorded below.

## Verification

```sh
python3 -c "import yaml; [yaml.safe_load(open(f)) for f in __import__('glob').glob('.github/ISSUE_TEMPLATE/*.yml')]"
git status --short --branch
```

Result: all three templates parse OK; labels `bug` + `enhancement` confirmed present via
`gh label list`; scripts confirmed against `package.json`.
