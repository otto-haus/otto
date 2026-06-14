# otto design canon (public)

Product-facing design docs safe to ship in the open repo.

| File | Role |
|------|------|
| `brand-style-guide.html` | Tokens, typography, voice, motion (§09), preview/Labs (§10) |
| `onboarding.md` | First-run journey — copy, gates, sample receipt; **Veto style reference (voice, not content)** |
| `settings.md` | Settings tabs + sections — same style-vs-content rule as onboarding |
| `motion-section.html` | Standalone §09 Motion (also in brand guide) |
| `icons/` | Reference line SVGs + `preview.html` (shipped app uses `apps/desktop/src/components/icon-art.ts`) |

## Not in git (local / Dropbox only)

Icon **generation** artifacts stay private: gpt-image-2 prompt pack, raw PNG masters, trace tooling inputs. Regenerate traced icons with `OTTO_ICON_DIR` pointing at your local `iconography/` folder when needed.

## Related

- `docs/brand/checklist.md` — marketing site review vs brand guide
- `docs/v1/ship-tier-matrix.md` · `docs/v1/labs.md` — Ship / Labs lexicon
- `apps/desktop/src/copy/surfaces.ts` — in-app copy
