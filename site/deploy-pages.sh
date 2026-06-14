#!/usr/bin/env bash
# Deploy static marketing site to Cloudflare Pages (project: otto-haus).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SITE="$ROOT/site"
PROJECT="${OTTO_PAGES_PROJECT:-otto-haus}"
CURRENT_BRANCH="$(git -C "$ROOT" branch --show-current 2>/dev/null || true)"
BRANCH="${OTTO_PAGES_BRANCH:-${CURRENT_BRANCH:-preview-local}}"
PRODUCTION_BRANCH="${OTTO_PAGES_PRODUCTION_BRANCH:-main}"

[[ -n "$PROJECT" ]] || { echo "OTTO_PAGES_PROJECT cannot be empty" >&2; exit 1; }
[[ -n "$BRANCH" ]] || { echo "OTTO_PAGES_BRANCH cannot be empty" >&2; exit 1; }
[[ -n "$PRODUCTION_BRANCH" ]] || { echo "OTTO_PAGES_PRODUCTION_BRANCH cannot be empty" >&2; exit 1; }

for f in index.html pricing.html style.css; do
  [[ -f "$SITE/$f" ]] || { echo "missing $SITE/$f" >&2; exit 1; }
done

if [[ "$BRANCH" == "$PRODUCTION_BRANCH" && "${OTTO_PAGES_ALLOW_PRODUCTION:-}" != "1" ]]; then
  echo "Refusing production Pages deploy for branch=$BRANCH (production branch: $PRODUCTION_BRANCH)." >&2
  echo "Set OTTO_PAGES_ALLOW_PRODUCTION=1 only after Sebastian approves the production deploy." >&2
  exit 1
fi

cmd=(wrangler pages deploy . --project-name="$PROJECT" --branch="$BRANCH" --commit-dirty=true)
if [[ "${OTTO_PAGES_DRY_RUN:-}" == "1" ]]; then
  printf 'DRY RUN:'
  printf ' %q' "${cmd[@]}"
  printf '\n'
  exit 0
fi

command -v wrangler >/dev/null || { echo "wrangler CLI required" >&2; exit 1; }

cd "$SITE"
"${cmd[@]}"

echo "PASS: Pages deploy → project=$PROJECT branch=$BRANCH"
echo "  preview=https://${PROJECT}.pages.dev"
echo "  apex: attach otto.haus on Pages only after Sebastian approves the DNS/custom-domain move"
