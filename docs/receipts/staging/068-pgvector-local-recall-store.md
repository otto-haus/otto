# Staging receipt — 068 pgvector local recall

Date: 2026-06-13  
Scope: **Minimal live index/query** on local Compose Postgres.

## Shipped

| Item | Path |
|------|------|
| Authority + env contract | `docs/pgvector.md` |
| Compose + migration | `infra/pgvector/docker-compose.yml`, `migrations/001_init.sql` |
| Health + migrate scripts | `infra/pgvector/scripts/pgvector-health.sh`, `pgvector-migrate.sh` |
| Store (index/query/health) | `apps/desktop/electron/pgvector-store.ts` |
| Settings row | `ConnectPgvector` in `apps/desktop/src/surfaces/Panes.tsx` |
| Unit tests | `apps/desktop/electron/pgvector-store.test.ts` |

## Bring-up (staging proof)

```sh
cd infra/pgvector
docker compose up -d
./scripts/pgvector-migrate.sh
./scripts/pgvector-health.sh

cd /Users/seb/Code/otto
bun install
OTTO_PGVECTOR_INTEGRATION=1 OTTO_PGVECTOR=1 bun test apps/desktop/electron/pgvector-store.test.ts
# rev9: 8 pass / 0 fail / 0 skip (integration test ran)
```

Receipt: `docs/receipts/staging/068-pgvector-integration-rev9.json`

## Verification (unit, no docker)

```sh
bun test apps/desktop/electron/pgvector-store.test.ts
```

## Notes

- Embeddings use deterministic local hash (`otto-local-hash-v1`) — not production semantic quality.
- Settings → pgvector shows disabled/stopped/ready honestly; no fake connected recall when Compose is down.
- Desktop index/query IPC deferred; store API is callable from main/tests.
