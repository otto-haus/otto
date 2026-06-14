# 172 — README hero screenshot + autoplaying demo GIF

Owner: Claude
Priority: P2
Depends on: none
Release bucket: docs / appeal

## Outcome

The README hero shows a real screenshot of otto Desktop (linked to the demo video) instead
of a bare `.mp4` URL that renders as plain text. A new `## Demo` section embeds an
autoplaying GIF walkthrough. A visitor sees the product in the first screen and in motion —
no clicking a raw link.

## Why this matters

A bare release-asset video URL does not embed on GitHub; it renders as a naked link, which
looks unfinished and buries the demo. A hero image + an autoplaying GIF is the single
highest-leverage "earn a star in the first 3 seconds" change for a repo landing page —
especially now that otto.haus redirects straight here.

## Scope

- Replace the bare `otto-v01-desktop.mp4` line in the hero with a centered screenshot
  (`docs/assets/desktop-hero.png`) linked to the demo video, plus a "Watch the 45-second
  demo" caption.
- Add a `## Demo` section with an autoplaying GIF (`docs/assets/desktop-demo.gif`) and a
  link to the full-resolution video.
- Commit both assets under `docs/assets/`.

## Out of scope

- Any runtime / app code change
- Other README sections
- Replacing the release video itself

## Provenance / honesty

- Hero PNG is a real, committed otto Desktop screenshot (reused from
  `docs/receipts/staging/pr-28/desktop-curation.png`) — actual UI, honest early-stage framing.
- GIF is generated from the project's own `otto-v01-desktop.mp4` release asset (ffmpeg,
  900px / 10fps, two-pass palette), 1.6 MB.

## Done when

- Hero renders an image (not a link); image links to the demo video.
- `## Demo` GIF autoplays (GIFs loop by default on GitHub) and links to the video.
- Both asset paths resolve; GIF is animated (multi-frame).

## Verification

```sh
for p in docs/assets/desktop-hero.png docs/assets/desktop-demo.gif; do test -f "$p"; grep -q "$p" README.md; done
ffprobe -count_frames -select_streams v:0 -show_entries stream=nb_read_frames docs/assets/desktop-demo.gif   # 443 frames
```

Result: both assets present and referenced; GIF = 443 frames (animated); hero PNG 1040×720,
GIF 1.6 MB at 900×506.
