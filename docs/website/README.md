# otto marketing site

Static marketing site served from `site/` (Cloudflare Pages root = `site/`).

## Information architecture

| Page | Path | Purpose |
|------|------|---------|
| Home | `/` (`index.html`) | Product story: compound loop, teach-once flow, boundary, install, honest status |
| Pricing | `/pricing.html` | Managed private pilot offer — not self-serve SaaS |

### Home anchors

- `#compound` — compound behavior loop (correction → … → better next action)
- `#install` — agent-first install paths

### Shared nav (topbar)

How it works · Install · Pricing · Docs · GitHub

## Copy direction

- Lead with the failure mode: agents repeat corrected mistakes.
- North star line: **otto makes agent behavior compound**.
- Boundary pill on hero: *The human ratifies. otto records the proof.*
- Receipt block on home is labeled **illustrative example — not live data**.
- Status pills stay honest (shipped / proposed / next) — no mock operational data.
- Product name is `otto` lowercase unless grammar forces otherwise.

## Design system

- Shared stylesheet: `site/style.css`
- Fonts: Inter (UI) + IBM Plex Mono (labels, code)
- Paper background: `#f8f7f2` (`theme-color` on both pages)
- Tokens: `--ink`, `--mut`, `--faint`, `--line`, `--dark` — no teal accent fork
- Favicon: `brand/otto-avatar.png` (`owl.png` symlink for backwards compat)

## SEO

- `robots.txt` — allow all, sitemap pointer
- `sitemap.xml` — `/` and `/pricing.html`
- Canonical tags on both HTML pages

## Deploy notes

**Do not deploy from agent sessions without Sebastian approval.**

Local verify:

```sh
bash site/deploy-staging.sh
# serves site/ on OTTO_SITE_PORT (default 4321)
```

Production (when approved):

```sh
bash site/deploy-pages.sh
```

Cloudflare Pages project root = `site/`, no build step. Apex DNS gate is human-owned.
