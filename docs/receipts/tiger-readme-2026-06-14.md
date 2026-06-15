# Tiger README — Judge receipt (2026-06-14)

**Branch:** `tiger-readme`  
**Scope:** `README.md` + `docs/goals/tiger-readme/*`  
**Coordination:** PR [#525](https://github.com/otto-haus/otto/pull/525) (Remotion `OttoProductDemo`), issue [#577](https://github.com/otto-haus/otto/issues/577) (full render)

## Verdict

**PASS** for merge consideration — pending Sebastian review (agents do not merge).

## Star-in-30s rubric

| Criterion | Before | After |
|-----------|--------|-------|
| Hook visible without scroll | Tagline yes; install no | Tagline + See it + Quick start above fold |
| One demo story | Screenshot + GIF + duplicate MP4 links | Screenshot + GIF + single caption row with honesty |
| CTA | Install ~line 193 | Quick start ~line 35 |
| Length | ~377 lines | ~210 lines |
| Honesty | Alt text only | Caption: Remotion re-enactment + `demo/README.md` + #525/#577 |
| Overclaim | Full Ship/Labs tables; Curation implied shipped | Status summary + SPEC links; Curation marked maturing |

**Would a busy engineer star it?** **Yes, with one caveat:** hero MP4 is still v0.1 walkthrough until #577 renders `OttoProductDemo`; README states that explicitly.

## Demo honesty

- Preserved: re-enactment language, link to `demo/README.md`, no mock ops data in README copy.
- Not changed: GIF/PNG bytes (Worker did not re-render assets).

## Overclaim check

- Culture CI framed as ratified Checks + human gate — aligned with SPEC (curation spine cut, Checks ship tier demo exists).
- Removed duplicate Ship/Labs tables; pointed at canonical docs.
- Letta/otto boundary unchanged.

## Merge guidance for Sebastian

1. **Optional first:** merge #525 if Remotion hero is wanted soon.
2. **Then:** merge tiger-readme README PR (rebase onto #525 if demo paths change).
3. **After #577 render:** swap hero links to `demo/out/otto-product-demo.mp4` or release asset; refresh GIF if desired.

## Verification

- Read diff against `origin/main` README.
- No unrelated files in commit.
- Scout audit: `docs/goals/tiger-readme/notes/scout-audit.md`.

**Judge:** tiger-readme-judge (standards lane)  
**Worker receipt path:** this file.
