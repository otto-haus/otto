# Standards

Standards are the **explicit operating canon** of Vinny OS: what we reward, refuse, and
do under pressure. They are the horizontal layer that guides decisions, Curation,
Practices, Routines, Charters, Channels, Skills, and Reviews.

> Source of truth for the canon lives in [`standards/`](../standards/). This doc
> explains the model, the authority stack, conflict resolution, and how Standards wire
> into the rest of the stack.

```
Status: v0 (draft canon). Changing a Standard is a legitimacy change — Sebastian ratifies.
```

## Core thesis

```txt
We build world-class culture by defining, applying, and grading world-class Standards.
```

Standards answer one question:

```txt
What do we reward, refuse, and do under pressure?
```

And one honest test:

```txt
Until a Standard has cost us something, it is still only a poster.
```

## The stack

```txt
Culture     = lived outcome (what actually happens)
Standards   = explicit canon (what we choose)
Curation    = enforcement + proposal layer (what compounds)
Practices   = executable Standards
Routines    = repeated bundles of Practices
Receipts    = proof we lived them
Precedents  = conflict-resolution canon (how Standards resolve under pressure)
```

Culture is not what we say. Culture is what happens. Standards are the deliberate
choice we grade that outcome against.

## Authority stack

```txt
Sebastian → Standards → Curation → Practices / Routines / Charters / Channels / Memory
```

Non-negotiable:

- **Sebastian ratifies Standards.** A Standard becomes canon only with his nod.
- **Standards govern Curation.** Curation classifies and gates against the canon.
- **Curation enforces Standards downstream** across every subsystem.
- **Curation may propose Standards changes**, surfaced from drift, receipts, and precedents.
- **Curation does NOT ratify Standards changes.** Proposing ≠ deciding.
- **Standards changes are never auto-applied.** Reversible-looking edits still reshape
  broad future behavior, so they are consequential by default.

This is the one place the autonomy rule inverts: even a tiny wording change to a
Standard is a one-way door on identity, so it always routes to Sebastian.

## Standard schema

Each Standard is a file under `standards/standards/<slug>.md` that opens with a fenced
`yaml` spec block, followed by prose. They are indexed by
[`standards/registry.yaml`](../standards/registry.yaml), whose `conflicts` map is the case
law. The machine-readable shape mirrors
[`templates/standard.yaml`](../templates/standard.yaml):

```yaml
name: Quality / No Fake Done
slug: quality
version: 0.1
status: active                 # draft | active | deprecated

meaning: Done means proven, not claimed. Evidence over confidence.

under_pressure:
  do:
    - map claims to acceptance criteria; show proof
    - name remaining risks
    - say "not done" when proof is missing
  refuse:
    - vague "looks good"
    - hiding uncertainty
    - shipping without checks

reward:
  - crisp evidence
  - cleanup before completion
  - honest blocker reporting

failure_modes:
  - perfectionism
  - slow ceremony
  - proxy evidence treated as real evidence

conflicts_with:                # culture lives in the conflicts — name them
  - winning                    # ship now vs prove more
  - respect-attention          # exhaustive proof vs the human's time
tie_breakers:                  # the default ruling (cite a precedent when one exists)
  - cut scope before cutting proof
  - evidence proportional to consequence

related_practices:
  - review
  - charter

related_curation_rules:
  - done requires receipts
  - no artifact, no progress

evidence:
  - AC-by-AC proof map
  - test/log/screenshot/artifact
  - receipt

ratification:
  owner: Sebastian
  standards_changes_require_human: true
```

Field meanings:

- `meaning` — one line. If it needs a paragraph, it is two Standards.
- `under_pressure.do` / `refuse` — the behavior that actually defines the Standard. Vague
  virtues are banned; this is where a Standard becomes testable.
- `reward` — what earns reputation/promotion/compounding under this Standard.
- `failure_modes` — how this Standard goes wrong, including its overcorrection.
- `conflicts_with` — the other Standards this one trades against under pressure. Culture
  lives in these conflicts; an empty list is suspicious.
- `tie_breakers` — the default ruling when the conflict fires. Cite a Precedent once a real
  case exists; an asserted tie-breaker with no precedent is provisional.
- `related_practices` — Practices that make this Standard executable.
- `related_curation_rules` — the gates Curation enforces on this Standard's behalf.
- `evidence` — what proof in a Receipt shows the Standard was upheld.
- `ratification` — always `owner: Sebastian`, `standards_changes_require_human: true`.

## v0 Standards

Six, deliberately few. Two merges keep the set tight:

```txt
quality            Quality / No Fake Done — done means proven, not claimed.
judgment           Right call under uncertainty, owned and recorded.
candor-kindness    Candor + Kindness — true, useful thing early; hard on work, soft on person.
respect-attention  Attention is a finite one-way door.
first-principles   Reason from facts, not cargo-cult or authority.
winning            Winning / Outcomes Over Motion — finish; ship proven outcomes.
```

