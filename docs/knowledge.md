# Knowledge

**Knowledge is Otto's maintained understanding of the external world.** v1 is one
domain: **AI Frontier / Model Intelligence.**

```txt
Knowledge keeps Otto's assumptions current.
Expectations must update with capability.
Autonomy should track actual AI capability, not inherited human-era assumptions.
```

## Knowledge vs Memory (the separation)

This is the load-bearing distinction. Knowledge is **not** Memory.

```txt
Memory     = what Otto remembers       — durable lessons from our own runs (Letta/MemFS)
Knowledge  = what Otto knows about the world — a refreshable model of external reality
Curation   = what gets to compound
Standards  = what we choose internally
Skills     = how Otto uses capabilities
Autonomy   = what Otto may own given current capability
```

- Memory is backward-looking and earned (lessons we lived). It is governed by Curation
  as memory writebacks.
- Knowledge is outward-looking and **expires** (the frontier moves). It is maintained
  by a Routine and must be re-verified on a cadence.
- Memory says "here's what we learned." Knowledge says "here's what's true out there
  right now." They are different products and live in different places: Memory in
  Letta; Knowledge in files under [`knowledge/`](../knowledge/).

## Why Knowledge exists

AI capability changes fast. Without a maintained capability model, Otto defaults to
stale, human-era caution:

| Stale advice | What the frontier may actually say |
|---|---|
| "that's too much to spec" | model capability improved → spec bigger |
| "don't run that many agents" | parallel agents are viable → fan out |
| "humans must coordinate this" | AI throughput is higher → delegate |
| "AI can't own that end to end" | more work can be safely delegated |

Knowledge prevents stale caution from masquerading as wisdom. It is what makes the
Standard **Move fast on good judgment** safe: judgment is only good if its inputs are
current.

## v1 scope

A thin surface. One domain. No graph.

```txt
knowledge/
  README.md
  ai-frontier/
    model-registry.yaml          models + capability ratings + the routing they imply
    capability-notes.md          narrative on strengths/weaknesses + trend watch
    provider-costs.md            pricing + cost posture
    benchmark-links.md           external sources
    observed-performance/        internal evidence about real model behavior
  _templates/                    observation / receipt / curation-proposal
routines/
  ai-frontier-review/            the Routine that keeps it current
```

### Tracked dimensions

reasoning · coding · writing · tool use · agentic reliability · long-context handling ·
latency · cost · provider constraints.

### External sources

Artificial Analysis · METR · SWE-bench / coding evals · provider pricing pages ·
provider ToS notes · frontier model release notes. See
[`../knowledge/ai-frontier/benchmark-links.md`](../knowledge/ai-frontier/benchmark-links.md).

### Internal observations

ticket outcomes · worker quality · routing wins/losses · cost surprises · latency
issues · failure patterns · decision grades. See
[`../knowledge/ai-frontier/observed-performance/`](../knowledge/ai-frontier/observed-performance/).
**Our own evidence wins ties** against external claims.

## The core rule: facts vs policy

```txt
FACTS    capability ratings, notes, costs, source links, last_verified
         → Knowledge updates AUTONOMOUSLY (via the AI Frontier Review Routine).
         → Every update writes a receipt.

POLICY   model routing, autonomy expansion, ticket sizing, provider allowlist
         → Knowledge may only PROPOSE. → Curation classifies. → Sebastian ratifies.
```

If a Knowledge update would change behavior, it is **not** a silent edit — it is a
Curation proposal.

## Relationship to Curation

Knowledge can update facts and notes on its own. When a Knowledge update changes
**behavior policy**, it goes through Curation as a proposal of `type: knowledge_update`
(see [`../knowledge/_templates/knowledge-curation-proposal.yaml`](../knowledge/_templates/knowledge-curation-proposal.yaml)).

Changes that **require Curation** (examples from the ticket):

- change the default `main_otto` model
- change a worker model
- expand Autonomy because models improved
- alter ticket-sizing assumptions
- change the provider allowlist

These map onto Curation's `always_ratify_types` and `ratification_required_when`
(permission expansion, authority change, ambiguous consequence). Routing in
`model-registry.yaml` therefore ships as `status: proposed` until a Curation approval
exists.

## Relationship to Autonomy

Autonomy **depends on** Knowledge. Autonomy reads
[`../knowledge/ai-frontier/model-registry.yaml`](../knowledge/ai-frontier/model-registry.yaml)
to decide:

- how many workers to run
- which model owns reasoning
- which model owns coding
- when Otto can merge / retry / rebase without asking
- what ticket size is safe

This realizes the Autonomy doctrine's **model-routing thesis** (Main Otto = strongest
reasoning; workers = strongest coding/writing) with a *maintained, dated* source instead
of a hardcoded assumption. See [`autonomy.md`](autonomy.md).

## Relationship to Standards

Knowledge supports **Move fast on good judgment** by keeping judgment's inputs current,
and it is held to **Quality / No Fake Done** (sourced claims, `verified` flags,
receipts) and **First-Principles Reasoning** (reason from current facts, not inherited
assumptions).

## Deferred (NOT in v1)

```txt
Cognee · relationship graph · automatic market intelligence · broad corpus graph ·
large Knowledge dashboard
```

Do not build a Knowledge graph in v1. **Cognee later becomes an implementation under
Knowledge** — a backend for Knowledge, not a parallel system. (Consistent with the
stack doctrine: Cognee is deferred until a real query forces it.)

## Desktop surface (v1, small)

The workspace shows a small Knowledge view (see [`desktop.md`](desktop.md)):

```txt
Knowledge
  AI Frontier
  Current model routing          ← from model-registry.yaml `routing`
  Capability assumptions         ← capability-notes.md
  Recent updates                 ← knowledge update receipts
  Observed performance           ← observed-performance/
  Curation proposals from Knowledge changes
```

No giant dashboard.

## Acceptance (v1)

1. Knowledge defined separately from Memory — this doc + `knowledge/README.md`.
2. AI Frontier is the v1 sub-surface — `knowledge/ai-frontier/`.
3. `model-registry.yaml` exists.
4. External source list exists — `benchmark-links.md`.
5. Observed-performance folder exists.
6. AI Frontier Review Routine specified — `routines/ai-frontier-review/`.
7. Knowledge updates can propose Curation changes — `type: knowledge_update` + template.
8. Autonomy / model routing reads from Knowledge — `routing` block + this doc + autonomy.md.
9. Cognee / graph explicitly deferred — above.
10. Desktop can show current model routing + assumptions — desktop.md Knowledge view.

## Final principle

```txt
Knowledge keeps Otto's assumptions current.
Autonomy should track actual AI capability, not inherited human-era assumptions.
```
