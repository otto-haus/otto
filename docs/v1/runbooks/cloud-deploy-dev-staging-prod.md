# Hosted otto — Cloud deploy runbook (dev / staging / prod)

Operator contract for deploying **Otto Cloud** (Cloudflare Workers/Pages + D1/R2) across **dev**, **staging**, and **prod**. This is **not** the desktop staging runbook — see [`live-vs-staging.md`](live-vs-staging.md) (**091**) for `/Applications/otto-staging.app`.

**Parent architecture:** [`hosted-managed-architecture.md`](../hosted-managed-architecture.md) (**#328**) · [`otto-web-spec.md`](../otto-web-spec.md)  
**Issue:** [#462](https://github.com/otto-haus/otto/issues/462)

---

## Two staging names (do not conflate)

| Name | What it is | Runbook |
|------|------------|---------|
| **Desktop staging** | Packaged Electron app at `/Applications/otto-staging.app` | [`live-vs-staging.md`](live-vs-staging.md) |
| **Cloud staging** | CF-hosted web/API at `otto-staging.*` subdomain | This doc |

Desktop and cloud staging use **separate** data, secrets, and smoke profiles. Never point cloud smokes at live desktop profiles or `conversation=default`.

---

## Environment matrix

Matches [`hosted-managed-architecture.md`](../hosted-managed-architecture.md) § Deployment environments.

| Environment | Purpose | Pages / Workers | D1 / R2 | Managed VM (`letta server`) | Auth | Letta smokes |
|-------------|---------|-----------------|---------|----------------------------|------|--------------|
| **dev** | Engineer iteration, PR previews | CF Pages preview / Workers dev name | Disposable branch DB or local miniflare | Local `letta server` or none | CF Access dev group / personal API token | Disposable conversation only |
| **staging** | Pre-prod smoke before prod | `otto-staging.*` (see Open decisions) | Isolated `otto-staging` D1 + R2 buckets | Optional `otto-cloud-staging` env | CF Access staging | Disposable conversation only |
| **prod** | Managed pilot / always-on | `app.otto.haus` (TBD **065**) | Production D1 + R2 | `otto-cloud` prod env | CF Access + future WorkOS | **No** agent smokes without Sebastian approval |

### Resource naming (target)

| Resource | dev | staging | prod |
|----------|-----|---------|------|
| Workers service | `otto-dev` (preview) | `otto-staging` | `otto` |
| Pages project | `otto` (preview branches) | `otto-staging` | `otto` |
| D1 database | `otto-dev` (ephemeral) | `otto-staging` | `otto-prod` |
| R2 bucket | `otto-artifacts-dev` | `otto-artifacts-staging` | `otto-artifacts-prod` |
| Secrets Store | `otto/dev/*` | `otto/staging/*` | `otto/prod/*` |
| Letta remote env | — | `otto-cloud-staging` | `otto-cloud` |

Repo scaffold today: root [`wrangler.jsonc`](../../../wrangler.jsonc) serves static `site/` assets only. Full Workers API + D1 wiring lands with **#99–#100**; this runbook defines the **target** deploy/smoke contract ahead of `apps/cloud/` (**#106**).

---

## Secrets and isolation rules

```txt
FORBIDDEN:
  - Prod CF Secrets Store keys in dev or staging wrangler env
  - Shared D1/R2 between staging and prod
  - Logging secret values (boolean presence checks only)
  - Cloud smokes against conversation=default or live ~/.otto profiles
```

| Secret class | dev | staging | prod |
|--------------|-----|---------|------|
| Letta API key (cloud read) | Personal dev key | Staging service key | Prod service key |
| Webhook HMAC | Dev-only | Staging-only | Prod-only |
| CF Access | Dev group | Staging group | Prod group |

Use [Cloudflare Secrets Store](https://developers.cloudflare.com/secrets-store/) per environment when Workers API ships. Until then, document intended binding names only — do not commit values.

---

## Deploy procedures

### dev — preview / local

**When:** Every PR touching `site/`, `wrangler.jsonc`, or future `apps/cloud/`.

```sh
cd /Users/seb/Code/otto
# Static site preview (current scaffold)
bunx wrangler pages deploy site --project-name=otto --branch=preview

# Local miniflare (when Workers API exists)
# bunx wrangler dev
```

**Verify:**

```sh
curl -sf "https://<preview-url>/api/health" | jq .
# Expect: { "ok": true, "env": "dev" } (shape TBD #99)
```

No Sebastian gate. No prod data.

### staging — pre-prod smoke

**When:** After dev health passes; before any prod promotion.

**Who may deploy:** Implementers with CF staging credentials.

```sh
cd /Users/seb/Code/otto
# Target (when Workers API + D1 exist):
# bunx wrangler deploy --env staging

# Static site interim:
bunx wrangler pages deploy site --project-name=otto-staging --branch=main
```

**Post-deploy smoke checklist:**

| Step | Command / action | Pass? |
|------|------------------|:-----:|
| 1 | `curl -sf https://otto-staging.<domain>/api/health` | ☐ |
| 2 | Health JSON shows `env: staging` (not prod) | ☐ |
| 3 | Authenticated `/api/status` returns workspace scoped to staging tenant | ☐ |
| 4 | No prod D1 binding in wrangler staging env (inspect `wrangler.jsonc`) | ☐ |
| 5 | Optional VM: `letta server --env-name otto-cloud-staging` listener shows connected in status UI | ☐ |

Record receipt under `docs/receipts/staging/cloud-staging-deploy-*.md`.

### prod — Sebastian gate only

**When:** Staging smoke green + explicit Sebastian approval.

```txt
FORBIDDEN without Sebastian sign-off:
  - wrangler deploy --env production
  - DNS cutover to app.otto.haus
  - Promoting staging D1/R2 data to prod
  - Creating or rotating prod Secrets Store entries
```

**Ceremony:**

1. Implementer opens PR with staging receipt + smoke output.
2. Sebastian reviews staging URL, health, and tenant isolation proof.
3. Sebastian runs or approves prod deploy window.
4. Post-deploy: health + read-only status check (no destructive Letta turns unless scheduled).

Prod deploy commands mirror staging with `--env production` once scaffold exists. Until **#99–#100** land, prod promotion is **blocked** — marketing site deploys remain separate (**065**).

---

## Smoke commands (Letta / desktop parity)

Cloud smokes must use **disposable** Letta conversations — same rule as desktop staging ([`docs/receipts/staging/README.md`](../../receipts/staging/README.md)).

```sh
# Desktop staging smokes (isolated profile — NOT cloud, but required for release parity)
cd /Users/seb/Code/otto
OTTO_RECEIPT_DIR=$PWD/docs/receipts/staging \
  NODE_PATH=$HOME/.codex/admin/node_modules \
  node scripts/otto-staging-onboarding-smoke.cjs

# Cloud API smoke (template — implement with #100)
# curl -sf -H "Authorization: Bearer $OTTO_STAGING_TOKEN" \
#   "https://otto-staging.<domain>/api/receipts?limit=1"
```

**Never:**

- `conversation=default` in any smoke script
- `/Applications/otto.app` for cloud deploy proof
- Reuse prod Letta agent IDs in dev/staging

---

## Rollback

| Environment | Rollback |
|-------------|----------|
| dev | Redeploy previous preview branch; delete ephemeral D1 if corrupted |
| staging | `wrangler rollback` (Workers) or redeploy prior Pages commit; staging data disposable |
| prod | Sebastian-approved rollback only; keep prior Worker version + D1 backup snapshot |

Document rollback commit SHA in the deploy receipt.

---

## Open decisions (coordinate before prod)

1. **Subdomain:** `app.otto.haus` vs `cloud.otto.haus` (**065**).
2. **Monorepo layout:** `apps/cloud/` ADR (**#106**) before binding prod D1.
3. **Managed VM host:** Render / Fly / Railway for `otto-cloud-staging` and `otto-cloud` (**#102**).

---

## Related

- [`live-vs-staging.md`](live-vs-staging.md) — desktop `otto.app` vs `otto-staging.app`
- [`sebastian-release-sign-off.md`](sebastian-release-sign-off.md) — desktop release gate (separate from cloud prod)
- [`hosted-managed-architecture.md`](../hosted-managed-architecture.md) — full system context
- [`otto-web-spec.md`](../otto-web-spec.md) — CF + Letta topology

---

## Done test (#462)

> An implementer can deploy dev preview, run staging health smokes with isolated secrets, and know exactly what Sebastian must approve before prod — without confusing desktop `otto-staging.app` with cloud staging, and without touching `conversation=default`.
