# 073 — Bug: Onboarding Connect Dock UX Gaps

Owner: Claude
Priority: P2
Depends on: 069, 033
Release bucket: v0.1 polish

Label: Launch Polish

## Outcome

Connect / Run dock is **truthful, readable, and dismissible** on all desktop layouts — including narrow staging windows.

## Bugs / gaps (audit)

1. **No live blocker text** — dock generic copy; should surface `rt.status?.reason` / `code` when not ready (e.g. `no-agent`, `no-api-key`).
2. **No auto-complete** — first successful chat message during onboarding does not mark complete; dock persists until manual Done/Skip.
3. **Mobile/narrow overlap** — fixed `right:24 bottom:24` dock (z-index 100) may cover Chat composer on compact layout (`app--sidebar-compact`).
4. **No replay** — no Settings control to reset `otto.onboarded.v1` for support/debug (032 smoke relies on fresh profile hacks).

## Scope

- Connect dock shows live readiness snippet + link to Settings
- On first user message while onboarding active → auto `markOnboarded()` (coordinate with 070)
- Responsive dock: max-width, bottom safe inset, or collapse to top banner under 900px
- Settings → General: "Show onboarding again" (clears `otto.onboarded.v1` only)

## Done when

- [ ] Not-ready dock shows real `status.reason` (no fake connected)
- [ ] First chat send during onboarding dismisses dock permanently
- [ ] 900px-wide staging: Chat composer not obscured (screenshot)
- [ ] Settings reset control works + documented in ticket receipt
- [ ] Reviewer +1

## Verification

```sh
bun run --cwd apps/desktop typecheck
bash apps/desktop/scripts/deploy-staging.sh
# resize window ≤900px; verify dock + chat
```

## Blocker log

Leave blank unless blocked.
