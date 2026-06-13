# External sources — AI Frontier

The external inputs Knowledge reads from to keep capability assumptions current. The
AI Frontier Review Routine checks these, compares them to our observed performance, and
proposes updates.

> Last reviewed: 2026-06-13 · Next review due: 2026-06-20

## Capability & benchmarks

- **Artificial Analysis** — cross-model capability, speed, and price comparisons.
  https://artificialanalysis.ai/
- **METR** — frontier autonomy / task-length capability evals (how long a task models
  can complete unaided; directly informs ticket sizing + autonomy).
  https://metr.org/
- **SWE-bench** — coding agent benchmark (real GitHub issue resolution).
  https://www.swebench.com/
- **Coding evals (general)** — LiveCodeBench, Aider leaderboard, and similar.

## Pricing

- **OpenAI pricing** — https://openai.com/api/pricing/
- **Anthropic pricing** — https://www.anthropic.com/pricing
- Provider pricing pages are the source of truth for `provider-costs.md`.

## Provider constraints (ToS / data handling)

- **OpenAI usage policies / ToS** — https://openai.com/policies/
- **Anthropic usage policies / ToS** — https://www.anthropic.com/legal/aup
- Track anything affecting what Otto may send, retention, or training-on-data. A
  constraint change that alters the allowlist is **Curation-gated**.

## Release notes (frontier capability changes)

- **OpenAI** — https://help.openai.com/en/articles/6825453-chatgpt-release-notes / model pages
- **Anthropic** — https://docs.anthropic.com/en/release-notes
- Watch for new model tiers that change the strongest-reasoning / strongest-coding pick.

## How sources feed the system

```txt
external source  →  capability-notes / provider-costs / model-registry (FACTS, auto + receipt)
                 →  if it changes routing/autonomy → Curation proposal (POLICY, gated)
                 →  observed-performance/ checks whether external claims match our reality
```

External claims are not trusted blindly: the Routine compares them to
[`observed-performance/`](observed-performance/). Our own evidence wins ties.
