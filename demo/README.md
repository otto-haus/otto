# Otto v0.1 — Feature Demos

Eight short (~40–55s) Remotion videos, one per feature. Each shows the feature using real
command names, specs, file paths, and — for Practices and Desktop — actual captured output,
then ends on an honest **Built / Tested / Tried / Approved** status card.

## Render locally

```sh
cd demo
bun install
bash render-all.sh                 # all eight
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

## Index

| # | Feature | Video | What it proves | What it does NOT prove | Approved |
|---|---------|-------|----------------|------------------------|:--------:|
| 1 | Charter | `out/otto-v01-charter.mp4` | Intent → contract → gated run → receipts; stops at one-way doors | That a live Sebastian-run session was captured | ☐ |
| 2 | Practices | `out/otto-v01-practices.mp4` | 5 Practice specs validate; hard approval floor (real CLI output) | That the 4 draft practices are fully implemented | ☐ |
| 3 | Routines | `out/otto-v01-routines.mp4` | Routines bundle Practices; recurring activation needs approval | That a recurring schedule has run in production | ☐ |
| 4 | Skills | `out/otto-v01-skills.mp4` | Skills are loadable workflow + context packages | Coverage beyond the charter / routine skills | ☐ |
| 5 | Standards | `out/otto-v01-standards.mp4` | Human-ratified canon + precedents can block fake done | That a review has blocked a real PR yet | ☐ |
| 6 | Autonomy / Ticketcraft | `out/otto-v01-autonomy-ticketcraft.mp4` | Three-zone model; Ticketcraft compiles bounded slices | A fully automated multi-worker run | ☐ |
| 7 | Desktop | `out/otto-v01-desktop.mp4` | The workspace builds and reads state from files (real build log) | A production-complete UI | ☐ |
| 8 | Knowledge | `out/otto-v01-knowledge.mp4` | A *proposed* AI-frontier Knowledge surface, clearly marked | Verified/benchmarked model ratings or active routing | ☐ |
