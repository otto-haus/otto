# Practice: Decision  ·  `status: draft`

**Purpose** — record first-principles decisions and grade their quality over time.

For anything with stakes, external advice (ChatGPT, Claude, any advisor) is **input,
not authority**. Decision forces first-principles reasoning, records what we believed
and expected, and creates a surface to grade the decision later. Improving judgment is
the most controllable, highest-leverage objective — decisions shouldn't vanish into
vibes.

> Draft spec. Not yet implemented as an extension. See `practice.yaml`.

## Invocation

```txt
/decision record <decision>
/decision grade <decision-id>
```

## Trigger

- high-stakes decision · architecture choice · tool/vendor choice
- any meaningful, hard-to-reverse decision

## Inputs

- the decision · context · options considered

## Outputs / state

Durable under `decisions/`: `decision.md` / `decision.yaml` with assumptions, options,
first-principles rationale, risks, expected outcome, revisit date, and (later) a grade.

## Guardrails

- External advice is input, not authority.
- First-principles reasoning is mandatory.
- The Practice never auto-approves an irreversible action — it records reasoning.

## Evidence standard

Complete record = rationale + assumptions + options + expected outcome + revisit date.
Graded record adds actual outcome and a quality score.

## Improvement loop

At the revisit date, run `/decision grade`: compare expected vs actual, score quality,
capture the lesson. Track `decision_quality_score` trend over time.

## Templates

- `templates/decision-record.md`
