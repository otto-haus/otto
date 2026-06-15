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

**Cloudflare Pages (project `otto-haus`):**

```sh
bash site/deploy-pages.sh              # preview for current git branch
OTTO_PAGES_DRY_RUN=1 bash site/deploy-pages.sh       # print command without deploying
OTTO_PAGES_BRANCH=main OTTO_PAGES_ALLOW_PRODUCTION=1 bash site/deploy-pages.sh
bash site/verify-domains.sh            # curl apex + www + pages.dev; writes receipt
```

- Static root: `site/` — no build command
- Default URL: `https://otto-haus.pages.dev`
- Custom domains: `otto.haus`, `www.otto.haus` (Pages → otto-haus → Custom domains)
- Production deploys require `OTTO_PAGES_ALLOW_PRODUCTION=1`
- After domain or deploy changes, run `bash site/verify-domains.sh`
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
bash site/verify-domains.sh
# curl -I http://127.0.0.1:4321/
```
