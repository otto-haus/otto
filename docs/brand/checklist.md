# Otto brand checklist (065 visual review)

Source canon: `~/Library/CloudStorage/Dropbox/This Cycle/otto/Brand Style Guide.html`

Review against local marketing site at `site/` (staging receipt captures).

| Check | Criterion | Pass/Fail | Evidence |
|-------|-----------|-----------|----------|
| B1 | Warm paper background (`#f8f7f2` family), not cold gray/white | **pass** | `site/style.css` `--bg: #f8f7f2` |
| B2 | Ink primary text (`#14161a`), not pure black | **pass** | `--ink: #14161a` |
| B3 | Inter sans + IBM Plex Mono (labels/eyebrows) | **pass** | Google Fonts import in `style.css` |
| B4 | Lowercase wordmark `otto` in nav | **pass** | `site/index.html` `.wordmark` |
| B5 | Owl avatar as primary mark (not line-drawn legacy owl) | **pass** | `site/brand/otto-avatar.png` in hero + topbar |
| B6 | Ink action buttons — no default blue links | **pass** | `.btn` uses `--ink` / `--dark`, not `#0066cc` |
| B7 | Boundary pill: human ratifies · otto records proof | **pass** | hero `.boundary__text` |
| B8 | Letta remembers · Otto improves · files are truth | **pass** | hero h1 + hero-card |
| B9 | No fake connected product dashboard | **pass** | static preview labeled; no mock runtime |
| B10 | Responsive viewport meta for phone width | **pass** | `<meta name="viewport" …>` |
| B11 | Phone layout readable at 390px (no horizontal scroll) | **pass** | `docs/receipts/staging/065-home-390-20260614073956.png` — no horizontal overflow at 390×844 |
| B12 | Pricing page matches same token system | **pass** | `docs/receipts/staging/115-pricing-390-20260614073956.png` — same CSS tokens as home |

**Overall (rev10):** **pass** on B1–B12 (token/copy + phone-width visual review).

Honest gaps: apex DNS not deployed; Lighthouse a11y **0.95** at `/tmp/otto-lh-065.json` (local deploy only).
