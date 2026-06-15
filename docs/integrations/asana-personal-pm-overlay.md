# Asana personal PM overlay — investigation (#347)

**Status:** accepted recommendation  
**Issue:** [#347](https://github.com/otto-haus/otto/issues/347)  
**Deciders:** Sebastian (personal PM); otto repo stays GitHub-canonical

---

## Verdict

| Layer | When | Recommendation |
|-------|------|----------------|
| Sebastian personal operating queue | **Now** | Use Asana as a **read-oriented dashboard** for weekly planning, due dates, and cross-repo rollup. GitHub remains canonical for all code work. |
| Native GitHub ↔ Asana link | **Now** | Use Asana’s official [GitHub app](https://asana.com/apps/github) for PR status on tasks you explicitly link. No custom otto code. |
| otto product / OSS integration | **Not now** | Do not add Asana UI, credentials, or write paths inside otto v1. v1 is local-only; PM overlays belong outside the desktop shell. |
| Dedicated sync actor (webhook → Asana API) | **Later** | Only if manual linking + native app still leaves stale mirrors or unacceptable ops cost. One-way GitHub → Asana only. |

**Summary:** Use Asana **now** for personal PM; keep GitHub as the only source of truth for issues, PRs, CI, merge gates, and receipts. Defer otto-native integration and automated sync until mirror drift is a measured problem.

---

## Source-of-truth boundary

```txt
GitHub (canonical — code + agent loop)
├── Issues: intake, priority (p0–p3), acceptance criteria
├── Pull requests: implementation, Fixes #N, review/merge gates
├── CI + labels: status: ready for review, in codex repair, etc.
├── Releases + receipts: docs/receipts/, staging proofs
└── Agents read/write here only for work state

Asana (personal overlay — planning + visibility)
├── Mirror or rollup of GitHub items Sebastian is tracking this week
├── Personal fields: due date, calendar block, “waiting on”, private notes
├── Optional PR status via linked GitHub app (downstream of GitHub)
└── Must never: close issues, merge PRs, change labels, or create competing ticket IDs
```

### Write rules

| Actor | GitHub | Asana |
|-------|--------|-------|
| Agents (Composer, Codex, Cursor) | Read/write per AGENTS.md | **No writes** |
| Sebastian | Issues, PRs, merge | Tasks, sections, due dates, personal notes |
| Sync (native app or future actor) | Read-only webhooks / polling | Create/update mirror tasks only |

If GitHub and Asana disagree, **GitHub wins**. Asana tasks are disposable mirrors; GitHub issue numbers are stable keys.

---

## Minimal Asana board schema

**Project name:** `otto — operating` (personal workspace; not shared OSS canon)

**Sections** (align with `docs/goals/github-ready-loop/goal.md` statuses):

| Section | Maps from GitHub |
|---------|------------------|
| Inbox | Untriaged personal captures; not yet filed as GitHub issues |
| Ready | Issue open + priority label + no blocking PR gate |
| In progress | Issue assigned / branch open, no merged PR |
| In review | Linked PR open; `status: ready for review` or repair |
| Blocked | Explicit blocker (collision, external dependency, human gate) |
| Done | Issue closed or PR merged |

**Required custom fields**

| Field | Type | Source |
|-------|------|--------|
| `GitHub issue` | URL or `#NNN` | Manual paste or future sync |
| `PR` | URL | From issue/PR link or GitHub app |
| `Priority` | Enum: p0, p1, p2, p3 | Copy from GitHub label |
| `Owner` | Person | Sebastian or agent lane name |
| `Release train` | Text | e.g. v0.3, staging gate — optional |
| `Blocked` | Checkbox + text | Personal rollup only |

**Task naming:** `[#NNN] <issue title>` so search and future sync stay deterministic.

**Out of scope for v1 board:** sprint points, team capacity, duplicate `planning/hq-tickets/` numbering, agent receipts as attachments (link to `docs/receipts/` in GitHub issue instead).

---

## Safest sync path and permissions

### Phase 0 — now (recommended)

1. Create the project and fields above manually.
2. Install [GitHub for Asana](https://asana.com/apps/github) on the personal Asana workspace.
3. For each active issue, create one Asana task and link from GitHub using Asana’s link comment pattern (task URL in issue body or comment).
4. Rely on the native app for **PR opened / merged / closed** activity on linked tasks only.

**Permissions**

| System | Scope | Holder |
|--------|-------|--------|
| GitHub `otto-haus/otto` | Read issues/PRs; app posts PR status to linked tasks | Asana GitHub app (org/repo install) |
| Asana | Create/edit tasks in personal project | Sebastian |
| Agents | GitHub token as today | No Asana token |

**Risks mitigated:** no duplicate intake (issues still created in GitHub only), no agent-side rate limits on Asana API, no OSS secret surface in otto.

### Phase 1 — later (only if Phase 0 drifts)

Single **private sync actor** (not in otto desktop):

- Trigger: GitHub webhooks (`issues`, `pull_request`, `check_run` filtered).
- Action: Upsert Asana task by `GitHub issue` key; move section from label/project status mapping.
- Direction: **GitHub → Asana only**; never open/close GitHub issues from Asana rules.
- Hosting: Sebastian-controlled cron or small worker outside OSS core (same boundary as private Paperclip desk — see `docs/v1/ship-tier-matrix.md` cut line for write integrations).

**Permissions for Phase 1**

| Credential | Access |
|------------|--------|
| GitHub PAT or GitHub App | Read repo + receive webhooks |
| Asana PAT | `tasks:write` on one project only |

**Rate limits:** Asana REST ~150 req/min per PAT; batch section moves; idempotent upsert by issue number.

### Anti-patterns (do not ship)

- Bi-directional sync (Asana status → GitHub labels).
- Agents calling Asana API during implement/repair loops.
- Asana as intake for bugs/polish (violates AGENTS.md — use GitHub Issues).
- Replacing GitHub Project V2 / labels with Asana sections for agent hot loops.

---

## Field mapping reference

| Concept | GitHub (canonical) | Asana (mirror) |
|---------|-------------------|----------------|
| Priority | Label `p0`…`p3` | Custom field |
| Status | Issue state + PR labels + project column | Section |
| Owner | Assignee / lane | Person field |
| Due date | Milestone (optional) | Date field |
| PR link | PR URL on issue | URL field + GitHub app activity |
| Release train | Milestone / runbook tag | Text field |
| Blocked | Comment + label | Checkbox + note |
| Receipt / proof | `docs/receipts/` in PR or issue | Link in GitHub issue only |

---

## Implementation tickets

**None created.** Investigation recommends personal use **now** via manual board + native GitHub app, and defers automated sync actor to **later**. No otto product work is justified until mirror drift is measured (e.g. >30% active issues out of sync for >2 weeks).

If Phase 1 becomes necessary, file a **private ops** issue (or external runbook) — not OSS — with acceptance: one-way webhook sync, idempotent issue key, no agent writes.

---

## Acceptance checklist (#347)

- [x] Recommend whether Asana should be used for otto now, later, or not at all.
- [x] Define source-of-truth boundary between GitHub and Asana.
- [x] Draft minimal board/schema for Asana.
- [x] Identify safest sync path and permissions.
- [x] Implementation tickets only if proceeding — none (defer automation).
