# 065 — Marketing Site: otto.haus (Basic)

Owner: Claude
Priority: P2
Depends on: 063
Release bucket: public surface

## Outcome

A **basic public marketing site** at `otto.haus` (or staging subdomain first) that matches Otto brand — not a values wiki, not a fake product dashboard.

Single-page or small multi-page: hero, behavior loop, Letta boundary, download/ GitHub CTA, honest v0.1 scope.

## Why this matters

Domain asset exists (`RELEASE_CHECKLIST.md`); one-pagers exist in Dropbox; no public story site yet. Needed for namespace approval and credible outbound.

## Source anchors (design canon)

- `~/Library/CloudStorage/Dropbox/This Cycle/otto/Brand Style Guide.html` — warm/ink, Inter + IBM Plex Mono, owl mark, lowercase wordmark
- `~/Library/CloudStorage/Dropbox/This Cycle/otto/otto-onboarding.md` — boundary copy: *The human ratifies. otto records the proof.*
- One-pagers: `This Cycle/otto/_Archive/onepagers/html/*.html` and June 2026 compressed pack
- Product rules: `AGENTS.md` — otto lowercase; owl avatar primary mark; no mock operational data
- Desktop tokens: `apps/desktop/src/styles.css` warm paper system (keep ink action, not blue)

## Architecture target

```txt
site/                    new static site in repo OR separate deploy target
  index.html             hero + loop diagram + CTA
  brand/                 copied owl assets (from docs/assets or Dropbox)
  style.css              tokens aligned with Brand Style Guide
```

Hosting (pick during implementation; document in ticket receipt):

- Static: Cloudflare Pages / GitHub Pages / Render static — **no backend required v1**
- Staging first: `staging.otto.haus` or preview URL before apex

## Content requirements

**Must say**

- Letta remembers · Otto improves · files are truth
- Behavior layer: Standards, Curation, Practices, Routines, Receipts
- Local-first v1; provider keys in Letta
- GitHub / download link when public repo approved

**Must not say**

- Otto replaces Letta memory
- Fully autonomous without human ratification
- Fake screenshots of connected state if product isn't public yet — use staging labeled *preview*

## Scope

- Implement static site from Brand Style Guide
- Hero with owl mark + one-line boundary pill
- Section per one-pager (compressed, not 12 pages of prose)
- Loop diagram: correction → proposal → ratify → receipt
- Footer: GitHub, docs link, license pointer
- `docs/marketing-site.md` deploy + update runbook
- Optional: link to Cognee as future Knowledge implementation (do not oversell)

## Out of scope

- Auth, accounts, blog CMS
- Product login / workspace in browser
- Veto marketing (separate brand)
- Auto-deploy to apex without Sebastian DNS approval

## Done when

- Site builds as static files with zero mock product backend
- Visual review against Brand Style Guide (screenshot diff or checklist)
- Lighthouse basic pass (a11y contrast, meta tags)
- Staging URL loads on phone width
- README or RELEASE_CHECKLIST links site status honestly (*preview / live*)
- Receipt: deploy command, URL, screenshot set

## Verification

```sh
cd /Users/seb/Code/otto
# after site/ exists:
# npx serve site  OR  documented deploy CLI
# curl -I https://staging.otto.haus  (when deployed)
```

## Blocker log

Leave blank unless blocked.
