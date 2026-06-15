# Hosted Otto — Health, Monitoring, and Support Diagnostics

**Status:** proposed (2026-06-14)  
**Issue:** **331**  
**Related:** `otto-web-spec.md` (**082**), `agent-control-plane-spec.md` (**092**), desktop `SystemHealthReport` (`apps/desktop/electron/shared/types.ts`)

---

## One sentence

**Hosted otto** exposes layered health (public aggregate, authenticated workspace, runner-private), a support-safe diagnostic bundle, deployment smoke gates, and a first-managed-user on-call workflow — without leaking secrets or implying otto approves or guarantees runtime outcomes.

---

## Scope map

| Layer | Audience | What it proves |
|-------|----------|----------------|
| **Public health** | Anyone, uptime monitors | Control plane reachable; no tenant data |
| **Private / workspace health** | Authenticated operator | Their agent, queue, memory, runner lease |
| **Runner heartbeat** | Control plane + on-call | Execution env alive, listener up, disk ok |
| **Support bundle** | Support + operator (opt-in export) | Redacted snapshot for triage |
| **Status page** | Customers + operators | Aggregate incident surface |

Out of scope for v1: SLA guarantees, automated remediation, multi-tenant billing health.

---

## 1. Hosted health-check contract

### Shared shape

Reuse desktop `HealthCheck` / `SystemHealthReport` so CLI, Settings, Workers, and support tools speak one language:

```txt
HealthCheckStatus = ok | warn | fail | unknown | skip
HealthCheck       = { id, label, status, summary, impact?, nextAction?, data? }
SystemHealthReport = { ok, checkedAt, scope, build?, checks[] }
```

Hosted scopes:

| `scope` | Source | When |
|---------|--------|------|
| `public` | Workers `/api/health` | Every 30s from edge monitor |
| `workspace` | Workers `/api/workspaces/:id/health` | Authenticated operator |
| `runner` | Runner → CP heartbeat ingest | Every 60s while lease active |
| `offline` | `scripts/otto-health.mjs` | CI / repo checkout (existing) |
| `live` | Desktop IPC `otto:system:health` | Local app (existing) |

**Rule:** `ok` on aggregate means no `fail` checks; `warn` does not fail public uptime unless policy marks check as SLO-critical.

### Public endpoints (no auth)

```txt
GET /api/health
```

Response (minimal):

```json
{
  "ok": true,
  "checkedAt": "2026-06-14T12:00:00.000Z",
  "scope": "public",
  "checks": [
    { "id": "edge", "label": "Edge worker", "status": "ok", "summary": "Worker responding" },
    { "id": "d1", "label": "Metadata store", "status": "ok", "summary": "D1 reachable" },
    { "id": "r2", "label": "Artifact store", "status": "ok", "summary": "R2 head ok" }
  ]
}
```

No tenant ids, agent ids, or Letta tokens in public responses.

```txt
GET /api/status
```

Public **aggregate** only — maps to status-page components (§2). Returns component-level `ok | degraded | major_outage | unknown`, last transition time, and link to human-readable incident copy. Never per-user queue depth.

### Private / workspace endpoints (auth required)

```txt
GET /api/workspaces/:workspaceId/health
```

Checks (workspace-scoped):

| `id` | Label | Source |
|------|-------|--------|
| `identity` | Session / tenant | WorkOS or CF Access session (**088**) |
| `primary_agent` | Primary agent bound | D1 `letta_links` |
| `runtime` | Letta session reachable | Letta Cloud read proxy (**085**) |
| `session` | Conversation / WS listener | Runner heartbeat + Letta env status |
| `queue` | Command + chat queue | CP command queue + optional desktop sync cursor |
| `memory` | Memory blocks reachable | Letta memory read (count only) |
| `storage` | Receipt / artifact storage | R2 prefix quota head; D1 row counts |
| `scheduler` | Letta cron + otto cron | Schedule cache TTL + last fire receipt |
| `permissions` | Approval gates armed | Autonomy policy hash present |
| `runner` | Runner heartbeat fresh | Last heartbeat < 2× interval |
| `build` | Deployed CP version | Worker version + git sha env |

