# 127 — Command Station: Culture Home

Owner: Claude
Priority: P2
Depends on: 059, 121, 122, 124
Release bucket: category wedge — culture compounding

## Outcome

**059** Command Station becomes the **culture home** — not a generic ops dashboard. Primary cards surface **how the agent behaves** and **what proof exists**, not task throughput.

## Why this matters (category)

Without a culture home, wedge features (**121–122, 124–126**) scatter across panes. Users revert to “chat app with settings.”

Command Station answers: **What does my agent believe? What changed? What needs my judgment? What was proven?**

## Scope

Extend **059** dashboard with culture-first card row (real store data only):

| Card | Source ticket | Content |
|------|---------------|---------|
| **Constitution** | **122** | Link + last-amended; forbidden-actions count |
| **Behavior Changelog** | **121** | Last 3 culture changes (or “none this week”) |
| **Latest proof** | **124** | Latest receipt with authority + status |
| **Needs ratification** | **016** | Pending Curation count (existing **059** scope) |
| **Doors** | **045** | Permission/curation doors awaiting approval |

- Culture cards **above** ticket/worker throughput cards
- Empty states honest — no mock KPIs
- Drill-through links to Constitution file, Changelog pane, Receipts, Curation

## Relationship to **059**

- **059** ships thin dashboard shell + ops cards
- **127** adds culture-home layout and wires wedge cards
- May land as follow-on PR to **059** or expand **059** done-when — ticket tracks culture-home acceptance separately

## Non-goals

- Analytics charts
- Letta memory browser (**047** stays separate)
- Paperclip task wall

## Done when

- [ ] Staging: culture cards visible with real or empty data
- [ ] Constitution + changelog + latest receipt reachable in one click from home
- [ ] Screenshot receipt
- [ ] Reviewer +1

## Verification

```sh
bun run --cwd apps/desktop typecheck
# manual: Command Station shows culture card row; empty week → honest copy
```

## Blocker log

Leave blank unless blocked.
