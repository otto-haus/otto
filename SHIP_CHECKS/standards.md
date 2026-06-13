# Ship Check — Standards

## Spec promise

Standards are the explicit canon: what Otto rewards, refuses, and does under pressure.

## Required file contract

- [x] `standards/registry.yaml` exists. — `standards/registry.yaml` declares authority stack (Sebastian → Standards → Curation), ratification rules (`standards_changes_require_human: true`, `auto_apply: false`), and 6 active standards.
- [x] Active standard docs exist. — `standards/standards/` contains quality.md, judgment.md, candor-kindness.md, respect-attention.md, first-principles.md, winning.md.
- [x] Precedents exist. — `standards/precedents/2026-06-13-candor-vs-kindness.md` is a real precedent from the Standards v0 build, complete with situation, decision, cost, outcome, and future rule.
- [x] Anti-patterns exist. — `standards/anti-patterns/` contains fake-progress.md, ceremony-without-signal.md, harsh-candor.md, vague-approval.md.
- [x] Standard receipt template exists. — `templates/standard-receipt.md` is a fragment for appending Standards context to Receipts.
- [x] Standards review template exists. — `templates/standard-precedent.md` is a template for writing new precedents.

## Required runtime behavior

- [~] Standards are referenced by Reviews, Receipts, Curation, or completion checks. — Standards are documented in registry.yaml and referenced in evaluations/ (e.g., `standards/evaluations/decision-grades/2026-06-13-no-fake-done-blocks-standards-v0.md` shows Quality/No-Fake-Done blocking the Standards v0 build). However, no automated enforcement harness exists yet. Curation (the enforcement layer that "enforces Standards downstream") is not implemented in v0.1, per the receipt and Curation ship check. Standards are doctrine, not yet runtime guards.
- [x] No Fake Done / Quality can block or evaluate claimed completion. — Proven: the candor-vs-kindness precedent and the no-fake-done decision-grade both show the Quality Standard blocking premature "done" on this build. The decision-grade file is a real artifact proving the Standard redirected work. AC13 (one real loop proves a Standard can block) is satisfied by these files.
- [x] Standards changes require Sebastian approval. — Documented in registry.yaml: `standards_changes_require_human: true`, `owner: Sebastian`, `auto_apply: false`. Authority stack makes clear "only Sebastian RATIFIES it, never auto-apply."

## Required Desktop surface

- [x] Desktop Standards surface lists standards and status. — `apps/desktop/src/surfaces/Panes.tsx` lines 56–95 render the Standards component, which displays authority stack, active canon (6 standards from sampleData.ts), precedents, and anti-patterns. Sidebar navigation (Sidebar.tsx line 23) wires "Standards" as a top-level surface.

## Required demo

- [x] `demo/out/otto-v01-standards.mp4` shows concrete standards/precedents, not slogans only. — Video exists (1.8M, verified present). Demo code (features.tsx lines 148–171) shows terminal output of `cat standards/registry.yaml` (authority stack), `ls standards/anti-patterns/`, and `ls standards/precedents/` with the real 2026-06-13-candor-vs-kindness.md file. Includes the concrete statement "in /review, a Standard can block a fake 'done'."

## Required receipt

- [x] `receipts/otto-v01/standards.md` states evidence and limitations. — Receipt exists and documents: what changed (standards/ swept to Otto), demo video reference, manual verification commands, known limitation ("Review-blocking is documented doctrine; no automated enforcement harness in v0.1"), approval status (pending Sebastian).

## Status legend

- `[x]` Done — evidence path required
- `[~]` Partial / prototype / proposed — evidence + gap required
- `[ ]` Not done — missing work required

## Ship decision

**Ship as Proposed**

**Rationale:**

1. **File contract:** Complete. Registry, 6 standards, precedents, anti-patterns, templates all present and well-formed.

2. **Doctrine proven:** Standards are live canon with real precedent. The candor-vs-kindness precedent and decision-grade show a Standard actually redirecting work on this build—not theoretical.

3. **Desktop surface:** Wired and functional. Standards pane shows authority stack, canon, precedents, anti-patterns in the workspace UI.

4. **Runtime enforcement:** Deferred. The registry declares Curation enforces Standards downstream, but Curation is not implemented in v0.1 (per Curation ship check). Standards can block (proven by precedent) but only via manual Review and editorial judgment, not yet automated gates.

5. **Known limitation:** Recorded in receipt: "Review-blocking is documented doctrine; no automated enforcement harness in v0.1." This is honest scoping, not a hidden gap.

**Why "Proposed" not "Ship":**

- Standards are shipped as *doctrine* (files, precedents, desktop, demo all complete).
- Automatic enforcement (Curation refusing to compound a Run without a Receipt tied to Standards) is not implemented.
- The truth rule: "If it cannot be run, inspected, proven, and approved, it is not Shipped." Standards *can* be inspected (desktop), proven (precedent + decision-grade), and approved (Sebastian owns ratification). But "run" means enforcement, which is deferred pending Curation.

**Path forward:**

- Ship Standards doctrine v0.1 as reference canon.
- When Curation lands, wire Standards gates into proposal classification and Run completion checks.
- Revisit precedent and decision-grade on 2026-07-13 per their `revisit` field.

