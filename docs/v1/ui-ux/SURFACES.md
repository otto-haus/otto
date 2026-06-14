# Per-surface UI/UX spec

Companion to `MASTER.md`. Builder implements data; UX lane owns layout, copy, states.

Legend: **Layout** · **Empty** · **Loaded** · **Blocked** · **Copy keys** (`copy/surfaces.ts`)

---

## Chat

**Layout:** Full-bleed. Head (avatar, session subtitle, runtime dot) → optional Command Station → stream → prompt bar (model/effort pickers, queue, attachments).

**Empty (ready, no messages):** `chatCopy.session*` — invite first message; mention correction loop.

**Not ready:** Ink block — retry + settings; `chatCopy.runtimeNotReady*`.

**Command station:** `CommandStationStrip` when `onNavigate` provided. Counts optional props — show `—` when unwired (**no fake numbers**).

**Future (**123**):** “Correct this” on assistant messages → toast `proposalCreated` + navigate Curation.

---

## Charters

**Layout:** `SurfacePage` → create panel → `SplitLayout` (charter cards | detail with AC, runs, receipts chips).

**Web preview:** `webPreviewEmpty.charters`.

**List empty:** `listEmpty.charters`.

**Loaded:** Status pill per charter; detail shows AC checklist, linked run/receipt chips.

**Proof footer:** `SurfaceProof surface="charters"`.

---

## Standards

**Layout:** Registry summary panel → split (standard cards | detail with ratification block).

**Web preview:** `webPreviewEmpty.standards`.

**List empty:** `listEmpty.standards`.

**Skipped files:** `SkippedLoaderPanel` (details, warn pill).

---

## Practices

**Layout:** Same split pattern; detail shows guardrails, invocations, receipt citations.

**Web preview:** `webPreviewEmpty.practices`.

**List empty:** `listEmpty.practices`.

---

## Routines

**Layout:** Split + activation gate panel + manual run CTA (receipt-only, no recurring auto-enable).

**Web preview:** `webPreviewEmpty.routines`.

**List empty:** `listEmpty.routines`.

---

## Curation

**Layout:** Inbox header (path chip, pending/decided counts) → `FilterBar` → split (proposal cards | detail with Accept/Reject/Defer).

**Web preview:** `webPreviewEmpty.curation`.

**List empty (filtered):** Context copy per filter (pending vs decided).

**Accept success:** Toast `behaviorUpdated` when canon applied; else `proposalAccepted`.

**Approvals section:** Derived records below inbox — not a separate subsystem.

---

## Receipts

**Layout:** Summary stats (when wired) → filter → split (receipt cards | detail with evidence, blocker, standards cited).

**Web preview:** `webPreviewEmpty.receipts`.

**List empty:** `listEmpty.receipts`.

**Future (**124**):** Hero treatment for authority line + evidence hierarchy (not log dump).

---

## Autonomy

**Layout:** Policy zones + door evaluation form + last evaluation receipt.

**Web preview:** `webPreviewEmpty.autonomy`.

**Evaluate:** Shows allowed/blocked with reason; receipt link.

---

## Skills

**Layout:** Split (skill cards | triggers + body preview).

**Web preview:** `webPreviewEmpty.skills`.

**List empty:** `listEmpty.skills`.

---

## Knowledge

**Layout:** Registry status + model/routing table.

**Web preview:** `webPreviewEmpty.knowledge`.

**Proposed registry:** Warn pill — defaults not ratified policy.

---

## Tickets

**Layout:** Create form → split (ticket cards | workers, AC, checks).

**Web preview:** `webPreviewEmpty.tickets`.

**List empty:** `listEmpty.tickets`.

---

## Channels

**Layout:** Channel list cards + detail (reachability, approval gates).

**Web preview:** `webPreviewEmpty.channels`.

**List empty:** `listEmpty.channels`.

---

## Settings

**Layout:** Two-column settings shell — nav (General | Providers) + content.

**General:** Readiness rows — live runtime overrides file checklist when connected.

**Providers:** Segmented Local/Cloud; rows show active model truthfully; “Open Letta” for BYOK.

**Proof footer:** `SurfaceProof surface="settings"` — command station test line.

---

## Onboarding (overlay)

**Welcome:** Full-screen ink card — ratification narrative; CTA Settings + Receipts education.

**Dock:** Steps 2–3 bottom-right; dots; truthful connect/run copy.

**Classes:** `.onboardOverlay`, `.onboardCard`, `.onboardDock` in `styles.css`.

---

## Command Station (**059** / **127**)

**Placement:** Top of Chat stream when runtime ready.

**Ops cards:** Curation · Recent proof · Tickets · Doors — optional numeric counts.

**Culture cards:** Constitution (→ Standards) · Changelog (→ Curation) — link-only, no counts.

**Future:** Wire counts from stores; add constitution/changelog deep surfaces when **122** / **121** land.

---

## Toasts (global)

| Event | Title key |
|-------|-----------|
| Canon accept | `behaviorUpdated` |
| Accept no canon | `proposalAccepted` |
| Reject / defer | `proposalRejected` / `proposalDeferred` |
| Blocked decide | `decisionBlocked` |
| Proposal create (**123**) | `proposalCreated` |

Duration ~6.5s; bottom-right stack; no dismiss button required v0.