**Queue health semantics** (align with desktop `queue` check):

- `fail`: failed items > 0 and none retriable within policy
- `warn`: failed > 0 with retry available, or sending stuck > N minutes
- `ok`: empty or only healthy queued/sending
- `unknown`: desktop-only queue not synced — honest empty state

**Memory / storage health:**

- Memory: probe block list count; do not return block contents in health API
- Storage: receipt index row count + R2 list prefix success; warn on migration lag

### Runner heartbeat (private ingest)

```txt
POST /api/runners/:runnerId/heartbeat
Authorization: runner lease token
```

Body fields (extends **092** § runner heartbeat):

```txt
envName, agentId, listenerUp, lastTurnAt, leaseId, leaseExpiresAt,
diskOk, volumeMounted, transportMode, wsListenerPort, queueDepth,
buildChannel, buildVersion, buildSha
```

CP marks runner `stale` when `now - lastHeartbeatAt > 120s`. Stale runners surface as `warn` on workspace health and `degraded` on status page component `execution`.

---

## 2. Status page and support diagnostic model

### Status page (public)

Components for v1 managed pilot:

| Component | Includes | Excludes |
|-----------|----------|----------|
| **Control plane** | CF Workers, D1, R2 | Tenant data |
| **Letta Cloud proxy** | Read API latency / error rate | Provider keys |
| **Execution runners** | Aggregate stale-runner count | Per-customer runner ids |
| **Notifications** | Discord/webhook delivery lag | Message content |
| **Desktop app** | Latest release channel metadata | Local machine state |

States: `operational`, `degraded`, `partial_outage`, `major_outage`, `maintenance`.

**Rule:** Status page describes **observed platform behavior**, not "otto is working correctly for you." Per-workspace detail stays behind auth.

Initial delivery: static status JSON served from Workers (**083** phase 1) → external status host later if needed.

### Support diagnostic bundle

Operator-initiated export — same trust boundary as Settings "Copy diagnostics" on desktop.

```txt
POST /api/workspaces/:workspaceId/support-bundle
```

Produces a **SupportBundle** artifact (JSON + optional zip to R2, signed download URL, 24h TTL):

```txt
SupportBundle {
  bundleId, createdAt, workspaceId, operatorId,
  health: SystemHealthReport,      // workspace scope
  build: { cpVersion, runnerBuild?, desktopBuild? },
  queue: { queued, failed, sending, lastErrorCode? },
  runner: { lastHeartbeatAt, listenerUp, stale },
  schedules: { lettaCronCount, blockedCount, lastMissedAt? },
  receipts: { lastReceiptAt, indexLagSeconds? },
  transport: { mode, effectiveTransport, lastReconnectAt? },
  redaction: { secrets: "stripped", memoryContents: "excluded" }
}
```

**Never include:** API keys, OAuth tokens, memory block text, attachment bytes, Paperclip private notes, raw webhook payloads.

Support uses bundle for L1 triage; L2 may request a live screen share or disposable repro (never `conversation=default`).

---

## 3. Deployment smoke checks

Run after every hosted control-plane deploy and runner image promote. All Letta smokes use **disposable conversations** only.

### Control plane (Workers)

| # | Check | Pass criteria |
|---|-------|---------------|
| 1 | `GET /api/health` | `ok: true`, all public checks `ok` or allowed `warn` |
| 2 | `GET /api/status` | JSON schema valid; components present |
| 3 | D1 migrate | Migrations applied; no pending drift |
| 4 | R2 head | Write/read/delete test object in staging prefix |
| 5 | Auth gate | Unauthenticated workspace health returns 401 |
| 6 | Webhook HMAC | Test webhook rejects bad signature |
| 7 | Secret hygiene | Logs contain no `LETTA_`, `WORKOS_`, token patterns |

### Runner / remote env (optional VM, **086**)

