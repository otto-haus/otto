# Standards

**The explicit operating canon of Otto.** What we reward, refuse, and do under
pressure.

```txt
Culture     = lived outcome (what happens under pressure)
Standards   = explicit canon (what we choose)
Precedents  = case law (how we ruled in real cases)
Curation    = decides what compounds
Approvals   = ratify consequential doors
Practices   = make Standards executable
Routines    = repeat Practices
Receipts    = prove whether we lived them
```

Standards are **not** a culture dashboard, a values poster, or a list of virtues. They
are testable rules with `do` / `refuse` behavior under pressure, wired into real gates.

> Standards without precedents become values posters.
> Until a Standard has cost us something, it is still only a poster.

Full model, schema, and stack integration: [`../docs/standards.md`](../docs/standards.md).

## Authority stack

```txt
Sebastian → Standards → Curation → Practices / Routines / Charters / Channels / Memory
```

- Sebastian ratifies Standards.
- Standards govern Curation.
- Curation enforces Standards downstream and may **propose** changes.
- Curation never **ratifies** Standards changes.
- Standards changes never auto-apply.

## Layout

```txt
standards/
  README.md              this file
  registry.yaml          index of active Standards + the conflict map (case law)
  canon/
    horowitz.md          starting canon (input, not authority)
  standards/             the v0 Standards (one file each)
    quality.md           Quality / No Fake Done
    judgment.md
    candor-kindness.md
    respect-attention.md
    first-principles.md
    winning.md
    earned-semver.md     Earned Semver — version numbers prove trust, not momentum
  anti-patterns/         named failure shapes Standards refuse
    fake-progress.md
    ceremony-without-signal.md
    harsh-candor.md
    vague-approval.md
  precedents/            conflict-resolution canon (Standard vs Standard)
    2026-06-13-candor-vs-kindness.md
  evaluations/
    decision-grades/     graded decisions + Standards-biting receipts
    standards-reviews/   weekly/monthly review-loop output
```

## v0 Standards

| Standard | Meaning |
|----------|---------|
| [Quality / No Fake Done](standards/quality.md) | Done means proven, not claimed. Evidence over confidence. |
| [Judgment](standards/judgment.md) | Right call under uncertainty, owned and recorded. |
| [Candor + Kindness](standards/candor-kindness.md) | True, useful thing early — hard on work, soft on the person. |
| [Respect Attention](standards/respect-attention.md) | Attention is a finite one-way door. |
| [First-Principles Reasoning](standards/first-principles.md) | Reason from facts, not cargo-cult or authority. |
| [Winning / Outcomes Over Motion](standards/winning.md) | Finish. Ship proven outcomes, not motion. |
| [Earned Semver](standards/earned-semver.md) | Public version numbers are earned by proof — not branch names or optimism. |

Two deliberate merges: **Quality + No Fake Done** (broad bar + its enforceable edge) and
**Candor + Kindness** (they only work together). The registry's `conflicts` map is the
index of where Standards trade against each other.

## How to change a Standard

1. Find drift / cost in a Receipt, decision grade, or Precedent.
2. Curation opens a `standards_change` proposal (it cannot approve it).
3. Sebastian ratifies — or doesn't.
4. On approval, edit the Standard, bump `version`, update `registry.yaml`, link the proof.

## Schema

Each Standard opens with a fenced `yaml` spec (see
[`../templates/standard.yaml`](../templates/standard.yaml)) followed by prose. Required
blocks: `meaning`, `under_pressure.{do,refuse}`, `reward`, `failure_modes`,
`conflicts_with`, `tie_breakers`, `related_practices`, `related_curation_rules`,
`evidence`, `ratification`.
