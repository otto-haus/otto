# 081 — Chat Shell: Product Craft Polish

Owner: Claude
Priority: P1
Depends on: 033, 045
Release bucket: v0.1 polish

Label: Launch Polish

## Outcome

Chat shell matches **product** craft spec on staging — not dev/debug chrome left from early v0.1.

## Why this matters

Shipped-vs-not audit (6/14): live `/Applications/otto.app` still shows dev UI (`MemFS on`, `cli: override`, CONNECTED pill, model pickers below input, stock send). Source/staging have newer `LiveChat` — this ticket closes the gap and locks acceptance criteria.

## Scope

- Session header: human subtitle (`GPT-5.x · Letta memory on/off`) — no raw agent id in happy path
- Remove dev footer: `cli:`, tool counts, session id dump (debug mode behind Settings flag optional)
- Composer: model/provider controls integrated per craft (not orphaned below fold)
- Working state: “otto is working” pulse during turn (not fake CONNECTED pill)
- Error/retry states per 003 — no regression
- Deploy proof on **staging only** — never smoke `conversation=default`

## Non-goals

- Multi-thread list (046)
- Permission modal (045) — coordinate only
- Memory read surface (047)

## Done when

- [ ] Staging screenshots at 1280px match craft checklist (before/after)
- [ ] No `cli:` or `MemFS on` strings in default connected Chat
- [ ] `task refresh` / deploy script documented for closing live app gap (063 gate)
- [ ] Reviewer +1

## Verification

```sh
bash apps/desktop/scripts/deploy-staging.sh
bun run --cwd apps/desktop typecheck
# browser-proof or manual staging captures
```

## Blocker log

Leave blank unless blocked.
