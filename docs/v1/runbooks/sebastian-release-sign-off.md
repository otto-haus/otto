# Sebastian release sign-off ceremony

Repeatable packet for each **`0.1.x`** cut. **No push, tag, or live app promotion** until Sebastian records explicit approval.

**Related:** [`RELEASE_CHECKLIST.md`](../../../RELEASE_CHECKLIST.md) · [`docs/v1/ship-tier-matrix.md`](../ship-tier-matrix.md) · [`063` gate packet](../../receipts/staging/063-sebastian-gate-packet-v03-20260614.md) · ticket **142**

---

## Before you start

| Requirement | Path / command |
|-------------|----------------|
| Branch | `ship/functional-labs` (integration codename — not semver) |
| Target tag (hold) | `v0.1.3` — prepare only until signed |
| Staging app only | `/Applications/otto-staging.app` — **never** live `/Applications/otto.app` |
| CDP port | `9445` (isolated profile under `~/.codex/admin/otto-staging/`) |
| Unit gate | `bun run verify:v0` |
| Release gate | `bash scripts/release-gate.sh` |
| Embedded Letta bundle smoke | CI job `embedded-letta-release-gate` on PR; local: `bash scripts/ci-embedded-letta-gate.sh` |

```sh
cd /Users/seb/Code/otto
bun run verify:v0
bash scripts/release-gate.sh
OTTO_STAGING_REFRESH=1 bash apps/desktop/scripts/deploy-staging.sh
```

Record pass/fail and receipt paths in [`docs/receipts/staging/sebastian-release-approval-*.md`](../../receipts/staging/) using the [approval template](../../receipts/staging/sebastian-release-approval-template.md).

---

## Ceremony flow (≈45 min)

### 1 — Automated gates (implementer)

Run and paste exit codes + dates into the approval receipt:

```sh
cd /Users/seb/Code/otto
bun run verify:v0
bash scripts/release-gate.sh
```

Expected: **5/5** verify, release-gate includes desktop `electron:typecheck`.

### 2 — Ship tier walk (Sebastian, Labs **off**)

Fresh or disposable profile: Settings → Labs master **off**.

| Step | Action | Pass? |
|------|--------|:-----:|
| A | Window title reads **otto staging** | ☐ |
| B | Sidebar Ship surfaces open without error (Charters, Standards, Practices, Routines, Curation, Receipts, Checks, Autonomy, Skills, Tickets) | ☐ |
| C | Knowledge + Channels show **coming soon** (not hidden) | ☐ |
| D | Chat: header clean (no MemFS/cli footer); model/effort above compose | ☐ |
| E | One real assistant turn after `session.initialize()` (Letta runtime required) | ☐ |
| F | Culture CI demo — [`docs/v1/demo-culture-ci.md`](../demo-culture-ci.md) (135) | ☐ |

**Staging smoke JSON (when runtime up):**

```sh
NODE_PATH=$HOME/.codex/admin/node_modules \
  OTTO_RECEIPT_DIR=$PWD/docs/receipts/staging \
  node scripts/otto-staging-onboarding-smoke.cjs

NODE_PATH=$HOME/.codex/admin/node_modules \
  node scripts/otto-staging-two-thread-smoke.cjs

NODE_PATH=$HOME/.codex/admin/node_modules \
  node scripts/otto-staging-rev8-proof.cjs

NODE_PATH=$HOME/.codex/admin/node_modules \
  node scripts/otto-staging-076-bootstrap-proof.cjs

NODE_PATH=$HOME/.codex/admin/node_modules \
  OTTO_RECEIPT_DIR=$PWD/docs/receipts/staging \
  node scripts/otto-staging-hygiene-proof.cjs
```

Receipts land under `docs/receipts/staging/*.json`. Prior bundle: **138** hygiene [`staging-hygiene-proof-20260614143512.json`](../../receipts/staging/staging-hygiene-proof-20260614143512.json).

### 3 — Labs tier spot-check (Sebastian, Labs **on**)

Settings → Labs master **on** → enable one Labs feature (e.g. `knowledge_cognee`).

| Step | Action | Pass? |
|------|--------|:-----:|
| G | Knowledge pane opens (may show **Labs blocked** if Cognee off — honest) | ☐ |
| H | Channels pane opens (no live Discord bot — contract only) | ☐ |

Labs UX contract: [`docs/v1/labs.md`](../labs.md). **139** receipt: [`124-126-123-139-ui-wedge-20260614.md`](../../receipts/staging/124-126-123-139-ui-wedge-20260614.md).

### 4 — Public story audit

| Artifact | Ship-tier claims only? |
|----------|:----------------------:|
| [`README.md`](../../../README.md) | ☐ |
| [`RELEASE_CHECKLIST.md`](../../../RELEASE_CHECKLIST.md) Ship table | ☐ |
| [`CLAIMS_AUDIT.md`](../../../CLAIMS_AUDIT.md) | ☐ |
| Demo MP4 (`demo/out/otto-v01-desktop-walkthrough.mp4` / release asset) | ☐ |

**Forbidden as shipped:** live Discord bot, Otto Cloud sync, always-on cloud, Paperclip write integration. Grep sanity:

```sh
rg -i "discord bot|cloud sync|always.on|paperclip" README.md RELEASE_CHECKLIST.md
```

### 5 — Verdict (Sebastian only)

Fill [`sebastian-release-approval-template.md`](../../receipts/staging/sebastian-release-approval-template.md) → save as `sebastian-release-approval-v013-YYYYMMDD.md`.

| Decision | Approve? |
|----------|:--------:|
| Merge integration branch to `main` | ☐ |
| Tag **`v0.1.3`** on `otto-haus/otto` | ☐ |
| Promote build to live `/Applications/otto.app` | ☐ (default **no**) |
| Marketing apex `otto.haus` | ☐ (default **no** — 141/065) |

Until all required rows are checked **and** the approval receipt is signed:

```txt
NOT PUSHED — v0.1.3 gate open. No tag. No main merge. No live app.
```

---

## Append to 063 gate packet

After ceremony, update [`063-sebastian-gate-packet-v03-20260614.md`](../../receipts/staging/063-sebastian-gate-packet-v03-20260614.md) with:

- Link to filled approval receipt
- Sebastian initials + date on `ship-tier-matrix.md` **Sebastian ack** row
- Explicit NOT PUSHED / PUSHED status line

---

## Honest gaps (do not fake pass)

From **138** staging log and matrix reopen list — closure tracked in ticket **138**, not this ceremony alone:

- **076** fresh-Mac embedded Letta bundle (clean machine proof open)
- **071–073** onboarding dock / receipt visual proof
- Culture CI demo (**135**) not re-run every session
- `otto-staging-onboarding-smoke.cjs`, `rev8`, `two-thread` — not all re-run 2026-06-14 session
- Live `/Applications/otto.app` intentionally lags staging

See [`planning/hq-tickets/138-ship-tier-core-path-proof.md`](../../../planning/hq-tickets/138-ship-tier-core-path-proof.md) staging proof log.
