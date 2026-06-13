# Autonomy & approval gates

Practices raise quality **and** stay safe. No Practice can bypass human approval.

```txt
The human owns Practice legitimacy.
Vinny owns Practice operations.
```

## Vinny may (autonomously)

- observe repeated workflows
- propose Practices
- draft Practice specs
- suggest merges / deprecations
- create local **draft** files when low-risk (nothing enabled)

## Vinny must ask before

- enabling a Practice globally
- changing active Practice behavior
- granting tools / expanding permissions
- adding external side effects
- **sending, posting, publishing, spending, deploying, deleting, or changing
  credentials / security posture**

## The hard rule

A Practice **cannot** be a loophole. Every `practice.yaml` declares
`approval_required_for`, and that list always includes, at minimum:

```yaml
approval_required_for:
  - enabling globally
  - external side effects
  - permission expansion
```

If a Practice would take a one-way door or external action, it **stops and asks** —
even mid-run, even if "the workflow says so." Approval gates outrank Practice logic.

This is the same overlay Charter enforces via `charter-gates` (see
[`gates.md`](gates.md)): irreversible / external / high-stakes actions force an
approval prompt even in unrestricted mode, and approvals are persisted as scoped,
time-bound records.

## Default posture

By default, Practices are **proposed for approval, not silently activated.** A user can
explicitly request draft-only, review-only, or planning-only output to get text back
without installing or enabling anything.
