# otto v0.1.3

Integration release from `ship/functional-labs` @ `fdacc60`.

## Highlights

- **Ship-tier matrix (033–067):** bug fixes, chat craft, system nav icons, remotion demo asset, staging proof receipts
- **Labs gating:** per-surface Coming soon + Settings toggles without fake operational data
- **Chat hardening:** thread-aware queue, permission modal path, correction → curation loop
- **Culture CI:** check compiler, proposal idempotency, readiness generator opt-in
- **Runtime:** transport `auto` default with honest SDK fallback; WS remains env-selectable (039)

## Verify

```sh
bun run verify:v0          # 208 pass
bash scripts/release-gate.sh
```

Staging proof target: `/Applications/otto-staging.app` (window title **otto staging**). Live app not replaced.

## Assets

- **Demo:** `otto-v01-desktop.mp4` — desktop walkthrough (re-enactment; see `demo/README.md`)

## Honest gaps (not hidden)

- Cognee/pgvector recall requires local daemons
- Marketing apex `otto.haus` — local preview only
- Some HQ tickets flagged for staging re-proof — see `planning/hq-tickets/000-audit-status.md`

Nothing is **Shipped** in product terms until you accept the staging demo. This tag marks the integration line on **otto-haus/otto** only.
