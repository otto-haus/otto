#!/usr/bin/env bash
# verify:v0 — Otto v0.1 core checks + shipped-status pointer.
# One command Sebastian can run locally:  bun run verify:v0
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT" || exit 1

pass=0
fail=0
say() { printf '%s\n' "$*"; }
ok()   { pass=$((pass+1)); say "  ✅ $1"; }
no()   { fail=$((fail+1)); say "  ❌ $1"; }

say "Otto v0.1 — verify:v0"
say "repo: $ROOT"
say "──────────────────────────────────────────────"

# 1. Core typecheck
say "[1/5] core typecheck (tsc -p packages/core)"
if bun run typecheck >/tmp/otto_v0_typecheck.log 2>&1; then ok "typecheck"; else no "typecheck (see /tmp/otto_v0_typecheck.log)"; fi

# 2. Unit tests
say "[2/5] unit tests (bun test)"
if bun test >/tmp/otto_v0_test.log 2>&1; then
  ok "$(grep -Eo '[0-9]+ pass' /tmp/otto_v0_test.log | tail -1) / $(grep -Eo '[0-9]+ fail' /tmp/otto_v0_test.log | tail -1)"
else
  no "bun test (see /tmp/otto_v0_test.log)"
fi

# 3. Practice specs validate
say "[3/5] practice specs validate (otto-practices)"
if bun packages/practices/src/cli.ts >/tmp/otto_v0_practices.log 2>&1; then ok "5 practice specs validate"; else no "practice validation (see /tmp/otto_v0_practices.log)"; fi

# 4. Desktop typecheck
say "[4/5] desktop typecheck"
if bun --cwd apps/desktop run typecheck >/tmp/otto_v0_desktop.log 2>&1; then ok "desktop typecheck"; else no "desktop typecheck (see /tmp/otto_v0_desktop.log)"; fi

# 5. No accidental old product names in product/code.
#    Allowed: the generated lockfile, and the rename-documentation files that discuss old
#    names on purpose (README compatibility note, release checklist, status doc, receipts).
#    Env-var fallbacks VINNY_HOME / VINNY_OS_ROOT do not match these product-name patterns.
say "[5/5] no accidental old names"
allow_re='^(bun\.lock|README\.md|RELEASE_CHECKLIST\.md|docs/otto-v01-status\.md|receipts/otto-v01/|scripts/verify-v0\.sh)'
hits="$(git ls-files | grep -vE "$allow_re" | xargs grep -InE 'Vinny OS|vinny-os|@vinny-os|TryVeto|cockpit' 2>/dev/null || true)"
if [ -z "$hits" ]; then ok "no old product names in product/code"; else no "found old names:"; printf '%s\n' "$hits" | sed 's/^/      /'; fi

say "──────────────────────────────────────────────"
say "result: $pass passed, $fail failed"
say ""
say "Shipped-status table is the source of truth in: RELEASE_CHECKLIST.md"
say "Nothing is Shipped until Sebastian reviews the demo and approves."

[ "$fail" -eq 0 ]
