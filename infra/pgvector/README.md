# pgvector infra (opt-in)

Local Postgres + pgvector for Otto **derived recall** experiments. **Not bundled in otto.app.** Disabled unless you opt in.

## Quick start

```sh
cd infra/pgvector
cp .env.example .env   # optional — defaults work for local dev
docker compose up -d
```

Then in another terminal (when health script lands):

```sh
./scripts/pgvector-health.sh
```

Point Otto at the instance:

```sh
export OTTO_PGVECTOR=1
export OTTO_PGVECTOR_URL=postgresql://otto:otto@127.0.0.1:5433/otto_recall
```

## Honest status

| Component | Shipped? |
|-----------|----------|
| `docker-compose.yml` stub | Yes |
| `.env.example` | Yes |
| `scripts/pgvector-migrate.sh` | Apply `migrations/001_init.sql` |
| `scripts/pgvector-health.sh` | Yes (requires running Compose + psql) |
| SQL migration | Planned (068) |
| Desktop index/query | Stub only |

Default Otto behavior: **pgvector off**. Settings/Knowledge show honest disabled/stub states.

## Ports

Compose maps host **5433** → container 5432 to avoid clashing with local Postgres or Cognee (041). Adjust in `docker-compose.yml` if needed.

## Docs

Full authority and env contract: [`docs/pgvector.md`](../../docs/pgvector.md).
