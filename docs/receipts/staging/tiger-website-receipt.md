# tiger-website — converged marketing site receipt

## Before

- `index.html` used inline Fraunces/Geist Mono styles (~700 lines embedded CSS) on warm paper `#f6f1e6` with teal accents.
- `pricing.html` already used shared `style.css` (Inter + IBM Plex, `#f8f7f2`) but nav linked `index.html#loop`.
- No `robots.txt`, `sitemap.xml`, or canonical tags.
- Favicon split: home `owl.png`, pricing `brand/otto-avatar.png`.

## After

- Both pages share `site/style.css` — Inter + IBM Plex Mono, paper `#f8f7f2`, ink/mut tokens (no teal).
- Home hero: compound H1 + subline + boundary pill + hero-grid (avatar + circular compound-loop SVG).
- Unified topbar nav: How it works (#compound) · Install · Pricing · Docs · GitHub.
- Sections preserved: compound loop, teach-once + illustrative receipt, boundary doors, install paths, status pills.
- SEO: `robots.txt`, `sitemap.xml`, canonical on `/` and `/pricing.html`, OG tags on pricing.
- Favicon: `brand/otto-avatar.png` everywhere; `owl.png` → symlink to avatar.

## Team debate (one line)

Tiger converged on one warm-paper design system and compound-loop IA instead of the Fraunces fork + split favicons.

## Deploy instructions

Local only (this receipt):

```sh
cd /path/to/otto
bash site/deploy-staging.sh
open http://127.0.0.1:4321/
```

Production requires Sebastian DNS/Pages approval — do not run `deploy-pages.sh` from agents.

## Verification

- [ ] `bash site/deploy-staging.sh` passes curl checks
- [ ] Mobile width: nav collapses non-CTA links; hero grid stacks
- [ ] Pricing nav `#compound` resolves on home
- [ ] Receipt labeled illustrative example
