# Otto v1 — Desktop ↔ Cloud sync contract

**Issue:** [#329](https://github.com/otto-haus/otto/issues/329)  
**Umbrella:** `docs/v1/otto-web-spec.md` (Cloudflare + Letta topology)  
**Authority seam:** `docs/v1/contracts/adapter-seam.md`  
**Status:** Contract draft — implementation follows **084** (D1 records API)

## Purpose

Define how **desktop otto** (primary workspace) and **Otto Cloud** (visibility + away-mode control plane) exchange durable state without a second ratification path, silent canon merge, or Letta memory fork.

```txt
Desktop  = primary workspace; folder/disk truth for canon
Cloud    = visibility + approvals away from desk + optional sync
Letta    = agent memory, execution, provider keys (never otto SoR)
```

Sync is **opt-in**, **receipt-backed**, and **never required** for local-first v1 desktop use.

---

## Authority matrix

| Surface | System of record (SoR) | Cloud role | Desktop role |
|---------|------------------------|------------|--------------|
| Standards, Practices, Routines, Charters, Tickets (folder) | **Disk** (`standards/`, `practices/`, `planning/hq-tickets/`, etc.) | Read mirror + link only | Authoritative editor |
| Curation proposals | **Desktop `ProposalStore`** until decided | Mirror + decide via same seam | Create + decide locally |
| Receipts | **Desktop `receipts/`** (append-only) | Index + R2 artifact pointer | Author + push source |
| Approvals / permission sessions | **Desktop stores** | Pending list + deep link | Gate execution |
| Conversations / threads | **Letta** (messages); **desktop** (thread index metadata) | Read-only summary if linked | Primary chat surface |
| Attachments | **Desktop `~/.otto/attachments/`** (+ Letta runtime refs) | Never auto-upload | Local storage |
| Settings (otto) | **Desktop `~/.otto/config.json`** | Tenant prefs + Letta link flags only | Full local config |
| Letta memory blocks | **Letta Cloud / local Letta** | Never replicated | Runtime only |
| Provider / API keys | **Letta + OS keychain** | Boolean capability flags only | Never exported |
| Logs / debug traces | **Local files** | Opt-in redacted export only | SoR |
| Paperclip / external adapters | **External system** | Imported work-state (read) | Adapter seam |

**Rule:** Folder/ticket state on disk remains truth until an explicit, receipted sync operation promotes a cloud decision through `ProposalStore.decide()` — same gates as desktop.

**Rule:** Chat claims are not state. Sync payloads must carry durable ids and content hashes, not conversational summaries.

---

## Data classes

### 1. Conversations

**Local:** `~/.otto/threads/index.json` — thread id, title, `lettaConversationId`, pin/archive, sort order.  
**Messages:** Letta runtime only; otto does not own message SoR.

| Sync | Direction | Notes |
|------|-----------|-------|
| Thread metadata | Desktop → Cloud (optional) | For away-mode thread list; no message bodies in v1 slice |
| Message history | **Never** | Letta is SoR; cloud may deep-link to Letta read APIs later |
| `conversation=default` | **Never in smokes/tests** | Disposable conversations only |

### 2. Files (canon)

**Local:** repo-relative paths under otto workspace (`standards/`, `practices/`, `routines/`, tickets).

| Sync | Direction | Notes |
|------|-----------|-------|
| Full tree mirror | **Never automatic** | Cloud shows links/paths; edits stay on desktop |
| Export bundle | Desktop → operator (manual) | Zip/tar for backup; not background sync |

### 3. Attachments

**Local:** `~/.otto/attachments/` (ingested chat attachments).

| Sync | Direction | Notes |
|------|-----------|-------|
| Binary upload | **Never default** | Explicit operator export if needed; R2 only after consent + receipt |
| Metadata only | Desktop → Cloud (future) | Filename, mime, sha256, size — no bytes without opt-in |

### 4. Memory

**Local:** Letta memory blocks + optional derived recall (Cognee/pgvector).

| Sync | Direction | Notes |
|------|-----------|-------|
| Letta memory blocks | **Never** | Letta Cloud owns remote memory |
| Derived recall (Cognee) | **Never** | Adapter returns context only; see `docs/cognee.md` |
| Curation learnings | Via proposals/receipts only | Never direct memory writeback from cloud |

### 5. Settings

**Local:** `~/.otto/config.json` (runtime mode, UI prefs, effort, sort mode).  
**Letta:** `~/.letta/settings*.json` (agent/session pointers).

| Sync | Direction | Notes |
|------|-----------|-------|
| Otto UI prefs | Desktop → Cloud (optional, phase 2) | Non-secret keys only |
| Letta link state | Cloud D1 `letta_links` | Agent id, env names, connection health — no tokens |
| Provider keys | **Never** | Boolean flags in cloud UI only |

### 6. Approvals

**Local:** `permission-session-store`, autonomy policy, pending HITL rounds.

| Sync | Direction | Notes |
|------|-----------|-------|
| Pending approval index | Desktop → Cloud | Id, scope summary, created_at, deep link |
| Approval decision | Cloud → Desktop | Same autonomy class + `ProposalStore`/permission gates |
| Expired sessions | Desktop wins | Cloud marks stale; desktop is SoR for session state |

### 7. Receipts

**Local:** `receipts/*.json` (+ staging paths under `docs/receipts/`).

| Sync | Direction | Notes |
|------|-----------|-------|
| New receipts | Desktop → Cloud (v1 slice) | Idempotent push by receipt id |
| Receipt artifacts | Desktop → R2 | Large HTML/logs/screenshots; D1 holds pointer |
| Mutations | **Never** | Receipts are append-only; corrections = new receipt |

### 8. Logs

**Local:** Electron/main logs, smoke logs, debug traces.

| Sync | Direction | Notes |
|------|-----------|-------|
| Continuous log stream | **Never** |
| Redacted export | Operator-initiated | Support bundle; secrets stripped |
| Error fingerprints | Optional aggregate | PostHog/Sentry separate from sync contract |

---

## What never syncs

```txt
- Provider / API keys, OAuth tokens, webhook secrets
- Letta memory blocks and raw conversation messages
- Paperclip write-back or external adapter mutations
- Silent merge of Standards/Practices/Routines/Charters/Tickets
- Background attachment upload
- conversation=default (smokes use disposable conversations)
- /Applications/otto.app or live profile paths (staging/smoke isolation only)
```

---

## Conflict behavior

**Principle:** Last-write-wins (LWW) is forbidden for canon, curation, and tickets.

| Data class | Conflict rule |
|------------|---------------|
| Receipts | Append-only; duplicate id = no-op (idempotent) |
| Proposals | Same id + different payload → **conflict record**; human decide via desktop or cloud UI using `ProposalStore.decide()` |
| Tickets / folder canon | **Desktop disk wins** until explicit export/import receipt |
| Thread metadata | Desktop wins for title/pin/archive; cloud may show stale badge |
| Settings | Field-level merge with explicit precedence: local secrets never overwritten |
| Approvals | First decisive action wins; late duplicate = rejected with receipt |

**Conflict record shape (D1):**

```txt
sync_conflicts
  id, tenant_id, surface, local_ref, cloud_ref, detected_at, status (open|resolved|ignored)
```

Resolution always produces a **receipt** naming which side was chosen and why.

---

## Offline behavior

| State | Desktop | Cloud |
|-------|---------|-------|
| Desktop offline | Full local operation; sync queue paused | Shows last synced snapshot + "desktop offline" |
| Cloud unreachable | Queue pushes in `~/.otto/sync/outbox/`; retry with backoff | N/A |
| Desktop offline + pending cloud approval | Approval waits; desktop shows on reconnect | Operator sees pending; cannot force local execute |
| Partial push | Cursor not advanced; outbox entry retried | API returns partial acceptance list |

**Outbox (desktop):** JSON lines under `~/.otto/sync/outbox/` — one envelope per push. Max retry with exponential backoff; operator-visible error surface after N failures.

**Cursor model (D1 `sync_cursors`):**

```txt
tenant_id, surface, cursor_json
  surface ∈ receipts | proposals | approvals | threads
  cursor_json = { last_id, last_hash, pushed_at }
```

Desktop advances cursor only after cloud ACK + receipt.

---

## Privacy and security

```txt
Encryption in transit:  TLS 1.2+ for all cloud API calls
Encryption at rest:     CF D1/R2 platform encryption; no custom crypto v1
Authentication:         Device token (v1 single-tenant) → WorkOS org RBAC (088)
Authorization:          Same autonomy classes as desktop; mutating routes require approval
Secrets:                CF Secrets Store for API keys; never in D1 or sync payloads
Tenant isolation:       tenant_id on every row; single-tenant v1 = one row
Data minimization:      Cloud stores indexes + pointers; not full canon tree
Retention:              Receipts follow operator export policy; logs export opt-in only
Audit:                  Every push/pull writes sync receipt with envelope hash
```

**User-visible controls:**

- Enable/disable cloud sync (default: off for v1 desktop)
- Export all receipts + proposal index (JSON bundle)
- Export redacted support bundle (logs, no secrets)
- Disconnect device / revoke cloud token
- View sync status: last push, pending outbox, open conflicts

---

## Sync envelope (shared shape)

Implementation types may live in `@otto-haus/core` after **084**. Logical envelope:

```txt
SyncEnvelope {
  id: Id                    -- uuid; idempotency key
  tenant_id: Id
  surface: SyncSurface      -- receipts | proposals | approvals | threads
  direction: push | pull
  payload_hash: string      -- sha256 of canonical JSON payload
  payload: unknown          -- surface-specific
  device_id: Id
  created_at: ISO8601
}
```

`POST /api/sync/receipts` (see `otto-web-spec.md`) accepts `SyncEnvelope[]`; responds with `{ accepted: Id[], duplicates: Id[], conflicts: Id[] }`.

---

## Phase map

| Phase | Slice | Outcome |
|-------|-------|---------|
| **v1a** (first implementation) | Receipt push only | Desktop → D1 + R2 artifacts; read on cloud web |
| **v1b** | Proposal mirror + decide round-trip | Cloud inbox; decide via same seam |
| **v2** | Approval index + deep link | Away-mode approvals |
| **v3** | Thread metadata read | Away-mode thread list (no messages) |
| **v4** | Settings sync (non-secret) | UI prefs parity |

**First implementation slice (v1a):**

1. D1 `receipts` + `sync_cursors` tables (**084**)
2. Desktop sync worker: scan `receipts/*.json`, push new ids, upload artifacts to R2
3. Authenticated `POST /api/sync/receipts` with idempotent envelope
4. Cloud web: receipt list + detail (read-only)
5. Operator toggle: Settings → Cloud → "Sync receipts" (default off)
6. Proof: sync receipt in `docs/receipts/staging/` with disposable conversation smoke

**Non-goals for v1a:** bi-directional canon, message sync, attachment upload, Letta memory, Paperclip write-back.

---

## Done test

> Operator enables receipt sync on desktop, completes a local run, closes laptop, opens Otto Cloud on phone, and sees the same receipt id + status + artifact link — without provider keys leaving the machine, without `conversation=default` in tests, and without cloud overwriting folder canon.

---

## References

- `docs/v1/otto-web-spec.md` — Cloud topology, D1 sketch, API boundaries
- `docs/v1/contracts/adapter-seam.md` — ratification path
- `docs/otto-smoke-isolation.md` — disposable conversations, staging paths
- `planning/hq-tickets/_Parked/089-desktop-cloud-sync-contract.md` — historical ticket mirror
