# Capability notes — AI Frontier

Narrative companion to [`model-registry.yaml`](model-registry.yaml). The registry holds
machine-readable ratings; this file holds the *why*, the nuance, and the trend.

> Last reviewed: 2026-06-13 · Next review due: 2026-06-20 (AI Frontier Review Routine)

These notes are **facts/observations** — Knowledge may update them autonomously and
write a receipt. Anything that changes routing or autonomy is a Curation proposal.

## Dimensions tracked

reasoning · coding · writing · tool use · agentic reliability · long-context handling ·
latency · cost · provider constraints.

## Current read (grounded in Sebastian's observed stack)

> Honesty note (Quality / No Fake Done): the below is grounded in Sebastian's lived
> stack (ai_stack), not fresh benchmarks. The Routine replaces this with sourced claims.

- **Reasoning / orchestration / judgment** — strongest in the OpenAI extra-high
  reasoning tier (Codex 5.5 extra high is Sebastian's logical-reasoning + code
  powerhouse). Best current home for `main_otto`, `standards_review`,
  `curation_decisions`, `autonomy_policy`.
- **Coding** — both the OpenAI extra-high tier (review + generation) and Anthropic
  Opus-class (implementation) are leading. Sebastian routes code review to Codex 5.5
  extra high; implementation tickets split between providers.
- **Writing / deliverables** — Anthropic (Claude Cowork) leads for PDFs, decks,
  reports, memos. Good default for `docs_worker`.
- **Tool use / agentic reliability** — strong across the frontier tier; this is the
  dimension most likely to have improved since these notes were written → re-check
  before assuming a human must coordinate multi-step work.
- **Long-context** — strong; large tickets and big specs are more viable than
  human-era intuition assumes.
- **Latency** — extra-high reasoning trades latency. Sebastian's posture: prefer
  batch/async/cheapest path unless latency matters.

## Trend watch (what to re-verify each review)

- Has agentic reliability improved enough to **raise ticket size** or **add parallel
  workers**? → if yes, that is a Curation proposal (autonomy expansion).
- Has a cheaper model reached "good enough" for `docs_worker` / `ticket_worker`? →
  cost-saving routing proposal.
- Any provider ToS / data-handling change affecting what Otto may send? → constraint
  update; if it changes allowlist, that is Curation-gated.

## Capability → assumption map

When capability moves, these inherited assumptions must move with it:

| If capability... | Then re-examine... |
|---|---|
| agentic reliability up | "humans must coordinate this" |
| throughput / parallelism up | "don't run that many agents" |
| long-context + coding up | "that's too much to spec" |
| end-to-end reliability up | "AI can't own that end to end" |

Each "re-examine" that changes behavior → Curation proposal, not a silent edit.


<!-- ai-frontier-review 2026-06-14 -->
_Last manual review run: 2026-06-14. Paste external benchmark notes here; routing changes go to Curation._


<!-- ai-frontier-review 2026-06-14 -->
_Last manual review run: 2026-06-14. Paste external benchmark notes here; routing changes go to Curation._


<!-- ai-frontier-review 2026-06-14 -->
_Last manual review run: 2026-06-14. Paste external benchmark notes here; routing changes go to Curation._


<!-- ai-frontier-review 2026-06-14 -->
_Last manual review run: 2026-06-14. Paste external benchmark notes here; routing changes go to Curation._


<!-- ai-frontier-review 2026-06-14 -->
_Last manual review run: 2026-06-14. Paste external benchmark notes here; routing changes go to Curation._


<!-- ai-frontier-review 2026-06-14 -->
_Last manual review run: 2026-06-14. Paste external benchmark notes here; routing changes go to Curation._


<!-- ai-frontier-review 2026-06-14 -->
_Last manual review run: 2026-06-14. Paste external benchmark notes here; routing changes go to Curation._


<!-- ai-frontier-review 2026-06-14 -->
_Last manual review run: 2026-06-14. Paste external benchmark notes here; routing changes go to Curation._


