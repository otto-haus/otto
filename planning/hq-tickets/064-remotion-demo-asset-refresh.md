# 064 — Remotion + Demo Asset Refresh

Owner: Claude
Priority: P2
Depends on: 063, 033, 057
Release bucket: v0.1 release

## Outcome

Demo videos and Remotion compositions match **current staging UI** — not pre-craft shell.

## Why this matters

RELEASE_CHECKLIST admits demos are re-enactments; `demo/src/OttoV01DesktopWalkthrough.tsx` may be ahead of committed/pushed state.

## Scope

- Update Remotion walkthrough for Chat header, prompt layout, system surfaces
- Re-render `demo/out/` assets or document faithful capture process
- `demo/README.md` honesty labels (live vs re-enactment)
- Link demos in release checklist

## Out of scope

- Marketing site embed (065)
- Fake connected states

## Done when

- At least desktop + curation + tickets clips reflect staging
- No agent-local id in hero shots
- Receipt lists output file paths + render command

## Verification

```sh
cd /Users/seb/Code/otto/demo
# render commands per demo/README.md
```

## Blocker log

Leave blank unless blocked.
