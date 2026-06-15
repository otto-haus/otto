# README Remotion demo asset refresh

- **At:** 2026-06-14T19:44:00Z
- **Composition:** `OttoV01DesktopWalkthrough`
- **Branch:** `docs/remotion-readme-demo`

## Render

```sh
mkdir -p demo/public demo/out
cp .github/assets/otto-desktop.png demo/public/otto-desktop.png
cd demo
bunx remotion render src/index.ts OttoV01DesktopWalkthrough \
  out/otto-v01-desktop-walkthrough.mp4 \
  --props='{"hasScreenshot":true}'
```

| Artifact | Path | Size | Notes |
|----------|------|------|-------|
| MP4 | `demo/out/otto-v01-desktop-walkthrough.mp4` | 3,573,340 B (~3.4 MB) | 44.35 s @ 1920×1080 · gitignored |
| GIF | `docs/assets/desktop-demo.gif` | 1,844,237 B (~1.8 MB) | 900×506 · 10 fps · 443 frames |

## GIF generation

```sh
ffmpeg -y -i demo/out/otto-v01-desktop-walkthrough.mp4 \
  -vf "fps=10,scale=900:-1:flags=lanczos,palettegen=stats_mode=diff" -update 1 /tmp/otto-demo-palette.png
ffmpeg -y -i demo/out/otto-v01-desktop-walkthrough.mp4 -i /tmp/otto-demo-palette.png \
  -lavfi "fps=10,scale=900:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=5" \
  docs/assets/desktop-demo.gif
```

## README

- Hero still links to release asset `otto-v01-desktop.mp4`.
- GIF and caption updated: **44-second** duration, honest **Remotion re-enactment** link to `demo/README.md#honesty-note`.
- Hero PNG unchanged (`.github/assets/otto-desktop.png`); walkthrough used it via `hasScreenshot:true`.

## Release asset (Sebastian / merge follow-up)

MP4 is under 10 MB but stays off git (existing policy). Upload to GitHub release as `otto-v01-desktop.mp4`:

```sh
cp demo/out/otto-v01-desktop-walkthrough.mp4 /tmp/otto-v01-desktop.mp4
gh release upload v0.1.3 /tmp/otto-v01-desktop.mp4 -R otto-haus/otto --clobber
```

Verified prior asset workflow: `receipts/otto-v01/demo-release-asset-202606141532Z.md`.

## Not duplicated

- PR #525 (`OttoProductDemo`) — separate product cut; not README hero wiring.

## Honest scope

Faithful re-enactments using real command names, paths, and specs — **not** live screen capture. Tried/Approved pending Sebastian (`demo/README.md`).