- **Quality + No Fake Done** merge the broad bar with its sharp, enforceable edge — the
  one `/review` and Charter's Auditor bite on.
- **Candor + Kindness** merge because they only work together; their internal tension is
  the canonical conflict (see Precedents).

Adding a seventh Standard is a legitimacy change — fewer, sharper Standards beat a long
list of virtues.

## Standards conflict resolution — Precedents

Culture does not live in a list of virtues. It lives in **how Standards resolve against
each other under pressure.** Common tensions:

```txt
Candor vs Kindness
Speed vs Quality
Winning vs Integrity
Autonomy vs Safety
Persistence vs Respect for attention
```

When Standards conflict in a real decision, write a **Precedent** under
`standards/precedents/<date>-<conflict>.md` using
[`templates/standard-precedent.md`](../templates/standard-precedent.md). It records the
situation, the Standards in tension, which one won, why (first-principles), the cost, the
outcome, the future rule, and when to revisit.

Precedents are practical canon: the next time the same tension appears, Vinny follows the
precedent unless first principles or new evidence overturn it.

> A v0 Standard with no precedent is suspect. List virtues only after one has cost you a
> decision.

## How Standards interact with the stack

### Curation

Curation enforces Standards on every proposal. It asks:

- Does this memory writeback reinforce a real Standard?
- Does this Practice deserve promotion under our Standards?
- Does this recurring Routine earn attention (Respect Attention)?
- Does this approval spend reputation / money / security (Judgment)?
- Is this a Standards change? → **always requires Sebastian.** Curation may surface it;
  it never ratifies it.

Curation's `standards_change` proposal type is locked to `ratification.required: true`
(see `docs/curation.md` on the Curation lane). Curation may open the proposal; only
Sebastian ratifies it.

### Charter

Every Charter names the Standards it is accountable to:

```yaml
standards:
  - quality
  - judgment
  - no-fake-done
```

Charter's Auditor proves done AC-by-AC because of `no-fake-done`. Its gates exist because
of `judgment` and `respect-attention`.

### Practices

A Practice exists only if it reinforces a Standard.

```txt
/review exists because Quality means No Fake Done.
/decision exists because Judgment must be owned and graded.
```

If a proposed Practice maps to no Standard, do not build it.

### Routines

Routine audits ask:

```txt
Would we miss this Routine if it vanished?
Does it reinforce a Standard or create noise?
```

Standing Routines are gated by Respect Attention.

### Channels

Channels respect attention as a Standard:

```txt
No noisy dumps.
One question when blocked.
Receipt-linked.
Recommendation included.
```

### Skills

Skills execute capabilities under Standards.

```txt
The 1Password Skill operates under Security / Judgment Standards.
```

### Receipts

Every Receipt can reference Standards. Use the fragment in
[`templates/standard-receipt.md`](../templates/standard-receipt.md):

```txt
Standard upheld:
Standard missed:
Standards in tension:
Lesson:
Possible Practice/Routine/Curation update:
```

## Product surface

Standards are not a dashboard. Keep the surface small:

```txt
Standards
  Canon
  Active Standards
  Anti-patterns
  Precedents
  Recent standard-linked decisions
  Drift warnings
```

Most Standards appear **contextually**, not on a page:

- in Curation cards
- in Charter proposals
- in Review checklists
- in Practice specs
- in Routine audits
- in completion receipts

## Standards review loop

Weekly / monthly, run the review (template:
[`standards/evaluations/standards-reviews/TEMPLATE.md`](../standards/evaluations/standards-reviews/TEMPLATE.md)):

```txt
Review decisions
Review receipts
Find drift
Identify rewarded behavior
Identify refused behavior
Review Standards conflicts
Promote precedents
Prune slogans
Propose Standards updates
Sebastian ratifies any Standards change
```

Core questions:

```txt
What did we actually reward this week?
Where did a Standard cost us something?
Which Standards conflicted?
Which precedent should guide next time?
```

## Change policy

```txt
Operational (no approval):  fixing typos in prose, clarifying examples, adding a
                            precedent that records a decision already made.
Legitimacy (Sebastian):     adding/removing a Standard, changing a Standard's meaning,
                            under_pressure rules, status, or ratification block.
```

Curation routes legitimacy changes to Sebastian as a `standards_change` proposal. They
are never auto-applied.

## Non-goals

```txt
No values posters.
No vague virtues.
Curation never ratifies Standards changes.
Standards changes never auto-apply.
Horowitz is canon, not authority.
No big dashboard before Standards gate real work.
Standards are not Skills or Practices.
No virtue without a conflict-resolution precedent.
No spec-writing without running a Standard against real work.
```

## Final model

```txt
Culture is what the system repeatedly does under pressure.

Standards are the explicit canon:
what we reward, refuse, and do under pressure.

Precedents are the case law:
how we ruled in real cases.

Curation decides what compounds.

Approvals ratify consequential doors.

Practices make Standards executable.

Routines repeat Practices.

Receipts prove whether we lived them.
```
