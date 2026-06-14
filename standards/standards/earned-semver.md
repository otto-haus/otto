```yaml
name: Earned Semver
slug: earned-semver
version: 0.1
status: active

meaning: Public version numbers are earned by proof and Sebastian sign-off — never borrowed from branch names, integration waves, or optimism.

under_pressure:
  do:
    - keep the public line on 0.1.x until a minor milestone is documented and proven
    - bump patch (0.1.n) only after a closed proof bundle and Sebastian gate
    - name integration branches with codenames (ship/functional-labs) — not semver
    - mark integration tags as GitHub pre-releases until Sebastian approves ship
    - align package.json, release notes, and ship-tier-matrix when cutting a tag
    - cite receipts and SHIP_CHECKS in the release row before claiming a bump
  refuse:
    - tagging v0.2.x or v0.3.x because a branch merged or a wave landed
    - treating ship/v0.x-integration or similar branch names as product semver
    - publishing a GitHub release without Sebastian sign-off on a ship cut
    - skipping pre-release when the bundle is integration/demo, not gate-approved
    - inflating version numbers to signal momentum without proof

reward:
  - honest patch cuts with attached receipts and staging smokes
  - callers who say "integration line, not ship" when demoing unreleased work
  - retiring mistaken tags and renaming branches before they confuse outsiders

failure_modes:
  - semver as marketing (big number, small proof)
  - branch name becomes the version in README, tickets, or release titles
  - patch tag cut from dirty tree or open Done-when items
  - conflating Labs preview with Ship-tier release

conflicts_with:
  - winning            # ship narrative vs honest version line
  - quality            # gate thoroughness vs pressure to "just tag it"
tie_breakers:
  - cut scope or delay the tag before cutting proof
  - a smaller honest 0.1.n beats a inflated 0.3.0 with gaps
  - integration/demo may be tagged pre-release; ship requires Sebastian

related_practices:
  - review
  - charter

related_curation_rules:
  - done requires receipts
  - no artifact, no progress

evidence:
  - RELEASE_CHECKLIST row updated with Built/Tested/Demo and Sebastian Approved
  - ship-tier-matrix.md signed for the milestone (minor bumps)
  - staging smoke JSON under docs/receipts/staging/
  - GitHub release marked pre-release until gate packet closed

related_anti_patterns:
  - fake-progress
  - ceremony-without-signal

canon_refs:
  - horowitz

ratification:
  owner: Sebastian
  standards_changes_require_human: true
```

# Earned Semver

Public version numbers describe **what operators can rely on**, not how much code merged
this week. In otto, semver is a **trust surface**: inflating it is the same failure mode as
fake done — confidence dressed as fact.

## Product line

**Floor:** `0.1.x` is the lowest honest public line. We stay on it until a **minor**
milestone is earned and recorded.

| Bump | When | Proof |
|------|------|--------|
| **Patch** `0.1.n → 0.1.n+1` | Sebastian gate after a **closed proof bundle** | Ship-tier matrix current; staging smokes green; `RELEASE_CHECKLIST` rows honest; gate packet signed |
| **Minor** `0.1.x → 0.2.0` | A **named milestone** ships — documented in `docs/v1/ship-tier-matrix.md` changelog | Milestone criteria met with receipts; not "we merged a big branch" |
| **Major** `→ 1.0.0` | Default operator completes the **Ship-tier loop** without Sebastian hand-holding | Future — do not pre-announce |

## Not semver

These are **engineering labels**. They must never appear as product version in user-facing
copy, GitHub release titles (without qualification), or claims of "we shipped v0.3."

- Integration branch names: `ship/functional-labs`, `ship/v0.3-integration`, etc.
- Orphan or local-only tags that never passed Sebastian gate
- Ticket wave numbers, HQ ticket IDs, or Remotion demo filenames
- `package.json` bumps on an integration branch before gate approval

Use **codename + pre-release** when the line is real but not gate-approved:

```txt
Branch: ship/functional-labs
Tag: v0.1.3 (GitHub pre-release — integration/demo line)
Ship cut: pending Sebastian gate (142)
```

## Cut procedure

1. **Freeze claims** — `RELEASE_CHECKLIST.md` and `docs/v1/SHIP_STATUS.md` match folder truth (`_Done/` vs `_Backlog/`).
2. **Run gates** — `bun run verify:v0`, `bash scripts/release-gate.sh`, staging smokes on `/Applications/otto-staging.app` only.
3. **Gate packet** — `docs/receipts/staging/063-sebastian-gate-packet-*.md` complete; demo asset attached if promised.
4. **Sebastian approves** — only Sebastian ratifies a **ship** cut (not pre-release integration tags).
5. **Tag** — annotated tag `v0.1.n` at the approved commit; GitHub release notes cite receipts.
6. **Mirror** — update `SHIP_STATUS`, demo README asset links, and ship-tier matrix if milestone changed.

Agents and implementers **must not** create or push release tags, change default branch
visibility, or publish GitHub releases without explicit human approval (`AGENTS.md`).

## Operational mirrors

- Checklist (rows + receipts): [`RELEASE_CHECKLIST.md`](../../RELEASE_CHECKLIST.md)
- Live status: [`docs/v1/SHIP_STATUS.md`](../../docs/v1/SHIP_STATUS.md)
- Ship vs Labs truth: [`docs/v1/ship-tier-matrix.md`](../../docs/v1/ship-tier-matrix.md)
- Ceremony: ticket **142** — Sebastian release sign-off

## Under pressure

**Do:** say "integration pre-release on 0.1.3" when demoing unreleased work.

**Refuse:** "we shipped v0.3" because the branch name said so.

When winning and earned semver conflict, **delay the tag** or **shrink the claim** — never
inflate the number to win the narrative.
