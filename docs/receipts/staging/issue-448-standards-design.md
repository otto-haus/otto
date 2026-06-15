# Issue #448 — Standards surface design spec

**Status:** design only (no UI implementation in this receipt)  
**Tier:** Ship (`SURFACE_TIER.standards = 'ship'`, ship-tier-matrix pass 2026-06-14)  
**Canon:** `standards/registry.yaml`, `standards/standards/*.md`, `apps/desktop/src/copy/surfaces.ts`  
**Reference surfaces:** Practices, Receipts (`Panes.tsx` SplitLayout + FilterBar patterns)

---

## Purpose

Standards is the browse surface for **explicit behavior canon** — what otto rewards, refuses, and does under pressure. It is read-only in v1: files load from repo `standards/`; ratification changes go through Curation, not inline edit.

The human ratifies. otto records the proof.

---

## 1. Information architecture

### Layout (match shipped list/detail surfaces)

Use the existing **SplitLayout** shell shared with Practices and Receipts:

| Zone | Content |
|------|---------|
| **Hero** | Eyebrow + title + lede (`standardsCopy`) |
| **Ink** | One-line culture anchor (`SurfaceInk`) |
| **Stat strip** | Loaded count · Active count |
| **Ratification strip** | Owner, auto_apply, `standards/registry.yaml` filechip |
| **Toolbar** | Search + status filter (new — see §5) |
| **List pane** | Selectable cards grouped by domain (§1.2) |
| **Detail pane** | Standard metadata + under-pressure + evidence + conflict panel (§1.4) |
| **Footer meta** | Registry path, loaded/skipped counts |
| **Proof** | `SurfaceProof surface="standards"` |

Detail loads on list selection; deep-link by slug is a follow-up (not blocking v1 ship).

### Domain grouping (list pane)

Registry is flat today (7 Standards). Group list cards under **mono section eyebrows** so the surface scales without re-architecture when canon grows.

**v1 groups** (client-side mapping from slug; no registry schema change required):

| Domain eyebrow | Standards (current canon) | Rationale |
|----------------|---------------------------|-----------|
| **proof & completion** | quality, earned-semver | Done, semver, and gate proof |
| **judgment & gates** | judgment, first-principles, respect-attention | Reversibility, reasoning, attention |
| **culture & delivery** | candor-kindness, winning | How we speak and what we ship |

Rules:

- Single-domain sections with one card still show the eyebrow (teaches the taxonomy).
- Sort within section: active first, then draft, then superseded; alphabetical by name within status.
- **Anti-patterns** and **canon refs** from `registry.yaml` stay out of the list — detail-only or a future “Registry” sub-panel.

### Lifecycle badges

**Schema truth:** `standard-store` accepts `draft | active | deprecated`.

**UI labels** (operator-facing; map schema → display):

| Schema | Pill label | Tone (`StatusPill`) | Meaning in copy |
|--------|------------|---------------------|-----------------|
| `active` | active | `pill--ok` | Ratified canon in force |
| `draft` | draft | `pill--info` | Proposed; not yet ratified — do not treat as enforcement input |
| `deprecated` | superseded | neutral / muted | Replaced or retired; kept for precedent citation only |

Never show “deprecated” as the primary label — **superseded** matches canon language (“case law”, earned replacement).

Stat strip **Active** counts only `status === 'active'`. Draft and superseded appear in list pills and optional filter, not as fake “active” totals.

### Detail pane structure

Top → bottom:

1. **Conflict · case law** (conditional — §2.4)
2. **Standard detail** — name, status pill, meaning (lede), kv: schema, slug, version, file
3. **Under pressure** — two columns: do · refuse (from frontmatter)
4. **Evidence & citation** — evidence list + filechip slug · path
5. **Related** (v1 optional, read-only chips if present in record): `conflicts_with`, `related_practices`, `related_anti_patterns`

Do not render full markdown body in v1 unless already loaded — structured frontmatter fields are the product surface; prose stays in repo for agents and diff review.

### Conflict map (registry-level)

`registry.yaml` `conflicts:` is first-class culture, not an afterthought.

- **Per-Standard detail:** `conflictForStandard(slug)` — show when a registry conflict touches this slug (existing IPC).
- **Surface footer or collapsible “Tension map”:** read-only list of all registry conflicts (between slugs, tie-breaker, precedent file or “no case law yet”). Links select the first slug in `between`.

