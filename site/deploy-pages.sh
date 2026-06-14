#!/usr/bin/env bash
# Deploy static marketing site to Cloudflare Pages (project: otto-haus).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SITE="$ROOT/site"
PROJECT="${OTTO_PAGES_PROJECT:-otto-haus}"
BRANCH="${OTTO_PAGES_BRANCH:-main}"

command -v wrangler >/dev/null || { echo "wrangler CLI required" >&2; exit 1; }

for f in index.html pricing.html style.css; do
  [[ -f "$SITE/$f" ]] || { echo "missing $SITE/$f" >&2; exit 1; }
done

cd "$SITE"
wrangler pages deploy . --project-name="$PROJECT" --branch="$BRANCH" --commit-dirty=true

echo "PASS: Pages deploy → project=$PROJECT branch=$BRANCH"
echo "  preview=https://${PROJECT}.pages.dev"
echo "  apex: attach otto.haus on Pages (Workers & Pages → otto-haus → Custom domains), remove from Worker otto"
