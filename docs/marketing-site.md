# Otto marketing site runbook

Static public surface at `site/` — no backend, no mock product API.

## Local preview

```sh
cd /Users/seb/Code/otto
./site/dev.sh
```

Opens `http://127.0.0.1:4321/` (override port with `OTTO_SITE_PORT`).

Alternative:

```sh
bunx --bun serve site -l 4321
```

## Structure

```txt
site/
  index.html      hero, behavior loop, CTAs
  style.css       brand tokens (warm paper / ink)
  brand/          owl avatar + desktop preview assets
  dev.sh          local static server helper
```

## Deploy (staging first)

**Local staging checks (no DNS):**

```sh
bash site/deploy-staging.sh   # curl + copy checks; receipt in docs/receipts/staging/
./site/dev.sh                 # interactive preview on :4321
```

**Cloudflare Pages (project `otto-haus`, account joinnova):**

```sh
bash site/deploy-pages.sh              # production branch main
OTTO_PAGES_BRANCH=ship/functional-labs bash site/deploy-pages.sh   # preview branch only
```

- Static root: `site/` — no build command
- Default URL: `https://otto-haus.pages.dev`
- **Apex `otto.haus`:** attach custom domain on **Pages → otto-haus**, not on a Worker. If status is `pending` / “CNAME record not set” and the zone is already on Cloudflare, open the domain in the dashboard and choose **Activate domain** (or **Complete setup**) so Cloudflare writes the apex record. Remove any leftover Worker custom domain first.
- Optional staging subdomain: `staging.otto.haus` when approved

**GitHub Pages / Render static**

Same artifact: upload `site/` contents only.

## Update checklist

1. Edit `site/index.html` + `site/style.css` only (keep claims honest — see `AGENTS.md`)
2. Run `./site/dev.sh` and spot-check phone width
3. Confirm no fake “connected” product screenshots unless labeled preview
4. Link status from `README.md` / `RELEASE_CHECKLIST.md` (*preview* vs *live*)

## Claim boundary

Must say: Letta remembers · Otto improves · files are truth · human ratifies.

Must not say: Otto replaces Letta memory; fully autonomous without ratification; fake operational data.

## Verification

```sh
cd /Users/seb/Code/otto
./site/dev.sh
# curl -I http://127.0.0.1:4321/
```
