# Hosted / managed otto — product brief

**Status:** proposed (2026-06-15)  
**Issue:** [#327](https://github.com/otto-haus/otto/issues/327)  
**Architecture follow-up:** [#328](https://github.com/otto-haus/otto/issues/328)  
**Related specs:** `otto-web-spec.md`, `agent-control-plane-spec.md`

---

## One sentence

**Hosted otto** is the always-on **control plane and visibility layer** for a single operator's agent — receipts, pending approvals, runner health, and schedule truth — while **Letta Cloud** keeps agent memory, tool execution, and provider credentials.

```txt
Desktop otto     = primary command station (local Letta, full repo/tools)
Hosted otto      = away-from-desk visibility + cloud-side governance records
Letta Cloud      = agent memory, schedules, channels, remote env broker
Optional VM      = long-lived `letta server` when tools/files must run while laptop is closed
```

---

## What hosted otto promises beyond desktop

| Desktop today | Hosted adds |
|---------------|-------------|
| Works only while the Mac is awake and app is open | Operator can **see state from phone/browser** without SSH |
| Receipts and approvals live on disk | **Indexed cloud ledger** (read-first) with honest sync, not a second canon |
| Runner status is local-only | **Heartbeat + stale-runner signal** when `otto-cloud` env disconnects |
| Letta cron truth is implicit | **Explicit schedule visibility** — will the 9am job fire? |
| Discord/approval routing is local | **Webhook bridge** for away-mode approval nudges (when enabled) |

Hosted otto does **not** promise a second agent brain, a team workspace, or autonomous shipping without human ratification.

---

## First customer

**Sebastian** — single operator, single primary agent, personal always-on use.

Teams, agencies, prosumers, and enterprise are **explicitly deferred** until WorkOS org auth and multi-tenant canon boundaries exist. The first hosted cut optimizes for one tenant, one agent, one honest control plane — not a generic SaaS signup funnel.

---

## First hosted use case (selected)

**Away-from-desk operator visibility**

> Close the laptop. Open otto web. See last receipt, pending approval, whether the `otto-cloud` remote env is connected, and whether the morning Letta cron will actually fire — without four logins and without otto pretending it owns Letta memory.

Success is **read-mostly truth + approval routing**, not full desktop parity in the browser.

---

## Local-only vs cloud-managed

| Concern | Stays local-first | Cloud-managed (hosted cut) |
|---------|-------------------|----------------------------|
| **Agent memory / conversation** | Letta Cloud SoR; desktop is primary editor while at desk | Read proxy + links; no otto memory broker |
| **Provider / API keys** | Letta Cloud / OS keychain only | Boolean capability flags only; **otto never stores provider secrets** |
| **Repo / filesystem / tools** | Local embedded Letta or optional VM runner | VM runner optional; no Workers-side coding agent |
| **Standards / Practices / Routines / canon** | Disk under `~/.otto/` remains truth | Mirror/index for visibility; **no silent cloud merge** |
| **Receipts / proposals / approvals** | Authoritative on disk until sync | D1 index + R2 artifacts; sync is operator-initiated or receipt-backed |
| **Done / merge / deploy gates** | Human (Sebastian) on desktop | Same gates; cloud records decisions, does not bypass them |
| **Paperclip / external work-state** | Read-first adapter | Import for visibility; writes only through approved otto commands |

**Conflict rule:** folder and ticket state on disk remain truth until an explicit sync contract ships ([#329](https://github.com/otto-haus/otto/issues/329)).

---

## Trust / privacy model (draft)

### Authority split

| Layer | Owns | Must not own |
|-------|------|--------------|
| **Otto hosted (CF)** | Product UI/API, approval records, receipt index, notification routing, audit export | Agent memory, tool execution, provider secrets |
| **Letta Cloud** | Agent identity, memory, schedules, channels, remote env broker, BYOK | Otto canon, Done gates, billing (initially) |
| **Remote VM (optional)** | `letta server`, filesystem, repo checkout | Public ingress (outbound WS to Letta only) |

### Boundaries by asset class

| Asset | Trust rule |
|-------|------------|
| **Memory** | Letta Cloud is system of record. Otto displays and links; never re-hosts raw provider payloads in product UI without operator action. |
| **Files / repos** | Stay on operator machine or scoped VM volume. Cloud stores receipt metadata and artifact pointers — not arbitrary repo mirrors. |
| **Tools** | Execute on local or VM runner under Letta remote env. Cloud Workers coordinate only; they do not run agent tool loops. |
| **Credentials** | Provider auth lives in Letta/keychain. Otto Cloud stores otto API keys and webhook HMAC in CF Secrets Store — never customer model keys. |
| **Approvals** | One gate semantics everywhere (desktop + cloud + Letta HITL). Irreversible actions require explicit decision + receipt. Cloud does not auto-approve. |

### Privacy posture (v1 hosted)

- Single-tenant schema; no multi-customer data mixing in cut one.
- Admin UI behind Cloudflare Access (or equivalent) until WorkOS ([#103](https://github.com/otto-haus/otto/issues/103) / ticket 088).
- All inbound webhooks signature-verified.
- Audit export produces an operator bundle **without secrets** — not a dump of Letta memory.
- Sync is opt-in and receipt-backed; no silent canon merge from cloud to desktop.

---

## Non-goals — first hosted cut

Do **not** ship in cut one:

- Multi-user SaaS, org RBAC, or self-serve signup
- otto storing provider API keys or replacing Letta auth
- Full Standards/Charter editor in the browser
- Paperclip embed or write replacement
- Running `letta server` on Cloudflare Workers
- Bi-directional sync without an explicit contract ([#329](https://github.com/otto-haus/otto/issues/329))
- Multi-tenant billing, uptime SLA, or guaranteed task completion
- Second primary agent without advanced isolation policy ([#107](https://github.com/otto-haus/otto/issues/107))
- Live Discord bot or always-on cloud stack marked **Cut** in ship tier matrix

---

## Migration path: desktop → hosted

1. **Continue on desktop** — embedded/local Letta remains default; no forced cloud migration.
2. **Connect Letta Cloud** — same agent identity; enable remote env when away-mode tools are needed ([#330](https://github.com/otto-haus/otto/issues/330)).
3. **Enable hosted visibility** — CF shell + read APIs for receipts, approvals, runner status ([#328](https://github.com/otto-haus/otto/issues/328)).
4. **Opt into sync** — push receipts/proposals to cloud index; pull cloud approval decisions through existing `ProposalStore` rules ([#329](https://github.com/otto-haus/otto/issues/329)).
5. **Optional VM runner** — deploy `letta server --env-name otto-cloud` when hosted sandboxes are insufficient for repo/tools.
6. **Later: teams** — WorkOS + tenant RBAC only after single-operator hosted cut is proven.

Rollback: disable cloud sync and remote env; desktop disk state remains authoritative.

---

## Architecture tickets (open)

| Issue | Scope |
|-------|-------|
| [#328](https://github.com/otto-haus/otto/issues/328) | Hosted architecture doc — workspace model, session model, local↔cloud split, deployment envs |
| [#329](https://github.com/otto-haus/otto/issues/329) | Cloud sync contract — conversations, memory, settings, receipts |
| [#330](https://github.com/otto-haus/otto/issues/330) | Managed cloud runtimes — execution boundary, VM template, runner leases |
| [#331](https://github.com/otto-haus/otto/issues/331) | Health, monitoring, support diagnostics — heartbeat, stale runner, audit export |

**Existing runtime foundation (not reopened here):** [#94](https://github.com/otto-haus/otto/issues/94) embedded Letta, `docs/v1/otto-web-spec.md`, `docs/v1/agent-control-plane-spec.md`.

---

## Done test

Sebastian accepts hosted cut one when the away-from-desk use case works with proof: cloud UI shows honest empty or live state (no mock ops data), pending approval visible, runner heartbeat accurate, and no provider secrets in otto Cloud storage.
