# Otto v0.1 — Status

Snapshot of the v0.1 integration. **Source of truth for shipped status:**
[`../RELEASE_CHECKLIST.md`](../RELEASE_CHECKLIST.md); per-surface spec compliance +
ship/proposed/defer/cut cutline: [`../SPEC_COMPLIANCE.md`](../SPEC_COMPLIANCE.md). Nothing is
**Shipped** until Sebastian tries the demo and approves. Claude is execution lead; Sebastian is
the only release approver.

> **v0.1 is local-first and file-backed — nothing is runtime-enforced.** Curation (the
> proposal/ratification engine) is not built, so Standards/Approvals/Knowledge are manual
> editorial judgment, not automated gates. The one live runtime hook is Charter's permission gate.

## Feature status

| Feature | Built | Tested | Demo | Receipt | Tried | Approved |
|---|:--:|:--:|:--:|---|:--:|:--:|
| Charter | ✅ | manual | ✅ | [charter](../receipts/otto-v01/charter.md) | ☐ | ☐ |
| Practices | ✅ | ✅ 6/6 | ✅ | [practices](../receipts/otto-v01/practices.md) | ☐ | ☐ |
| Routines | ✅ | manual | ✅ | [routines](../receipts/otto-v01/routines.md) | ☐ | ☐ |
| Skills | ✅ | manual | ✅ | [skills](../receipts/otto-v01/skills.md) | ☐ | ☐ |
| Standards | ✅ | manual | ✅ | [standards](../receipts/otto-v01/standards.md) | ☐ | ☐ |
| Autonomy | ✅ | manual | ✅ | [autonomy](../receipts/otto-v01/autonomy.md) | ☐ | ☐ |
| Desktop | ✅ | build ✅ | ✅ | [desktop](../receipts/otto-v01/desktop.md) | ☐ | ☐ |
| Knowledge | proposed | — | ✅ | [knowledge](../receipts/otto-v01/knowledge.md) | ☐ | ☐ |

Deferred from v0.1: **Channels**, **Curation / Approvals**.

## Test receipts (this machine, bun 1.3.14)

```
bun run typecheck                     → exit 0
bun test                              → 6 pass / 0 fail
bun packages/practices/src/cli.ts     → 5 specs validate (charter active)
bun --cwd apps/desktop run typecheck  → exit 0
bun --cwd apps/desktop run build      → vite build ok (22 modules, dist/ 204 kB)
bun run verify:v0                     → all checks + status pointer
```

## Demos

Eight ~40–55s Remotion videos in [`../demo/`](../demo/README.md) → rendered to `demo/out/*.mp4`
and symlinked to `~/Desktop/otto-v01-*.mp4`. Terminal scenes are faithful re-enactments using
real commands/specs (Practices + Desktop embed actual captured output); not live captures.

## Open issues / honest gaps

- Charter, Routines, Skills, Standards, Autonomy have no automated unit tests yet (manually verifiable).
- Knowledge is **proposed**; model ratings qualitative, routing unratified — Built, not Shipped.
- Demo videos are re-enactments, not live screen recordings.
- Namespace target is `otto-haus` (org/repo `otto-haus/otto`, scope `@otto-haus`, domain `otto.haus`, future `ot.to`); `otto-do` + `otto-hq` also owned but non-canonical; `otto.do` unavailable — confirm before push.

## Sebastian approval

See the **Final gate** table in [`../RELEASE_CHECKLIST.md`](../RELEASE_CHECKLIST.md). Push to
`otto-haus/otto`, tagging, and any npm publish are Red-zone and wait for explicit approval.
