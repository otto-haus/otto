# Scout audit — otto README (2026-06-14)

Readonly pass: `README.md`, `SPEC_COMPLIANCE.md`, `docs/design/README.md`, `demo/README.md`, `.firecrawl/adaline-home.md`, PR [#525](https://github.com/otto-haus/otto/pull/525) (Remotion `OttoProductDemo`), issue [#577](https://github.com/otto-haus/otto/issues/577).

## 10-second skim (current)

**Works:** Strong tagline (“Define the culture your AI agents run on”), Letta/otto split is clear, Culture CI hook is differentiated, honest v0.1 language exists, badges for Discord + otto.haus stay visible.

**Fails:** Hero stacks screenshot + GIF + two MP4 links — three demos, one scroll. Install starts at line ~193 (after Status tables). ~377 lines; engineer bounces before CTA. Status/Ship/Labs tables duplicate `docs/v1/ship-tier-matrix.md`. “otto Desktop” section repeats Install. Internal release gate copy (`NOT PUSHED`, integration branch) reads like a changelog, not a welcome mat.

## 60-second understand (gaps)

| Gap | Evidence | Leverage |
|-----|----------|----------|
| No single hero demo | PNG + GIF + release MP4 all compete | **P0** — one screenshot + one walkthrough + honest caption |
| Demo honesty buried | GIF alt text long; no link to `demo/README.md` | **P0** — caption: Remotion re-enactment, not live capture |
| Install too late | Full path after Status/Roadmap | **P0** — Quick start after pitch (~line 40) |
| Overclaim risk | Curation row in concepts table; Culture CI “test suite” without curation spine cut in SPEC | **P1** — align table + CI copy with `SPEC_COMPLIANCE.md` |
| Duplication with otto.haus | Website = story; README = clone + run + contribute | **P1** — README points to site for narrative; keeps verify/repo map |
| Remotion PR uncoordinated | #525 adds `OttoProductDemo`; README still points at v0.1 release MP4 only | **P1** — link #525 + #577; swap hero when render lands |
| Competitor pattern | Adaline: hero + one CTA + trust row; Letta: npm one-liner + product blurb | **P2** — borrow skim→CTA arc, not their claims |

## Ranked improvements (leverage order)

1. **Hero contract** — One static screenshot (`.github/assets/otto-desktop.png`) + one primary motion asset (GIF or MP4) + subcaption linking `demo/README.md` and noting re-enactment. Drop redundant third link row.
2. **Quick start block** — `git clone` → `bun install` → `task electron` / `task staging` + Letta prerequisite in ≤15 lines; defer edge cases to `INSTALL_FOR_AGENTS.md`.
3. **Cut Status wall** — Replace Ship/Labs tables with 3-line honest summary + links to `ship-tier-matrix.md`, `labs.md`, `RELEASE_CHECKLIST.md`.
4. **Merge Desktop duplicate** — Fold `## otto Desktop` command list into Install/Verify; one command reference.
5. **Tighten Culture CI** — Keep example block; one paragraph on Checks; link `docs/v1/demo-culture-ci.md`.
6. **Coordinate Remotion** — README cites PR #525 `OttoProductDemo` as upcoming hero; do not re-implement Remotion in this PR.
7. **Core concepts table** — Keep but mark Curation as maturing; trim “Reference operating stack” to one line under tagline.
8. **Contributor path** — Single line: agents → `AGENTS.md` + `INSTALL_FOR_AGENTS.md`; humans → Install + `devex/`.

## Judge pre-checks (for receipt)

- Would a busy engineer star in 30s? **Only after** hero + quick start move up.
- Demo honesty preserved? **Requires** explicit re-enactment caption + `demo/README.md` link.
- No overclaim? **Requires** Curation/CI language matched to SPEC cutline.

## Out of scope (this PR)

- Rendering `OttoProductDemo` (#577) — stays on Remotion PR / Sebastian render.
- otto.haus marketing copy — README links out, does not mirror site sections.
- Changing demo compositions or GIF bytes unless caption-only.
