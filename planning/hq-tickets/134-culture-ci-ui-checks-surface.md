# 134 — Culture CI UI: Checks Surface + Block UX

Owner: Claude
Priority: P0
Depends on: 131, 133, 124, 126, 059
Release bucket: category wedge — **Culture CI** (prose); product primitive **Checks**

## Outcome

Operators **see** active **Checks** and **experience** blocks as product moments — not silent failures or debug logs.

Category copy (README / marketing prose):

```txt
Every correction can become a regression test for future behavior.
```

Product noun: **Checks** (peer to Standards, Practices, Receipts).

## Why this matters

**133** without UI is invisible enforcement. The wedge requires:

```txt
You corrected me once. You ratified the rule. I converted it into a check.
I now cannot make that mistake silently again.
```

## Naming (locked)

- **Checks** — pane/Command Station section title, `checksCopy` in `copy/surfaces.ts`
- **Culture CI** — category prose only (`cultureCiCopy` for README-aligned lines; not a nav label)
- Block UX copy: **“Check failed”** + check name — not “error” or “Behavior Check”

## Scope

- **Checks surface** (desktop pane or Command Station section on **059**):
  - List active checks: id, source standard, trigger, last run, pass/fail counts (real only — `—` when unwired)
  - Detail: inspect rules, on_fail message, compiled provenance (proposal id, date)
  - Empty: honest “No compiled checks yet — ratify a Standard from Curation”
- **Chat block UX:**
  - When **133** blocks `done_claim` or one-way door: inline banner/card with check message + link to Receipt + link to source Standard
  - Do not label as “error” — label as **“Check failed”** (check name + standard link)
- **Curation accept:** after **126** toast, optional secondary line when check compiled: “Check active: …”
- **Copy:** add `checksCopy` and `cultureCiCopy` to `apps/desktop/src/copy/surfaces.ts`
- **Receipts (**124**): check failures use receipt detail template (authority = check + standard)
- **Web preview:** `webPreviewEmpty.checks` for browser shell

## Non-goals

- Editing check YAML in UI (file-backed v1)
- Check authoring wizard
- Remotion capture (**135**)

## Done when

- [ ] Staging: Checks list shows seed + compiled checks
- [ ] Staging: blocked done claim shows inline block UX + receipt deep link
- [ ] No “log” wording for check failures on operator surfaces
- [ ] `SurfaceProof` footer if Checks is canon surface
- [ ] Reviewer +1 + staging screenshots

## Verification

```sh
bun run --cwd apps/desktop typecheck
bash apps/desktop/scripts/deploy-staging.sh
# manual: trigger no-fake-done block → UI + receipt
```

## Blocker log

Leave blank unless blocked.
