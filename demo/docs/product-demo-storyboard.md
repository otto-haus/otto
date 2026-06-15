# otto product demo — storyboard & shot list

**Asset class:** code-rendered Remotion product demo (not cinematic launch trailer).  
**Composition ID:** `OttoProductDemo`  
**Target:** ~54s · 1920×1080 · 30fps · light house system  
**Team:** tiger-remotion-demo (see PR for agent IDs)

## Concept (Lead + Motion Design)

OpenAI’s 2026 X demos share a **motion language**: dark-to-light reveal, floating UI chrome, one feature per beat, large sans headline + whisper subcopy, camera-like scale on the mock, ~7–9s per act. otto adopts the **rhythm and reveal structure**, not the aesthetic:

| OpenAI pattern | otto adaptation |
|----------------|-----------------|
| Dark cinematic open | **Ink-on-field** — `#101114` wordmark flash → `#f2f5f4` field (brand §01) |
| Springy UI entrances | **Ease-out only** — 120–240ms, 6px settle, no overshoot (brand §09) |
| Dense product UI with sample data | **Honest empty states** — canonical copy from `surfaces.ts`, no fake receipts/tickets |
| “Magic” autonomy claims | **Compound loop** — correction → proposal → ratification → standard → receipt |
| Fast cuts, minimal words | Same pacing; mono kickers, one emphasis per view |

**North-star line:** *Letta remembers. Otto improves.*  
**Proof line:** *Behavior compounds when corrections become ratified canon.*

## Deliberation log (6-person tiger team)

**PM:** Ship one 54s hero cut for X/website; keep existing per-feature `OttoV01*` clips.  
**Scout:** Lead with Chat (ship) + compound loop; montage Standards / Curation / Receipts empty states only.  
**Motion Design:** Reject spring on new scenes; borrow OpenAI scale-on-window, not bounce.  
**Remotion Worker:** Extend `demo/` — don’t fork `apps/demo-video/`.  
**Judge:** Block fake chat transcripts, fake proposal IDs, or “autonomous” copy. Pass on empty-state recreations.  
**Lead:** Converged on `OttoProductDemo` + this doc; launch trailer stays separate lane.

## Shot list

| # | Time | Frames @30fps | Visual | Copy (on-screen) | Motion |
|---|------|---------------|--------|------------------|--------|
| 1 | 0:00–0:04 | 0–120 | Ink field, owl tile, wordmark | kicker: `local-first desktop` · **otto** · sub: *behavior compounds* | opacity 0→1, 6px rise, 240ms ease-out |
| 2 | 0:04–0:09 | 120–270 | macOS window chrome scales in | (none — UI speaks) | scale 0.98→1 + shadow fade, 240ms |
| 3 | 0:09–0:16 | 270–480 | Shell mock · **Chat** active · empty thread | caption: **Chat with your local agent** · composer placeholder `Message otto…` | caption fade; composer hairline highlight |
| 4 | 0:16–0:25 | 480–750 | Full-frame behavior loop diagram | steps highlight sequentially: correction → proposal → ratification → standard → receipt | opacity cross-fades 180ms per step |
| 5 | 0:25–0:35 | 750–1050 | Surface montage (3× ~3s) | Standards / Curation / Receipts **empty-state copy** from canon | hard cut between surfaces; sidebar selection animates |
| 6 | 0:35–0:42 | 1050–1260 | Ratification beat — inverted ink block | **You ratify. otto records the proof.** | 240ms scale 0.98→1 on ink block (one emphasis) |
| 7 | 0:42–0:54 | 1260–1620 | Outro on field | **Letta remembers. Otto improves.** · `github.com/otto-haus/otto` | fade up + hold |

**Total:** 1620 frames (~54s)

## Honesty boundaries (Judge)

- No fabricated chat turns, ticket IDs, or curation queue items.
- Empty states use structural UI + canonical empty copy only.
- No “shipped / approved” badges beyond v0.1 cutline semantics elsewhere.
- Distinct from Culture CI capture demo (**135**) and cinematic launch trailer.

## Render

```sh
cd demo
bun install
bun run studio                                    # preview OttoProductDemo
bunx remotion render src/index.ts OttoProductDemo out/otto-product-demo.mp4
```

From repo root:

```sh
bash scripts/render-demo-clips.sh OttoProductDemo   # if wrapper updated on merge
```

## Launch coordination

| Asset | Owner lane | Notes |
|-------|------------|-------|
| `OttoProductDemo` (this) | tiger-remotion-demo | Code-rendered product story |
| `OttoV01*` feature clips | demo/ (064) | Terminal re-enactments per feature |
| Culture CI vertical slice | 135 | Live capture, primary launch proof |
| Cinematic launch trailer | separate team | Not in scope |
