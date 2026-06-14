# Sebastian release approval receipt — template

**Status:** `TEMPLATE` — copy to `sebastian-release-approval-v013-YYYYMMDD.md` and fill at sign-off.

```txt
NOT PUSHED until Status below reads APPROVED and Sebastian signs.
```

---

## Release metadata

| Field | Value |
|-------|--------|
| Target tag | `v0.1.3` (hold until signed) |
| Branch | `ship/functional-labs` @ `<commit>` |
| Ceremony runbook | `docs/v1/runbooks/sebastian-release-sign-off.md` |
| Gate packet | `docs/receipts/staging/063-sebastian-gate-packet-v03-20260614.md` |
| Matrix | `docs/v1/ship-tier-matrix.md` |

---

## Automated gates

| Gate | Date | Result | Notes |
|------|------|--------|-------|
| `bun run verify:v0` | | ☐ pass / ☐ fail | |
| `bash scripts/release-gate.sh` | | ☐ pass / ☐ fail | |

---

## Staging proof (Ship tier, Labs off)

| Check | Receipt / evidence | Pass |
|-------|-------------------|:----:|
| Staging deploy | `/Applications/otto-staging.app`, CDP 9445 | ☐ |
| Ship sidebar walk | | ☐ |
| Labs off — Knowledge/Channels coming soon | | ☐ |
| Chat real turn | `onboarding-smoke-*.json` or manual note | ☐ |
| Culture CI demo (135) | `docs/v1/demo-culture-ci.md` | ☐ |
| Hygiene bundle (138) | `staging-hygiene-proof-*.json` | ☐ |
| Two-thread smoke (046) | `two-thread-smoke-*.json` | ☐ |
| Embedded bootstrap (076) | `staging-076-bootstrap-proof-*.json` | ☐ |

---

## Labs spot-check (Labs on)

| Check | Pass |
|-------|:----:|
| Master Labs on + one feature enabled | ☐ |
| Knowledge/Channels honest blocked/ready state | ☐ |

**139 receipt:** `docs/receipts/staging/124-126-123-139-ui-wedge-20260614.md`

---

## Public claims audit

| Artifact | Ship-tier only | Reviewer |
|----------|:--------------:|----------|
| README.md | ☐ | |
| RELEASE_CHECKLIST.md | ☐ | |
| CLAIMS_AUDIT.md | ☐ | |

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

**Signature / initials:** __________ **Date:** __________

**Status:** `PENDING` | `DRY-RUN` | `APPROVED` | `DENIED`

---

## Verdict block (paste into 063 packet when complete)

```txt
Sebastian release sign-off: <APPROVED|DENIED> — <date>
Receipt: docs/receipts/staging/sebastian-release-approval-v013-YYYYMMDD.md
NOT PUSHED | PUSHED (main merge + tag only if APPROVED)
```
