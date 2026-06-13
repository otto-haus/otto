# Knowledge

**Otto's maintained understanding of the external world.**

```txt
Memory     = what Otto remembers     (lessons from our own work)
Knowledge  = what Otto knows about the world  (current external reality)
Curation   = what gets to compound
Standards  = what we choose internally
Skills     = how Otto uses capabilities
Autonomy   = what Otto may own given current capability
```

Knowledge is **not** Memory. Memory is durable lessons from Otto's own runs. Knowledge
is a maintained, refreshable model of facts about the outside world that go stale —
starting with **how good AI models actually are right now.**

> Knowledge keeps Otto's assumptions current.
> Expectations must update with capability.
> Autonomy should track actual AI capability, not inherited human-era assumptions.

## Why this exists

AI capability changes fast. Without Knowledge, Otto gives stale advice:

| Stale (human-era) | Frontier-aware |
|---|---|
| "that's too much to spec" | model capability improved → spec bigger |
| "don't run that many agents" | parallel agents are viable → fan out |
| "humans must coordinate this" | AI throughput is higher → delegate |
| "AI can't own that end to end" | more work can be safely delegated |

Knowledge prevents stale caution from masquerading as wisdom. It supports the Standard
**Move fast on good judgment.**

## v1 scope

A thin surface, one domain: **AI Frontier / Model Intelligence.**

```txt
knowledge/
  README.md                     this file
  ai-frontier/
    model-registry.yaml         models, capability ratings, and the routing they imply
    capability-notes.md         narrative on model/provider strengths & weaknesses
    provider-costs.md           pricing + cost posture per provider
    benchmark-links.md          external sources Knowledge reads from
    observed-performance/       internal evidence: how models actually did for us
  _templates/
    observed-performance.md     one internal observation
    knowledge-update-receipt.md proof an AI Frontier Review ran
    knowledge-curation-proposal.yaml   propose a routing/policy change via Curation
```

## What Knowledge tracks

**Model / provider strengths:** reasoning · coding · writing · tool use · agentic
reliability · long-context · latency · cost · provider constraints.

**External sources** (see [`ai-frontier/benchmark-links.md`](ai-frontier/benchmark-links.md)):
Artificial Analysis · METR · SWE-bench / coding evals · provider pricing pages ·
provider ToS notes · frontier model release notes.

**Internal observations** (see [`ai-frontier/observed-performance/`](ai-frontier/observed-performance/)):
ticket outcomes · worker quality · routing wins/losses · cost surprises · latency
issues · failure patterns · decision grades.

## The two kinds of update (the core rule)

```txt
FACTS    (notes, costs, links, capability ratings, last_verified)
         → Knowledge updates autonomously via the AI Frontier Review Routine.
         → Every update writes a receipt.

POLICY   (model routing, autonomy expansion, ticket sizing, provider allowlist)
         → Knowledge may only PROPOSE. Curation ratifies. Sebastian approves.
```

If a Knowledge update would change behavior, it is a **Curation proposal**
(`type: knowledge_update`), not a silent edit. See [`../docs/knowledge.md`](../docs/knowledge.md).

## How it connects

- **Autonomy** reads `model-registry.yaml` to decide which model owns reasoning vs
  coding, how many workers to run, and what ticket size is safe. See [`../docs/autonomy.md`](../docs/autonomy.md).
- **Curation** is how any Knowledge-driven behavior change gets ratified.
- **Routine** `ai-frontier-review` keeps it current. See [`../routines/ai-frontier-review/`](../routines/ai-frontier-review/).

## Deferred (NOT in v1)

```txt
Cognee · relationship graph · automatic market intelligence · broad corpus graph
· large Knowledge dashboard
```

Cognee later becomes an *implementation under* Knowledge, not a parallel system. Do not
build a Knowledge graph in v1.

Full doctrine: [`../docs/knowledge.md`](../docs/knowledge.md).
