# Receipt — Knowledge (Otto v0.1) — PROPOSED

- **What changed:** Knowledge surface ships file-backed AI Frontier canon (`knowledge/ai-frontier/*`), `KnowledgeStore`, desktop Knowledge pane, and Autonomy/ticket routing read path via `resolveModelForRole`. Registry and routing remain **proposed**.
- **Demo:** `demo/out/otto-v01-knowledge.mp4`
- **Test command/output:**
  ```sh
  bun test ./apps/desktop/electron/knowledge-store.test.ts
  # 3 pass — registry load, ticket_worker routing, malformed registry fallback
  ```
- **Staging smoke (2026-06-14):** `docs/receipts/staging/staging-hygiene-proof-20260614143512.json` — `tickets.055.ok: true`, `registryStatus: proposed`
- **Manual verification (staging):** Open Knowledge pane → registry status pill `proposed` → routing assignments table → Autonomy evaluation shows `knowledge_routing` when classified.
- **Known limitations:** Routing unratified; AI Frontier Review Routine executor not wired (062); Cognee deferred (040–044). Claims must say Proposed until Curation ratifies routing.
- **Approval status:** ☐ pending Sebastian (and ratification decision on routing).
