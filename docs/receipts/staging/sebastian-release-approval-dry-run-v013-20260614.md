# Sebastian release approval receipt — dry-run (staging only)

**Status:** `DRY-RUN` — **not** Sebastian approval. Ceremony template exercise for ticket **142**.

```txt
NOT PUSHED — this file is a filled template example only.
```

---

## Release metadata

| Field | Value |
|-------|--------|
| Target tag | `v0.1.3` (hold until signed) |
| Branch | `ship/functional-labs` @ implementer HEAD (2026-06-14) |
| Ceremony runbook | `docs/v1/runbooks/sebastian-release-sign-off.md` |
| Gate packet | `docs/receipts/staging/063-sebastian-gate-packet-v03-20260614.md` |
| Matrix | `docs/v1/ship-tier-matrix.md` |

---

## Automated gates

| Gate | Date | Result | Notes |
|------|------|--------|-------|
| `bun run verify:v0` | 2026-06-14 | pass | 5/5, 208 unit tests |
| `bash scripts/release-gate.sh` | 2026-06-14 | pass | verify:v0 + electron:typecheck |

---

## Staging proof (Ship tier, Labs off)

| Check | Receipt / evidence | Pass |
|-------|-------------------|:----:|
| Staging deploy | `/Applications/otto-staging.app`, CDP 9445 | pass (prior session) |
| Ship sidebar walk | `staging-hygiene-proof-20260614143512.json` (049, 053–058) | pass (automated) |
| Labs off — Knowledge/Channels coming soon | **139** UI wedge receipt | pass (code + manual optional) |
| Chat real turn | not re-run this dry-run | **gap** |
| Culture CI demo (135) | not re-run this dry-run | **gap** |
| Hygiene bundle (138) | `staging-hygiene-proof-20260614143512.json` | pass |
| Two-thread smoke (046) | not re-run this dry-run | **gap** (unit tests green) |
| Embedded bootstrap (076) | prior `staging-076-bootstrap-proof-*.json` exist; not re-run | partial |

---

## Labs spot-check (Labs on)

| Check | Pass |
|-------|:----:|
| Master Labs on + one feature enabled | not run in dry-run |
| Knowledge/Channels honest blocked/ready state | not run in dry-run |

**139 receipt:** `docs/receipts/staging/124-126-123-139-ui-wedge-20260614.md`

---

## Public claims audit

| Artifact | Ship-tier only | Reviewer |
|----------|:--------------:|----------|
| README.md | updated in **140** — pending Sebastian | implementer |
| RELEASE_CHECKLIST.md | updated in **140** — pending Sebastian | implementer |
| CLAIMS_AUDIT.md | updated in **140** — pending Sebastian | implementer |

---

## Sebastian decisions

| Item | Approve? | Date |
|------|:--------:|------|
| Ship table matches staging experience (Labs off) | ☐ | |
| Merge to `main` | ☐ | |
| Tag `v0.1.3` | ☐ | |
| Promote to live `/Applications/otto.app` | ☐ deny default | |
| Marketing apex deploy | ☐ deny default | |

**Sebastian approves push + tag:** ☐ yes / ☐ no

**Signature / initials:** _(dry-run — unsigned)_

**Status:** `DRY-RUN`

---

## Verdict block (for 063 packet — when real sign-off happens)

```txt
Sebastian release sign-off: PENDING — dry-run 2026-06-14 only
Receipt: docs/receipts/staging/sebastian-release-approval-dry-run-v013-20260614.md
NOT PUSHED
```
