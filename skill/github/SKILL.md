---
name: github
description: GitHub PR and issue workflows via gh CLI — read-only by default; merge requires approval.
---

# GitHub skill (stub)

## Triggers

- pull request, PR review, gh cli, merge, issue triage

## Constraints

- **Green:** list PRs, read diffs, comment drafts locally
- **Yellow:** create branch, push feature branch, open PR
- **Red:** merge to main, force-push, delete repo — explicit approval required

## Approval

Merge and protected-branch writes are one-way doors. Run `autonomy.evaluateAction` before executing.

## Autonomy

- `github.read`: green
- `github.push_branch`: yellow
- `github.merge`: red