---

## 2. Empty states (honest — no mocks)

All empty states use **InlineEmpty** or list-column empty — never placeholder Standards, fake precedents, or sample tie-breakers.

### 2.1 No Standards loaded (`standards.length === 0` after load)

**Where:** List pane  
**Title:** `No Standards loaded`  
**Body:** `Add Standard files under standards/standards/ and register them in standards/registry.yaml. Skipped loader rows appear above if files failed validation.`  
**Actions:** None in-pane (file-backed; no “Create Standard” CTA that implies write).  
**SkippedLoaderPanel:** Always visible when `skipped.length > 0` (existing 037 behavior).

### 2.2 Loading

**Title:** `Loading standards…` (existing `standardsCopy.loadingTitle`)  
No skeleton cards that resemble real Standards.

### 2.3 No selection (list has items, detail empty)

**Where:** Detail pane (Receipts pattern: `selectTitle` / `selectBody`)  
**Title:** `Select a Standard`  
**Body:** `Pick an explicit rule to see what otto rewards, refuses, and how case law resolves tension with other Standards.`

### 2.4 Search / filter no results

**Where:** List pane (Receipts pattern: `noMatchTitle` / `noMatchBody`)  
**Title:** `No matching Standards`  
**Body:** `Clear the search or status filter to see the full canon list.`

### 2.5 Conflict panel empty (selected Standard, no registry conflict)

When `conflictForStandard` returns null:

- **Do not** show the warn-styled conflict block.
- **Optional** muted one-liner in detail (not a full InlineEmpty):  
  `No registered tension map entry for this Standard. See registry.yaml conflicts or conflicts_with on the file.`

When conflict exists but **`precedent` is null** (tie-breaker asserted, no case law):

- Keep existing warn section.
- **Message:** `No case law yet — tie-breaker is "{tie_breaker}".` (store already shapes this)
- **Footer:** `Propose a Curation Standards change instead of improvising in chat.` (existing `conflictProposeCuration`)

When conflict exists **with precedent excerpt:** show excerpt + precedent filechip (existing behavior).

### 2.6 Web preview (no Electron API)

Keep `webPreviewEmpty.standards` — desktop-only browse; no fake list in browser preview.

### 2.7 Sidebar “soon” gate (not an empty state — navigation)

While `standards ∈ WORKSPACE_PREVIEW_SURFACES`, sidebar shows **soon** and main pane renders `ComingSoonSurface` — **contradicts Ship tier**. Fix in implementation track: remove `standards` from `WORKSPACE_PREVIEW_SURFACES` (same graduation as Receipts). Until then, users never see §2.1–2.5 in production nav.

---

## 3. Copy tone

Align with `docs/design/brand-style-guide.html` § Voice and `surfaces.ts` forbidden words.

### Principles

- **Calm & exact:** State what loaded, what ratifies, what is missing. No “otto learned/enforced/approved.”
- **Load-bearing terms:** Standard, Receipt, Curation, Practice, ratification, case law, tie-breaker, precedent.
- **Authority line:** Registry changes require Sebastian; auto_apply stays visible as `false`.
- **Product name:** `otto` lowercase; **Standard** capitalized when naming the artifact.
- **Forbidden:** beta, experimental, autonomous, guaranteed, learned automatically, mock/example canon.

### Hero / ink (keep or tighten — already strong)

| Key | Current | Notes |
|-----|---------|-------|
| eyebrow | `case law` | Good — distinguishes from Practices (“executable culture”) |
| title | `Culture needs case law.` | Keep |
| lede | `Explicit rules — what otto rewards, refuses, and does under pressure.` | Matches `surface-meta.standards.sub` |
| ink | Until a Standard costs something… | Keep — encodes “poster vs canon” |

### New copy keys (add to `standardsCopy` at implement time)

```ts
searchPlaceholder: 'Search name, slug, meaning…',
filterAll: 'All',
filterActive: 'Active',
filterDraft: 'Draft',
filterSuperseded: 'Superseded',
selectTitle: 'Select a Standard',
selectBody: 'Pick an explicit rule to see what otto rewards, refuses, and how case law resolves tension with other Standards.',
noMatchTitle: 'No matching Standards',
noMatchBody: 'Clear the search or status filter to see the full canon list.',
conflictNoneHint: 'No registered tension map entry for this Standard.',
domainProof: 'proof & completion',
domainJudgment: 'judgment & gates',
domainCulture: 'culture & delivery',
statSuperseded: 'Superseded', // optional fourth stat if count > 0
```

