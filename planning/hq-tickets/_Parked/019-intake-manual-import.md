# 019 — Intake: Manual Import

Owner: Codex
Priority: P1
Depends on: 016, 048
Release bucket: vNext adapters

**Unpark when:** 048 (propose from correction) and Curation loop proven in staging.

## Outcome

Otto can import thinking surfaces and turn them into curated proposals.

## Scope

- Manual import first.
- Markdown notes.
- Claude/ChatGPT exports.
- Meeting transcripts.
- Extract decisions, corrections, lessons, objections, claims, open loops.

## Done when

- Import one real chat/export.
- Produce proposed lessons/open loops with source links.
- User can accept/reject/defer in Curation.
- Nothing enters canon without Curation.
- Adapter obeys `docs/v1/contracts/adapter-seam.md`.

## Verification

```sh
bun test ./apps/desktop/electron/proposal-store.test.ts
```

## Blocker log

Leave blank unless blocked.
