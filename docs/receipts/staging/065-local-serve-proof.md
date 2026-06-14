# Local serve proof — 065 / 115 marketing site

**Date:** 2026-06-14

```sh
cd /Users/seb/Code/otto
OTTO_SITE_PORT=4322 bash site/dev.sh &
curl -sI http://127.0.0.1:4322/
# HTTP/1.1 200 OK
```

**Files:** `site/index.html`, `site/pricing.html`, `site/style.css`, `site/dev.sh`  
**Status:** preview / local only — apex `otto.haus` deploy pending Sebastian DNS approval.
