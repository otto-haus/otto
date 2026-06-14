# 044 — Knowledge Surface: Cognee Graph (Thin)

Owner: Claude
Priority: P2
Depends on: 042, 043
Release bucket: vNext knowledge

## Outcome

The Otto Desktop **Knowledge** pane shows an honest, thin **Cognee-backed** section — not a generic dashboard, not fake graph stats — so Sebastian can see:

```txt
Is Cognee home running?
What was captured last?
Can I run a recall smoke query and see citations?
```

When Cognee is disabled or down, the pane shows the same empty/error honesty as other file-backed surfaces.

## Why this matters

The Knowledge one-pager deferred "large Knowledge dashboard" but promised a small view: routing, assumptions, updates, observed performance. This ticket adds the **graph recall slice** once 041–043 prove the backend — closing the loop from Cognee marketing's "Capture → Model → Recall" inside Otto workspace.

v3 People Context Packs (024) may reuse this surface later; keep v1 thin.

## Source anchors

- Knowledge UI: `apps/desktop/src/surfaces/Panes.tsx` (KnowledgePane / Behavior section)
- Knowledge file data: `KnowledgeStore`, `knowledge/ai-frontier/*`
- Cognee health: 041 IPC
- Last capture: 043 receipts
- Recall smoke: 042
- Design: no mock operational data (`AGENTS.md`)

## Architecture target

### Knowledge pane layout (add section)

Existing (file-backed):

```txt
AI Frontier routing
Capability notes
Observed performance
Recent knowledge update receipts
```

New section **Graph recall (Cognee)** — only when `OTTO_COGNEE_ENABLED=1`:

```txt
Status pill     disabled | stopped | ready | error
Base URL        loopback only (read-only display)
Last capture    link/summary from latest CogneeCaptureReceipt
Entity/doc counts   if API exposes; else "unknown" — no fake numbers
Recall smoke    dev-only query box OR "Run smoke" button → shows citations list
```

When disabled:

```txt
Cognee graph recall is off.
Enable in Settings to index Otto canon locally.
[link to docs/cognee.md]
```

### Data sources

- `otto:cognee:health`
- read latest file in `receipts/cognee/capture/` (main process helper)
- optional `otto:cognee:recall-smoke` IPC for fixed test query in staging

No direct renderer HTTP to Cognee.

### Receipt

UI smoke receipt: screenshot + JSON noting status states (disabled, error, ready).

## Scope

- Knowledge pane section + Settings cross-link
- IPC helpers for last capture summary + optional recall smoke
- Empty/error/ready states (match Chat honesty standard)
- Staging visual proof
- Update `docs/v1/SHIP_CHECKS/knowledge.md` or `SHIP_CHECKS/cognee.md` with surface evidence

## Out of scope

- Full graph visualization / force-directed UI
- Entity editing in UI
- CRM-style people browser (024)
- Cognee Cloud dashboard embed
- Marketing website / one-pager updates

## Done when

- Knowledge pane renders AI Frontier file data unchanged when Cognee off.
- With Cognee off: graph section shows honest disabled empty state — no mock entity counts.
- With Cognee ready + capture receipt present: last capture time, kinds, doc count visible.
- Recall smoke shows ≥1 citation with repo path when 043 has run.
- Staging screenshot in execution receipt.
- No fake "connected" when health is error.
- Claude craft pass: typography/spacing matches adjacent Behavior panes.

## Verification

```sh
cd /Users/seb/Code/otto
bun run --cwd apps/desktop typecheck
apps/desktop/scripts/deploy-staging.sh
# Manual: staging Knowledge pane — disabled, error (bad URL), ready states
```

## Blocker log

Leave blank unless blocked.
