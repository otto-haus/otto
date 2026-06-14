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

Pick one host; apex `otto.haus` requires Sebastian DNS approval.

**Cloudflare Pages**

1. Project root: `site/` (or build output = repo `site/`)
2. No build command (static files)
3. Preview URL → verify mobile width + contrast
4. Point `staging.otto.haus` CNAME when ready

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
