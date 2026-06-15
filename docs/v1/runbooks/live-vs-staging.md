# Live vs Staging Deploy Runbook

Canonical operator contract for where Otto runs, how proof is deployed, and when the live app may be refreshed.

Related workflow: [`planning/hq-tickets/_workflow-run-ticket.md`](../../../planning/hq-tickets/_workflow-run-ticket.md)
Staging rules (source of truth): [`planning/hq-tickets/AGENTS.md`](../../../planning/hq-tickets/AGENTS.md)

## Three tiers

| Tier | Purpose | App / process | Who may run |
|------|---------|---------------|-------------|
| **Dev** | Fast iteration from repo | `task electron` → Vite + Electron dev shell | Implementers anytime |
| **Staging proof** | Build + runtime smoke without touching live | `/Applications/otto-staging.app` or admin bundle | Implementers for ticket proof |
| **Live refresh** | Sebastian's daily Otto | `/Applications/otto.app` | **Sebastian only** — never an agent default |

## Non-negotiable: live app is sacred

```txt
FORBIDDEN during ticket work / proof:
  - pkill, quit, replace, or rsync over /Applications/otto.app
  - verification that reuses ~/Library/Application Support/@otto-haus/desktop
  - any smoke that closes or relaunches the live app
```

Live `/Applications/otto.app` must stay open and untouched while agents implement or prove tickets.

## Tier 1 — Dev

Local reload against the repo. Uses your normal shell `HOME` and Letta discovery (`~/.letta/settings.json`).

```sh
cd /Users/seb/Code/otto
task electron
# equivalent:
# cd apps/desktop && env -u ELECTRON_RUN_AS_NODE bun run electron:dev
```

Use dev when changing UI/renderer quickly. Do **not** treat dev-only success as staging or live proof.

## Tier 2 — Staging proof

Staging deploys a packaged `.app` with **isolated runtime paths** so proof never collides with Sebastian's live profile.

### Primary deploy path

```sh
cd /Users/seb/Code/otto
task staging
# equivalent:
# bash apps/desktop/scripts/deploy-staging.sh
```