Tone check examples:

- ✅ “7 loaded · 7 active”
- ✅ “Owner Sebastian · Auto apply false”
- ❌ “Your culture profile” / “AI governance rules”

---

## 4. Navigation

### Sidebar

| Item | Value |
|------|-------|
| Label | Standards |
| Icon | `Icon.standards` |
| Shortcut | ⌘3 (unchanged) |
| Badge | **None** when Ship gate open — remove `soon` after #448 gate fix |
| Count badge | Optional future: count of draft Standards pending ratification (out of scope v1) |

### surface-meta (`META.standards`)

Keep:

- **title:** Standards  
- **sub:** Explicit canon — what we reward, refuse, and do under pressure.

App header subtitle pulls from `META` — no separate Standards string.

### surface-tiers

- `standards: 'ship'` — already correct.
- **Implementation:** Remove `'standards'` from `WORKSPACE_PREVIEW_SURFACES` so `surfaceGate('standards') === 'open'`.
- **App pill:** When file-backed and gate open, show `file-backed` pill (same as Practices), not `coming soon`.

### Cross-links (read-only, v1)

- Detail **related_practices** chips → navigate to Practices with slug selected (if Practices gate open).
- Checks surface **openStandard** → navigate to Standards with slug (mirror existing Checks → Standard link).
- Curation proposals targeting Standards → deep link slug when proposal metadata includes it (follow-up).

---

## 5. Search and filter UX

Follow **Receipts** toolbar pattern: text input + `FilterBar` chip row above SplitLayout list.

### Text search (humans + agents)

Single input, client-side filter over loaded records (no server index in v1).

**Match fields (case-insensitive substring):**

- `name`, `slug`, `meaning`
- `under_pressure.do[]`, `under_pressure.refuse[]`
- `evidence[]`
- `file` path

**Placeholder:** `Search name, slug, meaning…`

**Agent affordances:**

- Slug is stable identifier — prefer `quality`, `earned-semver` in automation.
- Expose `aria-label` equal to placeholder for CDP/Playwright smokes.
- List container: `aria-label="Standards list"` (Receipts precedent).

### Status filter chips

| Chip | Filter |
|------|--------|
| All | no status filter |
| Active | `status === 'active'` |
| Draft | `status === 'draft'` |
| Superseded | `status === 'deprecated'` |

Combine with search AND logic. Empty result → §2.4.

### Optional v1.1 (not blocking ship)

- **Has tension** filter: Standard appears in any `registry.conflicts` `between` array.
- **Keyboard:** `/` focuses search when Standards pane focused (match Receipts if present).

---

## 6. Acceptance checks (for implementation PR)

- [ ] `standards` removed from `WORKSPACE_PREVIEW_SURFACES`; sidebar no **soon** badge; pane renders real loader.
- [ ] All §2 empty states wired with copy from §3; no mock Standards.
- [ ] Lifecycle pills: active / draft / superseded (schema `deprecated`).
- [ ] List grouped by §1.2 domain eyebrows.
- [ ] Search + status filter with §2.4 no-match empty.
- [ ] Detail select empty §2.3; conflict section follows §2.5.
- [ ] Ratification strip shows real registry owner and `auto_apply: false`.
- [ ] Skipped files visible when loader skips invalid YAML.
- [ ] Staging smoke: open Standards, assert ≥1 card from real repo, select `quality`, conflict or conflict-none hint visible.

---

## 7. Out of scope (#448 design)

- Inline Standard edit or ratification workflow (Curation owns writes).
- Full markdown renderer for Standard prose body.
- Remote / cloud Standards sync.
- Mock or onboarding sample Standards in this pane (Receipts sample pattern does **not** apply).

---

## Key IA decisions (summary)

1. **SplitLayout list/detail** — same shell as Practices/Receipts; no new layout paradigm.  
2. **Three domain groups** in list — proof, judgment, culture — client-side until registry grows fields.  
3. **superseded** UI label for schema `deprecated`; active-only stat strip count.  
4. **Conflict block only when registry match**; honest hint when none; precedent-null keeps Curation propose line.  
5. **Graduate navigation** — remove preview/soon gate so Ship tier matches user-visible access.  
6. **Receipts-style search + status filter** — client-side, slug-friendly for agents.
