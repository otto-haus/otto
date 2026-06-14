# Otto v0.1 — Claims Audit

**Public claims boundary (ticket 140):** Marketing copy, README, and release tables may describe **Ship tier only** (Labs off). Labs features must be labeled experimental / coming soon — never as v0.1 shipped. **Cut** items must not appear as product UI. Forbidden as shipped: live Discord bot, Otto Cloud sync, always-on cloud, Paperclip write integration.

Otto v0.1 claims audit: 8 substantive claims reviewed. All major claims are accurately classified. Charter gates implement real Letta permission-check hooks (working-code). Practices, Routines, Standards, Autonomy are specs + templates (file-artifact) with manual tests; none have central runtime engines. Desktop is a working Vite shell (working-code) but chat is prototype-only, unconnected to Letta runtime. Knowledge is explicitly marked "proposed" with qualitative ratings—correctly labeled as not-shipped. Curation/Approvals/Channels correctly deferred; Approval types exist in core but no runtime engine. All documentation is honest about limitations and demo re-enactments. No overclaims found; status markers align with evidence.

**2026-06-14 refresh:** README + RELEASE_CHECKLIST aligned to [`docs/v1/ship-tier-matrix.md`](docs/v1/ship-tier-matrix.md). Knowledge + Channels reclassified to **Labs** in public tables (not Ship). Reviewer +1 on ceremony: pending (**142**).

Classification: `working-code` · `file-artifact` · `demo-reenactment` · `unsupported`.

| Claim (where) | Class | Action |
|---|---|---|
| README.md line 38-46: 'Charter \\| Operating contracts. Compiles messy intent into a compact contract, runs it with durable file state, gates one-way doors, and proves done with receipts.' | working-code | keep |
| README.md line 39-40: 'Practices \\| Executable Standards — repeatable workflows with a purpose, trigger, inputs, outputs, state, guardrails, evidence standard, and improvement loop.' | file-artifact | keep |
| README.md line 41: 'Routines \\| Repeated bundles of Practices. Recurring activation requires approval — attention is a one-way door.' | file-artifact | keep |
| README.md line 119-125: Feature table marks Charter ✅ Built, Practices ✅ Built+Tested, Routines/Skills/Standards/Autonomy ✅ Built, Desktop ✅ Built (build test) | working-code | keep |
| README.md lines 130-132: 'Channels and Curation/Approvals are **deferred** from v0.1.' + RELEASE_CHECKLIST.md line 22-23 deferred status | file-artifact | keep |
| demo/src/features.tsx lines 65, 120, 216: Charter/Routines/Desktop status cards show 'tried: false, approved: false' in demo metadata | demo-reenactment | keep |
| demo/README.md lines 21-26: 'Terminal scenes are **faithful re-enactments** using the real command names, file paths, and specs... They are **not** live screen captures. **Tried** and **Approved** stay unchecked until Sebastian runs each feature and signs off. A demo never marks a feature Shipped.' | demo-reenactment | keep |
| receipts/otto-v01/desktop.md lines 14-23: 'Real / file-backed: ...Practices surface reads generated practices.json... Prototype (sample data, read-only): Chat thread + ... Not built yet: the live Letta runtime (streaming, real tools, real permission gates)' | file-artifact | keep |
| receipts/otto-v01/desktop.md line 13 & demo/src/features.tsx line 212: 'preview — file-backed panes; chat not yet wired to the Letta runtime' | working-code | keep |
| receipts/otto-v01/knowledge.md lines 1, 9: 'PROPOSED' + 'Built, not Shipped. Capability ratings are qualitative, not freshly benchmarked; routing is unratified.' | file-artifact | keep |
| extension/charter.ts lines 16-19, 410-426: Charter Gates implement Letta permissions.register hook with classify() function that matches BASH_GATES regex patterns and returns 'ask' decision for one-way doors | working-code | keep |
| RELEASE_CHECKLIST.md line 21: 'Knowledge \\| proposed \\| — \\| ✅ \\| **Built, not Shipped** — proposed AI-frontier surface, routing unratified' | file-artifact | keep — **Labs tier in public tables (140)** |