`task staging` refuses to replace `/Applications/otto-staging.app` unless `HEAD` matches `origin/main` (#314). Use a disposable `OTTO_STAGING_APP` path for branch previews.

### Latest-main refresh (#338)

Fetch `origin/main`, stamp source markers (channel, commit, origin/main, profile paths), and replace **only** `/Applications/otto-staging.app`:

```sh
cd /Users/seb/Code/otto
task staging:main
# equivalent:
# bash scripts/staging-refresh-from-main.sh
```

If your checkout HEAD is not `origin/main`, `task staging` and `task staging:main` refuse. To build exact main:

```sh
git checkout main && git merge --ff-only origin/main && task staging:main
```

Source marker smoke (after staging is running on CDP port 9445):

```sh
NODE_PATH=$HOME/.codex/admin/node_modules \
  OTTO_RECEIPT_DIR=$PWD/docs/receipts/staging \
  node scripts/otto-staging-source-marker-smoke.cjs
```

What it does (`apps/desktop/scripts/deploy-staging.sh`):

1. Builds + packages `apps/desktop/dist-app/mac-arm64/otto.app`
2. Replaces **only** `/Applications/otto-staging.app` (kills staging process if running — never live)
3. Stamps bundle id `haus.otto.desktop.staging`, display name `otto staging`
4. Sets isolated env in `LSEnvironment` and opens with a dedicated profile + debug port

### Isolated paths (defaults)

| Variable | Default path | Role |
|----------|--------------|------|
| `OTTO_STAGING_ROOT` | `$HOME/.codex/admin/otto-staging` | Root for all staging dirs |
| `HOME` (in bundle) | `$OTTO_STAGING_ROOT/home` | Fake home — not your real `~` |
| `OTTO_HOME` (in bundle) | `$OTTO_STAGING_ROOT/otto-home` | Otto data root |
| Electron profile | `$OTTO_STAGING_ROOT/profile` | `--user-data-dir` |
| Debug port | `9445` (`OTTO_STAGING_PORT`) | `--remote-debugging-port` |

Override deploy target only when documented:

```sh
OTTO_STAGING_APP=/path/to/custom.app bash apps/desktop/scripts/deploy-staging.sh
```

### Admin smoke bundle (alternate)

For disposable smoke without installing to `/Applications`:

```sh
/Users/seb/.codex/admin/otto-staging/launch-otto-staging-smoke.sh
# repo copy (same script):
# bash scripts/launch-otto-staging-smoke.sh
```

Admin bundle location: `$OTTO_STAGING_ROOT/otto-staging.app`  
Uses the same isolated `HOME`, `OTTO_HOME`, and profile under `$OTTO_STAGING_ROOT`.

Pass runtime overrides at launch time (boolean-safe — never log secret values):

```sh
OTTO_AGENT_ID=agent-… LETTA_BASE_URL=http://127.0.0.1:8283 \
  /Users/seb/.codex/admin/otto-staging/launch-otto-staging-smoke.sh
```

### Staging smoke rules

- Set `OTTO_SMOKE=1` (deploy script and smoke launcher do this automatically).
- **Never** use `conversation=default` in smoke — runtime refuses it when smoke mode is on.
- Do not call Electron **connected** unless Letta init succeeds (`ready: true` in runtime status).
- Record staging paths in every execution receipt that includes runtime or UI proof.

### Staging receipt (implementers)

Append to the ticket under `## Execution receipt`:

```txt
staging_app=/Applications/otto-staging.app   # or admin bundle path
home=$OTTO_STAGING_ROOT/home
otto_home=$OTTO_STAGING_ROOT/otto-home
profile=$OTTO_STAGING_ROOT/profile
port=9445
deploy_cmd=task staging
smoke_cmd=launch-otto-staging-smoke.sh
runtime_ready=true|false
build_marker=<git short SHA or bundle mtime>
```

## Tier 3 — Live install (release-only)

**Human gate.** `/Applications/otto.app` may only be installed from the **latest published GitHub Release desktop artifact** — never from a local branch build.

```sh
cd /Users/seb/Code/otto
OTTO_ALLOW_RELEASE_INSTALL=1 task install:release
# equivalent: bash scripts/install-otto-release.sh
```

Read-only metadata check (never mutates live app):

```sh
task smoke:release:metadata
# equivalent: node scripts/otto-release-metadata-check.mjs
```

Sebastian-only escape hatch if a desktop artifact is not published yet:

```sh
OTTO_ALLOW_LOCAL_LIVE_BUILD=1 OTTO_ALLOW_LIVE_REFRESH=1 task refresh:local
```

`task refresh` is **blocked** — it prints the canonical commands above.

Target: `/Applications/otto.app` only. Uses normal macOS profile (`~/Library/Application Support/@otto-haus/desktop`).

Agents must **not** run `task install:release`, `task refresh:local`, `task quit`, or `task smoke:desktop:live` unless Sebastian explicitly asks.

### Live install receipt (Sebastian or explicit approval)

```txt
live_app=/Applications/otto.app
install_cmd=OTTO_ALLOW_RELEASE_INSTALL=1 task install:release
release_tag=<GitHub tag>
asset=<downloaded artifact name>
sebastian_approved=yes
```

## Task aliases

| Task | Command |
|------|---------|
| `task electron` | Dev shell |
| `task staging` | Build + deploy `/Applications/otto-staging.app` |
| `task install:release` | Install live `/Applications/otto.app` from latest GitHub Release (gated) |
| `task smoke:release:metadata` | Read-only release tag vs installed app check |
| `task refresh:local` | Sebastian-only local branch build into live app (double-gated) |
| `task smoke:desktop` | Non-destructive second instance (temp dirs; live app untouched) |
| `task smoke:desktop:live` | **Dangerous** — quits/reopens live app |

There is no separate `task proof`; use `task staging` plus the smoke launcher for ticket runtime proof.

## Stale live app triage

Symptom: repo or staging shows a fix; Sebastian's live Otto does not.

```sh
# 1. Compare git HEAD to live bundle age
git -C /Users/seb/Code/otto rev-parse --short HEAD
stat -f '%Sm' -t '%Y-%m-%dT%H:%M:%S' /Applications/otto.app

# 2. Confirm staging has the expected build
task staging
stat -f '%Sm' -t '%Y-%m-%dT%H:%M:%S' /Applications/otto-staging.app

# 3. If staging is correct but live is old → live refresh needed (Sebastian)
# Do NOT refresh live from an agent ticket.
```

Checklist:

1. Is the change only in source (not packaged)? → need `task staging` or `task refresh`.
2. Is live bundle mtime older than the merge commit? → stale live; Sebastian runs `task refresh`.
3. Is Letta connected in staging but not live? → likely profile/config drift, not deploy — compare runtime settings, not just bundle age.
4. Did proof use dev (`task electron`) instead of staging? → re-run proof on staging bundle.

## Verification commands

```sh
test -f docs/v1/runbooks/live-vs-staging.md
task staging
/Users/seb/.codex/admin/otto-staging/launch-otto-staging-smoke.sh
# confirm output includes home=, otto_home=, profile=, port=
```
