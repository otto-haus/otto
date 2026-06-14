# 043 — Cognee Capture: Otto Canon with Provenance

Owner: Cursor
Priority: P1
Depends on: 041, 016
Release bucket: vNext knowledge

## Outcome

Otto can **capture** selected file canon into local Cognee with full **provenance** and a **capture receipt** — turning charters, tickets, receipts, standards/precedents, and approved artifacts into recallable graph memory without making Cognee authoritative.

When done:

```txt
scripts/cognee-capture.sh --kinds receipt,charter,ticket,precedent
→ cognee.remember() (or MCP equivalent)
→ CogneeCaptureReceipt JSON
→ no canon mutation
```

This maps to Cognee's "Connect" step: adapters + `remember()` for warehouses, docs, chats, APIs.

## Why this matters

Recall without capture is empty. Otto already has the right **file truth** layout; Cognee should index what we already trust, with citations back to paths — not re-ingest Slack/WhatsApp as truth (Channels 020 stays separate).

The one-pager test for Knowledge: updates must be sourced and receipted. Capture is the same bar.

## Source anchors

- Contract: `docs/cognee.md`
- Capture types: 040 `CogneeCaptureReceipt`
- Canon layout: `receipts/`, `charters/` or templates, `standards/`, `standards/precedents/`, ticket folders, `planning/hq-tickets/`
- Curation: proposals must not be auto-indexed as ratified canon until accepted (configurable include/exclude)
- Intake parked 019 — do not conflate; this is **Otto-native paths only** in v1

## Architecture target

### 1. Capture allowlist (v1)

Default indexed kinds:

```txt
receipt           receipts/otto-v01/** receipts/cognee/** (meta)
charter           charters/** (if present) or charter store export path
ticket            planning/hq-tickets/_Done/** HQ mirror optional (document)
standard          standards/*.md (not auto-edited core principles without flag)
precedent         standards/precedents/**
observed_perf     knowledge/ai-frontier/observed-performance/**
```

Default **excluded** unless explicit flag:

```txt
.env secrets *
Letta memory exports
Parked adapter dumps
InReview tickets (unproven)
proposed Curation items not yet accepted
```

### 2. Provenance metadata (required per batch)

Each capture attach:

```txt
source_kind
repo_path
content_hash (sha256)
captured_at
otto_ticket_id (optional)
git_commit (optional)
```

### 3. CLI / script

```sh
./scripts/cognee-capture.sh \
  --kinds receipt,precedent \
  --since 2026-06-01 \
  --dry-run

./scripts/cognee-capture.sh --kinds receipt,charter,ticket,precedent --apply
```

Behaviors:

- `--dry-run` lists files + counts only
- `--apply` calls Cognee ingest API / SDK / MCP (verify upstream at implementation)
- writes `receipts/cognee/capture/<id>.json`
- exits non-zero on partial failure with summary

### 4. Scheduling (manual v1)

No cron in this ticket. Document hook for future Routine:

```txt
routines/cognee-sync/   (optional stub README only)
```

Recurring capture activation = Curation door (Routines doctrine).

### 5. Desktop hook (optional minimal)

Knowledge or Settings button: **Capture now** (runs script IPC) → shows last capture receipt summary.

## Scope

- `scripts/cognee-capture.sh` with dry-run and apply
- Provenance + receipt schema implemented
- IPC `otto:cognee:capture` optional wrapper
- Unit tests for allowlist/exclude rules (pure functions)
- Docs in `docs/cognee.md` § Capture
- Smoke: dry-run on repo → apply small fixture set → recall spot-check via 042

## Out of scope

- Slack/Discord/email ingestion
- Cognee Cloud upload
- Automatic continuous sync / file watcher
- Mutating indexed files based on graph inference
- People Context Pack generation (024)
- AI Frontier model-registry auto-updates

## Done when

- Dry-run on `/Users/seb/Code/otto` lists only allowlisted paths; secrets paths never appear.
- Apply mode ingests a bounded smoke set (≥3 receipts, ≥1 precedent) into local Cognee.
- Capture receipt JSON includes provenance fields for every batch.
- Re-running capture is idempotent or documents dedupe strategy (hash-based skip acceptable).
- Recall via 042 returns at least one citation pointing back to an indexed `receipts/` path.
- No canon files modified by capture job.
- Execution receipt includes dry-run output + capture receipt path + recall spot-check.

## Verification

```sh
cd /Users/seb/Code/otto
./scripts/cognee-home.sh start   # from 041
./scripts/cognee-capture.sh --kinds receipt,precedent --dry-run
./scripts/cognee-capture.sh --kinds receipt,precedent --apply
ls receipts/cognee/capture/

bun test ./apps/desktop/electron/*cognee* 2>/dev/null || bun test ./apps/desktop/electron/*.test.ts
```

## Blocker log

Leave blank unless blocked.
