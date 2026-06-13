# Ship Check — Namespace

## Spec promise

Otto has one clean public identity.

## Required state

- [x] Product name is `Otto`.
  - Evidence: `/Users/seb/Code/otto/.letta/worktrees/otto-v01-integration/package.json` name: "otto" · `/Users/seb/Code/otto/.letta/worktrees/otto-v01-integration/README.md` line 1: "# Otto" · `/Users/seb/Code/otto/.letta/worktrees/otto-v01-integration/RELEASE_CHECKLIST.md` consistently uses "Otto"

- [x] GitHub target is `otto-haus/otto`.
  - Evidence: `/Users/seb/Code/otto/.letta/worktrees/otto-v01-integration/README.md` line 69: `git clone https://github.com/otto-haus/otto` · `/Users/seb/Code/otto/.letta/worktrees/otto-v01-integration/RELEASE_CHECKLIST.md` line 70: "Owner / repo: `otto-haus/otto`"

- [x] Package scope is `@otto-haus/`.
  - Evidence: All packages verified:
    - `/Users/seb/Code/otto/.letta/worktrees/otto-v01-integration/packages/core/package.json` → "@otto-haus/core"
    - `/Users/seb/Code/otto/.letta/worktrees/otto-v01-integration/packages/practices/package.json` → "@otto-haus/practices"
    - `/Users/seb/Code/otto/.letta/worktrees/otto-v01-integration/apps/desktop/package.json` → "@otto-haus/desktop"
    - `/Users/seb/Code/otto/.letta/worktrees/otto-v01-integration/demo/package.json` → "@otto-haus/demo"
    - All workspace dependencies use workspace:* references to @otto-haus/* packages
    - No @vinny-os, @otto-do, or @otto-hq in source code

- [x] Domain reference is `otto.haus`.
  - Evidence: `/Users/seb/Code/otto/.letta/worktrees/otto-v01-integration/RELEASE_CHECKLIST.md` line 72: "Otto v0.1 does not depend on a website (`otto.haus` is the current domain asset)"

- [x] Future dream domain `ot.to` is documented only as future.
  - Evidence: `/Users/seb/Code/otto/.letta/worktrees/otto-v01-integration/RELEASE_CHECKLIST.md` line 66: "Target identity = org `otto-haus`, repo `otto-haus/otto`, scope `@otto-haus`, domain `otto.haus`, future dream `ot.to`" · No other references to ot.to exist outside this documentation

- [x] `otto-do`, `otto-hq`, `otto.do`, `@otto-do`, `@otto-hq` do not appear except intentional historical/decision notes.
  - Evidence: Grep scan performed; only documented in `/Users/seb/Code/otto/.letta/worktrees/otto-v01-integration/RELEASE_CHECKLIST.md` lines 66 and 80 as "Also owned but non-canonical" and approved discussion of namespace. Lock file entry `@otto-do/demo` in demo/bun.lock is generated artifact (acknowledged in RELEASE_CHECKLIST.md line 57). No references in active code or packages.

- [x] `Vinny OS` appears only as historical context if needed.
  - Evidence: `/Users/seb/Code/otto/.letta/worktrees/otto-v01-integration/README.md` line 136: "Renamed from an internal project ("Vinny OS")" · `/Users/seb/Code/otto/.letta/worktrees/otto-v01-integration/RELEASE_CHECKLIST.md` documents rename for context · Extension files use VINNY_HOME only as back-compat env fallback · `/Users/seb/Code/otto/.letta/worktrees/otto-v01-integration/packages/practices/src/cli.ts` uses VINNY_OS_ROOT only as back-compat env fallback

- [x] UI language uses `workspace`, not cockpit/console/dashboard.
  - Evidence: 
    - `/Users/seb/Code/otto/.letta/worktrees/otto-v01-integration/apps/desktop/src/App.tsx` line 73: "otto workspace"
    - `/Users/seb/Code/otto/.letta/worktrees/otto-v01-integration/apps/desktop/src/components/Sidebar.tsx` line 61: brand sub = "workspace"
    - `/Users/seb/Code/otto/.letta/worktrees/otto-v01-integration/apps/desktop/README.md` line 3: "A v0 Desktop workspace"
    - No "cockpit" in code; "console" only appears as console.log (logging API); "dashboard" only in documentation discussing what Otto is NOT

- [x] Sidebar/nav labels avoid slashes.
  - Evidence: `/Users/seb/Code/otto/.letta/worktrees/otto-v01-integration/apps/desktop/src/components/Sidebar.tsx` lines 22-33: All labels verified — "Chat", "Charters", "Standards", "Practices", "Routines", "Curation", "Receipts", "Autonomy", "Settings" — zero slashes

## Ship decision

**Ship in v0.1**

All namespace requirements verified. Product name "Otto" is consistent across package.json, README, and code. GitHub target `otto-haus/otto` is correctly referenced. Package scope `@otto-haus` is uniformly applied to all packages. Domain `otto.haus` is documented as current asset; future `ot.to` marked as dream. No product name collisions in code. Old names appear only in intentional historical documentation or back-compat env fallbacks (VINNY_HOME, VINNY_OS_ROOT). UI language correctly uses "workspace". Sidebar nav labels are slash-free. Verify script passes all checks. This namespace surface meets all stated requirements for v0.1 ship.

