# 080 — Onboarding: One-App Zero-Setup Path

Owner: Claude
Priority: P1
Depends on: 076, 069, 070, 071, 073
Release bucket: v0.1 polish

Label: Launch Polish

## Outcome

First-run onboarding matches **076 one-app** product: no “install Letta separately,” no `/reload`, no dev-path copy.

```txt
Download otto → open → connect provider (optional) → first message → receipt moment
```

## Why this matters

032/028 onboarding assumes external Letta setup. 069–073 fix bugs but not the **narrative**. After embedded runtime lands, onboarding must not lie.

## Scope

- Rewrite step copy in `Onboarding.tsx` for embedded-default path
- Remove references to installing Letta Desktop / manual CLI paths from primary journey
- Connect step uses **078** provider mirror (write-only) when key required
- Run step: first message unlocks Chat; sample Receipt per **071** (not “coming soon”)
- Advanced path link: “Use existing Letta installation” → Settings modes (076)
- Coordinate **073**: dock dismiss on first send; no overlap at narrow widths
- Coordinate **070**: step machine ignores stale `otto.chat.messages.v1`

## Non-goals

- Re-design entire craft motion spec (027)
- Embedded engine implementation (076)

## Done when

- [ ] Fresh profile + embedded 076: onboarding completes without external Letta install
- [ ] No “install Letta” in primary step text (advanced only in Settings)
- [ ] Step 4 shows real Receipt reference per 071
- [ ] Staging screenshots + reviewer +1

## Verification

```sh
bun run --cwd apps/desktop typecheck
bash apps/desktop/scripts/deploy-staging.sh
# OTTO_HOME=~/.otto-onboard-smoke … fresh profile walkthrough
```

## Blocker log

Leave blank unless blocked.