<!-- ai-frontier-review 2026-06-14 -->
_Last manual review run: 2026-06-14. Paste external benchmark notes here; routing changes go to Curation._


<!-- ai-frontier-review 2026-06-14 -->
_Last manual review run: 2026-06-14. Paste external benchmark notes here; routing changes go to Curation._


<!-- ai-frontier-review 2026-06-14 -->
_Last manual review run: 2026-06-14. Paste external benchmark notes here; routing changes go to Curation._


<!-- ai-frontier-review 2026-06-14 -->
_Last manual review run: 2026-06-14. Paste external benchmark notes here; routing changes go to Curation._


<!-- ai-frontier-review 2026-06-14 -->
_Last manual review run: 2026-06-14. Paste external benchmark notes here; routing changes go to Curation._


<!-- ai-frontier-review 2026-06-14 -->
_Last manual review run: 2026-06-14. Paste external benchmark notes here; routing changes go to Curation._


<!-- ai-frontier-review 2026-06-14 -->
_Last manual review run: 2026-06-14. Paste external benchmark notes here; routing changes go to Curation._


<!-- ai-frontier-review 2026-06-14 -->
_Last manual review run: 2026-06-14. Paste external benchmark notes here; routing changes go to Curation._


<!-- ai-frontier-review 2026-06-14 -->
_Last manual review run: 2026-06-14. Paste external benchmark notes here; routing changes go to Curation._


<!-- ai-frontier-review 2026-06-14 -->
_Last manual review run: 2026-06-14. Paste external benchmark notes here; routing changes go to Curation._


<!-- ai-frontier-review 2026-06-14 -->
_Last manual review run: 2026-06-14. Paste external benchmark notes here; routing changes go to Curation._


<!-- ai-frontier-review 2026-06-14 -->
_Last manual review run: 2026-06-14. Paste external benchmark notes here; routing changes go to Curation._


<!-- ai-frontier-review 2026-06-14 -->
_Last manual review run: 2026-06-14. Paste external benchmark notes here; routing changes go to Curation._


<!-- ai-frontier-review 2026-06-14 -->
_Last manual review run: 2026-06-14. Paste external benchmark notes here; routing changes go to Curation._


<!-- ai-frontier-review 2026-06-14 -->
_Last manual review run: 2026-06-14. Paste external benchmark notes here; routing changes go to Curation._


<!-- ai-frontier-review 2026-06-14 -->
_Last manual review run: 2026-06-14. Paste external benchmark notes here; routing changes go to Curation._


<!-- ai-frontier-review 2026-06-14 -->
_Last manual review run: 2026-06-14. Paste external benchmark notes here; routing changes go to Curation._


<!-- ai-frontier-review 2026-06-14 -->
_Last manual review run: 2026-06-14. Paste external benchmark notes here; routing changes go to Curation._


<!-- ai-frontier-review 2026-06-14 -->
_Last manual review run: 2026-06-14. Paste external benchmark notes here; routing changes go to Curation._


<!-- ai-frontier-review 2026-06-14 -->
_Last manual review run: 2026-06-14. Paste external benchmark notes here; routing changes go to Curation._


<!-- ai-frontier-review 2026-06-14 -->
_Last manual review run: 2026-06-14. Paste external benchmark notes here; routing changes go to Curation._


<!-- ai-frontier-review 2026-06-14 -->
_Last manual review run: 2026-06-14. Paste external benchmark notes here; routing changes go to Curation._


<!-- ai-frontier-review 2026-06-14 -->
_Last manual review run: 2026-06-14. Paste external benchmark notes here; routing changes go to Curation._


<!-- ai-frontier-review 2026-06-14 -->
_Last manual review run: 2026-06-14. Paste external benchmark notes here; routing changes go to Curation._


<!-- ai-frontier-review 2026-06-14 -->
_Last manual review run: 2026-06-14. Paste external benchmark notes here; routing changes go to Curation._


