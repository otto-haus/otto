# Otto v0.1 — Feature Demos

Ten short (~40–55s) Remotion videos — eight core features plus dedicated curation and tickets clips (064). Each shows the feature using real
command names, specs, file paths, and — for Practices and Desktop — actual captured output,
then ends on an honest **Built / Tested / Tried / Approved** status card.

## Product demo (OpenAI-inspired cut)

**Composition:** `OttoProductDemo` (~54s hero product story for X/website — distinct from per-feature clips and launch trailer).

Storyboard: [`docs/product-demo-storyboard.md`](docs/product-demo-storyboard.md)

```sh
cd demo
bun install
bun run studio                     # select OttoProductDemo
bunx remotion render src/index.ts OttoProductDemo out/otto-product-demo.mp4
```

## Render locally

```sh
cd demo
bun install
bash render-all.sh                 # all ten (+ walkthrough)
# or one:
bunx remotion render src/index.ts OttoV01Charter out/otto-v01-charter.mp4
bun run studio                     # interactive preview
```

Videos are written to `demo/out/*.mp4` (gitignored — large binaries; hosting decided at push
time). Desktop symlinks to the latest renders are created at `~/Desktop/otto-v01-*.mp4`.

## Honesty note

The terminal scenes are **faithful re-enactments** using the real command names, file paths,
and specs — Practices and Desktop embed actual captured output. They are **not** live screen
captures. **Tried** and **Approved** stay unchecked until Sebastian runs each feature and
signs off. A demo never marks a feature Shipped.

## v0.3 staging refresh (064)

Re-render after staging UI changes (Command Station strip, Checks surface, thread switcher):

```sh
# From repo root — wrapper writes receipt under receipts/otto-v01/
bash scripts/render-demo-clips.sh OttoV01DesktopWalkthrough

# Or directly in demo/
cd demo
bun install
bunx remotion render src/index.ts OttoV01DesktopWalkthrough out/otto-v01-desktop-walkthrough.mp4
```

**Latest render (2026-06-14):**

```txt
Output:  demo/out/otto-v01-desktop-walkthrough.mp4  (~3.1 MB)
Receipt: receipts/otto-v01/demo-render-20260614T063531Z.md
Command: bash scripts/render-demo-clips.sh OttoV01DesktopWalkthrough
```

Other compositions: `OttoV01Curation`, `OttoV01Tickets`, `OttoV01Channels`, `OttoV01FieldNote`, `OttoV01Charter`, `OttoV01Practices`, or `all` (see `bash scripts/render-demo-clips.sh --help`).

**Curation + tickets (2026-06-14 rev10):**

```txt
Output:  demo/out/otto-v01-curation.mp4   (~1.6 MB)
Output:  demo/out/otto-v01-tickets.mp4    (~1.6 MB)
Receipt: receipts/otto-v01/demo-render-20260614T073931Z.md (curation)
Receipt: receipts/otto-v01/demo-render-20260614T073944Z.md (tickets)
Command: bash scripts/render-demo-clips.sh OttoV01Curation|OttoV01Tickets
```

Walkthrough composition should reflect current chat header and system surfaces — not pre-craft shell. Outputs stay in `demo/out/` (gitignored).

## Index

**These demos are NOT equally shippable.** Each video carries its own v0.1 status badge —
**ship candidate** / **proposed** / **deferred (Built, not Shipped)** — on its title and status
cards. The cutline is in [`../SPEC_COMPLIANCE.md`](../SPEC_COMPLIANCE.md). Curation has a dedicated **proposed** clip (not v0.1 ship cutline). Tried + Approved stay unchecked until Sebastian signs off.

| # | Feature | v0.1 | Video | What it proves | What it does NOT prove |
|---|---------|:--:|-------|----------------|------------------------|
| 1 | Practices | **ship** | `out/otto-v01-practices.mp4` | 5 Practice specs validate; hard approval floor (real CLI output) | That the 4 draft practices are fully implemented |
| 2 | Skills | **ship** | `out/otto-v01-skills.mp4` | Skills are loadable workflow + context packages | Coverage beyond charter/routine; live `/reload` load |
| 3 | Charter | proposed | `out/otto-v01-charter.mp4` | Intent → contract → gated run; **the permission gate is live** | Automated AC-by-AC auditing; a live-captured session |
| 4 | Routines | proposed | `out/otto-v01-routines.mp4` | Routines bundle Practices; recurring activation needs approval | That a recurring scheduler runs (deferred) |
| 5 | Standards | proposed | `out/otto-v01-standards.mp4` | Human-ratified canon + precedents; can block via review | Automated enforcement (manual review only) |
| 6 | Desktop | proposed | `out/otto-v01-desktop.mp4` | The workspace shell + file-backed Practices | A wired chat or live runtime (preview only) |
| 7 | Autonomy | **deferred** | `out/otto-v01-autonomy.mp4` | The three-zone model + Ticketcraft *spec* | That `/ticket` runs or workers are orchestrated |
| 8 | Knowledge | **deferred** | `out/otto-v01-knowledge.mp4` | A *proposed* AI-frontier surface, clearly marked | Verified ratings or active routing |
| 9 | Curation | **proposed** | `out/otto-v01-curation.mp4` | Inbox → ratify → standard/practice loop (re-enactment) | Live curation surface wired in desktop |
| 10 | Tickets | **ship** (spec) | `out/otto-v01-tickets.mp4` | Ticketcraft command vocabulary + autonomy gate | Live `/ticket` orchestration |
