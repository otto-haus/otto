# Demo release asset — otto-v01-desktop.mp4

- **At:** 2026-06-14T15:32:26Z
- **Repo:** `otto-haus/otto`
- **Release:** `v0.1.3` (pre-release: *otto v0.1.3 (integration pre-release)*)
- **Source file:** `demo/out/otto-v01-desktop-walkthrough.mp4` (3,333,921 bytes)
- **Asset name on release:** `otto-v01-desktop.mp4`
- **Download (tagged):** https://github.com/otto-haus/otto/releases/download/v0.1.3/otto-v01-desktop.mp4
- **README `latest` URL:** still resolves to `v0.1.1` until Sebastian promotes `v0.1.3` — **no tag publish in this pass**

Verified locally:

```sh
gh release download v0.1.3 -R otto-haus/otto -p otto-v01-desktop.mp4 -D /tmp/otto-release-test
ls -la /tmp/otto-release-test/otto-v01-desktop.mp4
```

**Not done:** publish release, move `latest` pointer, or push new tags.