<!-- ai-frontier-review 2026-06-14 -->
_Last manual review run: 2026-06-14. Paste external benchmark notes here; routing changes go to Curation._


<!-- ai-frontier-review 2026-06-14 -->
_Last manual review run: 2026-06-14. Paste external benchmark notes here; routing changes go to Curation._


<!-- ai-frontier-review 2026-06-14 -->
_Last manual review run: 2026-06-14. Paste external benchmark notes here; routing changes go to Curation._


<!-- ai-frontier-review 2026-06-14 -->
_Last manual review run: 2026-06-14. Paste external benchmark notes here; routing changes go to Curation._


<!-- ai-frontier-review 2026-06-14 -->
_Last manual review run: 2026-06-14. Paste external benchmark notes here; routing changes go to Curation._


<!-- ai-frontier-review 2026-06-14 -->
_Last manual review run: 2026-06-14. Paste external benchmark notes here; routing changes go to Curation._


<!-- ai-frontier-review 2026-06-14 -->
_Last manual review run: 2026-06-14. Paste external benchmark notes here; routing changes go to Curation._


<!-- ai-frontier-review 2026-06-14 -->
_Last manual review run: 2026-06-14. Paste external benchmark notes here; routing changes go to Curation._


<!-- ai-frontier-review 2026-06-14 -->
_Last manual review run: 2026-06-14. Paste external benchmark notes here; routing changes go to Curation._


<!-- ai-frontier-review 2026-06-14 -->
_Last manual review run: 2026-06-14. Paste external benchmark notes here; routing changes go to Curation._


<!-- ai-frontier-review 2026-06-14 -->
_Last manual review run: 2026-06-14. Paste external benchmark notes here; routing changes go to Curation._


<!-- ai-frontier-review 2026-06-14 -->
_Last manual review run: 2026-06-14. Paste external benchmark notes here; routing changes go to Curation._


<!-- ai-frontier-review 2026-06-14 -->
_Last manual review run: 2026-06-14. Paste external benchmark notes here; routing changes go to Curation._


<!-- ai-frontier-review 2026-06-14 -->
_Last manual review run: 2026-06-14. Paste external benchmark notes here; routing changes go to Curation._


<!-- ai-frontier-review 2026-06-14 -->
_Last manual review run: 2026-06-14. Paste external benchmark notes here; routing changes go to Curation._


<!-- ai-frontier-review 2026-06-14 -->
_Last manual review run: 2026-06-14. Paste external benchmark notes here; routing changes go to Curation._


<!-- ai-frontier-review 2026-06-14 -->
_Last manual review run: 2026-06-14. Paste external benchmark notes here; routing changes go to Curation._


<!-- ai-frontier-review 2026-06-14 -->
_Last manual review run: 2026-06-14. Paste external benchmark notes here; routing changes go to Curation._


<!-- ai-frontier-review 2026-06-14 -->
_Last manual review run: 2026-06-14. Paste external benchmark notes here; routing changes go to Curation._


<!-- ai-frontier-review 2026-06-14 -->
_Last manual review run: 2026-06-14. Paste external benchmark notes here; routing changes go to Curation._


<!-- ai-frontier-review 2026-06-14 -->
_Last manual review run: 2026-06-14. Paste external benchmark notes here; routing changes go to Curation._


<!-- ai-frontier-review 2026-06-14 -->
_Last manual review run: 2026-06-14. Paste external benchmark notes here; routing changes go to Curation._


<!-- ai-frontier-review 2026-06-14 -->
_Last manual review run: 2026-06-14. Paste external benchmark notes here; routing changes go to Curation._


<!-- ai-frontier-review 2026-06-14 -->
_Last manual review run: 2026-06-14. Paste external benchmark notes here; routing changes go to Curation._


<!-- ai-frontier-review 2026-06-14 -->
_Last manual review run: 2026-06-14. Paste external benchmark notes here; routing changes go to Curation._


<!-- ai-frontier-review 2026-06-14 -->
_Last manual review run: 2026-06-14. Paste external benchmark notes here; routing changes go to Curation._


