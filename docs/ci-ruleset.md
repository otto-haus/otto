# CI Ruleset Runbook

This repo keeps CI behavior in code and repository merge policy in GitHub settings.
Agents may propose settings here, but only Sebastian changes repository settings.

## Required Checks

Require this status check on `main`:

```txt
CI / checks
```

That check runs `.github/workflows/ci.yml`, which installs with
`bun install --frozen-lockfile`, verifies `bun.lock` was not rewritten, and then
runs `scripts/ci-local-gate.sh`.

Do not rename the workflow or job casually. Other loops treat `CI / checks` as
the stable contract between local proof and GitHub proof.

## Recommended Branch Rules

Enable these protections for `main`:

- Require pull requests before merge.
- Require status checks to pass before merge, with `CI / checks` selected.
- Require branches to be up to date before merge when the queue is busy enough
  that stale green checks are common.
- Block force pushes.
- Block deletions.

Keep write permissions narrow. The workflow itself should keep least privilege:

```yaml
permissions:
  contents: read
```

## Code Scanning

Enable `Require code scanning results` only after a code scanning workflow has
merged and produced successful results on `main` and on at least one pull
request. Until then, the rule can block merges without adding proof.

When enabled, require results for the scanning tool that is actually producing
alerts/results for this repo. Do not require a tool name before it exists in
GitHub's code scanning UI for the repository.

## Code Quality

Do not enable `Require code quality results` until GitHub is already receiving
code quality analysis for pull requests and the team has chosen the severity
thresholds that should block merges.

If no tool is producing code quality results, leave this off and rely on
`CI / checks`, review, and any explicit lint/type/test gates in code.

## Human Boundary

Do not change these settings with `gh repo edit`, mutating `gh api`, or a
browser automation session from an agent. Propose changes in a PR body or issue
and let Sebastian apply them.
