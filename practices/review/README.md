# Practice: Review  ·  `status: draft`

**Purpose** — prevent fake done and premature completion.

Review is the anti-"done too early" Practice. It maps every completion claim to
concrete evidence, surfaces remaining risks, and gives a pass/fail recommendation.
Unmapped acceptance criteria mean **not done**. It generalizes Charter's Auditor role
into a standalone check usable on any work.

> Draft spec. Not yet implemented as an extension. See `practice.yaml`.

## Invocation

```txt
/review done    full acceptance-criteria -> evidence audit + pass/fail
/review risk    focused scan for remaining risks before a gate or handoff
```

## Trigger

- a task is about to be marked done
- a completion claim needs proof
- before a one-way door or handoff

## Inputs

- the work and the claim of done · acceptance criteria · artifacts (receipts, logs, links)

## Outputs / state

Durable under `reviews/`: acceptance criteria map (criterion → evidence), evidence
checklist, remaining risks, cleanup notes, pass/fail recommendation.

## Guardrails

- **Done requires mapped proof.** Each acceptance criterion must point to evidence.
- Any unmapped criterion => **not done**.
- Review **recommends**; the human (or Charter's acceptance gate) decides.

## Evidence standard

Pass only when every acceptance criterion is mapped to evidence, risks are listed, and
cleanup is verified.

## Improvement loop

Track `premature_done_prevented`. Recurring gaps feed better acceptance-criteria
templates upstream in Charter.

## Templates

- `templates/review.md`