<!-- ai-frontier-review 2026-06-14 -->
_Last manual review run: 2026-06-14. Paste external benchmark notes here; routing changes go to Curation._


<!-- ai-frontier-review 2026-06-14 -->
_Last manual review run: 2026-06-14. Paste external benchmark notes here; routing changes go to Curation._


<!-- ai-frontier-review 2026-06-14 -->
_Last manual review run: 2026-06-14. Paste external benchmark notes here; routing changes go to Curation._


<!-- ai-frontier-review 2026-06-14 -->
_Last manual review run: 2026-06-14. Paste external benchmark notes here; routing changes go to Curation._


<!-- ai-frontier-review 2026-06-14 -->
_Last manual review run: 2026-06-14. Paste external benchmark notes here; routing changes go to Curation._


<!-- ai-frontier-review 2026-06-14 -->
_Last manual review run: 2026-06-14. Paste external benchmark notes here; routing changes go to Curation._


<!-- ai-frontier-review 2026-06-14 -->
_Last manual review run: 2026-06-14. Paste external benchmark notes here; routing changes go to Curation._


<!-- ai-frontier-review 2026-06-14 -->
_Last manual review run: 2026-06-14. Paste external benchmark notes here; routing changes go to Curation._


<!-- ai-frontier-review 2026-06-14 -->
_Last manual review run: 2026-06-14. Paste external benchmark notes here; routing changes go to Curation._


<!-- ai-frontier-review 2026-06-14 -->
_Last manual review run: 2026-06-14. Paste external benchmark notes here; routing changes go to Curation._


<!-- ai-frontier-review 2026-06-14 -->
_Last manual review run: 2026-06-14. Paste external benchmark notes here; routing changes go to Curation._


<!-- ai-frontier-review 2026-06-14 -->
_Last manual review run: 2026-06-14. Paste external benchmark notes here; routing changes go to Curation._


<!-- ai-frontier-review 2026-06-14 -->
_Last manual review run: 2026-06-14. Paste external benchmark notes here; routing changes go to Curation._


<!-- ai-frontier-review 2026-06-14 -->
_Last manual review run: 2026-06-14. Paste external benchmark notes here; routing changes go to Curation._


<!-- ai-frontier-review 2026-06-14 -->
_Last manual review run: 2026-06-14. Paste external benchmark notes here; routing changes go to Curation._


<!-- ai-frontier-review 2026-06-14 -->
_Last manual review run: 2026-06-14. Paste external benchmark notes here; routing changes go to Curation._


<!-- ai-frontier-review 2026-06-14 -->
_Last manual review run: 2026-06-14. Paste external benchmark notes here; routing changes go to Curation._


<!-- ai-frontier-review 2026-06-14 -->
_Last manual review run: 2026-06-14. Paste external benchmark notes here; routing changes go to Curation._


<!-- ai-frontier-review 2026-06-14 -->
_Last manual review run: 2026-06-14. Paste external benchmark notes here; routing changes go to Curation._


<!-- ai-frontier-review 2026-06-14 -->
_Last manual review run: 2026-06-14. Paste external benchmark notes here; routing changes go to Curation._


<!-- ai-frontier-review 2026-06-14 -->
_Last manual review run: 2026-06-14. Paste external benchmark notes here; routing changes go to Curation._


<!-- ai-frontier-review 2026-06-14 -->
_Last manual review run: 2026-06-14. Paste external benchmark notes here; routing changes go to Curation._


<!-- ai-frontier-review 2026-06-14 -->
_Last manual review run: 2026-06-14. Paste external benchmark notes here; routing changes go to Curation._


<!-- ai-frontier-review 2026-06-14 -->
_Last manual review run: 2026-06-14. Paste external benchmark notes here; routing changes go to Curation._


<!-- ai-frontier-review 2026-06-14 -->
_Last manual review run: 2026-06-14. Paste external benchmark notes here; routing changes go to Curation._