| # | Check | Pass criteria |
|---|-------|---------------|
| 8 | Heartbeat ingest | POST heartbeat → workspace health `runner` ok |
| 9 | Listener up | `listenerUp: true` within 5 min of deploy |
| 10 | Letta session | Disposable conversation turn completes |
| 11 | Volume | `volumeMounted` + `diskOk` true |
| 12 | Schedule honesty | If listener down, workspace health `scheduler` = `warn`, not `ok` |

### Repo / CI (existing — keep on every merge)

```sh
bun run typecheck
bun test
bun run verify:v0
node scripts/otto-health.mjs --json   # offline scope
```

### Desktop parity (staging only — not canonical app)

```sh
task staging:build   # no launch required for doc-only merges
# When runtime proof needed:
# task smoke:cli     # disposable conversation only
```

**Rule:** Do not mutate `/Applications/otto.app` or `/Applications/otto-staging.app` in automated deploy smokes unless explicitly authorized.

---

## 4. On-call and support workflow (first managed users)

Pilot scale: single operator (Sebastian) + one on-call engineer. No 24/7 SLA in v1.

### Severity matrix

| Sev | Example | Response target | Customer comms |
|-----|---------|-----------------|----------------|
| **S1** | Control plane down; no auth'd health | 1 h | Status page + direct message |
| **S2** | Runners stale; sends failing for multiple workspaces | 4 h | Status page update |
| **S3** | Single workspace queue stuck; memory probe warn | Next business day | In-app + email |
| **S4** | Cosmetic status lag; non-blocking warn | Backlog | None required |

### Triage flow

```txt
Alert (edge monitor | customer report)
  → Confirm /api/health + /api/status
  → If workspace-specific: request SupportBundle or check authenticated health
  → Classify: CP vs Letta Cloud vs runner vs desktop client
  → Mitigate: rollback deploy, restart runner, operator reconnect
  → Record: incident id, timeline, receipt ids — no secret values
  → Close: status component → operational; postmortem if S1/S2
```

### First managed user support checklist

1. Verify identity and workspace id (support tool, not public API).
2. Pull SupportBundle or guide operator to Settings → Copy diagnostics (desktop).
3. Check runner heartbeat freshness and Letta env connection (**085** read proxy).
4. Inspect queue failed count and last error code (not message body if PII).
5. Confirm schedule banner honesty (listener down ≠ silent ok).
6. If repro needed: disposable conversation + staging app; never default conversation.
7. Escalate to Letta Cloud only with redacted bundle + timestamps.

### Notification routing (v1)

| Event | Route |
|-------|-------|
| Public health fail | On-call pager (email/SMS) |
| Runner stale > 5 min | Discord ops channel (**020**) |
| Workspace queue fail | Operator notification preference |
| S1 status transition | Status page + direct operator contact |

---

## Ticket map (implementation follow-ups)

| Ticket | Delivers |
|--------|----------|
| **083** | Public `/api/health` + static status JSON |
| **084** | D1 health indexes + SupportBundle storage |
| **085** | Letta read proxy checks in workspace health |
| **086** | Runner heartbeat agent + deploy smokes 8–12 |
| **097** | Stale-runner alert policy (named in **092**) |
| **096** | Audit export hardening (bundle superset) |

---

## Done test (issue **331**)

- [x] Hosted health-check contract drafted (§1)
- [x] Status page / support diagnostic model proposed (§2)
- [x] Deployment smoke checks listed (§3)
- [x] On-call / support workflow sketched for first managed users (§4)

Implementation of endpoints and bundles is **not** claimed done here — this doc is the contract for **083+**.

---

## References

- `docs/v1/otto-web-spec.md` — API boundaries (`/api/health`, `/api/status`)
- `docs/v1/agent-control-plane-spec.md` — runner heartbeat, command queue gaps
- `apps/desktop/electron/system-health.ts` — live desktop checks (parity source)
- `scripts/otto-health.mjs` — offline/repo health probe
- `AGENTS.md` — smoke rules (disposable conversations, staging app boundary)
