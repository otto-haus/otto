# Otto v0.1 — Status

Snapshot of the v0.1 integration. **Source of truth for shipped status:**
[`../RELEASE_CHECKLIST.md`](../RELEASE_CHECKLIST.md). Nothing is **Shipped** until Sebastian
tries the demo and approves. Claude is execution lead; Sebastian is the only release approver.

## Feature status

| Feature | Built | Tested | Demo | Receipt | Tried | Approved |
|---|:--:|:--:|:--:|---|:--:|:--:|
| Charter | ✅ | manual | ✅ | [charter](../receipts/otto-v01/charter.md) | ☐ | ☐ |
| Practices | ✅ | ✅ 6/6 | ✅ | [practices](../receipts/otto-v01/practices.md) | ☐ | ☐ |
| Routines | ✅ | manual | ✅ | [routines](../receipts/otto-v01/routines.md) | ☐ | ☐ |
| Skills | ✅ | manual | ✅ | [skills](../receipts/otto-v01/skills.md) | ☐ | ☐ |
| Standards | ✅ | manual | ✅ | [standards](../receipts/otto-v01/standards.md) | ☐ | ☐ |
| Autonomy / Ticketcraft | ✅ | manual | ✅ | [autonomy-ticketcraft](../receipts/otto-v01/autonomy-ticketcraft.md) | ☐ | ☐ |
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
- Namespace `otto-do` chosen per master ticket (over the older `otto-hq` in the Dropbox spec) — confirm.

## Sebastian approval

See the **Final gate** table in [`../RELEASE_CHECKLIST.md`](../RELEASE_CHECKLIST.md). Push to
`otto-do/otto`, tagging, and any npm publish are Red-zone and wait for explicit approval.
