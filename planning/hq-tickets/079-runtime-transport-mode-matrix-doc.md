# 079 — Runtime Transport Mode Matrix (`docs/runtime-transport.md`)

Owner: Codex
Priority: P1
Depends on: 076, 039
Release bucket: v0.1 runtime

## Outcome

Canonical doc **`docs/runtime-transport.md`** defines connection modes, event maps, fallback rules, and promotion gates — so 039/076/077 implement one contract.

## Why this matters

Chat flagged missing `time-transport.md` / mode matrix. Without it, `OTTO_RUNTIME_TRANSPORT=auto` drifts (must **never** mean silent Cloud fallback).

## Scope

Document at minimum:

### Connection modes

| Mode | Default | Transport |
|------|---------|-----------|
| embeddedLocal | yes | Bundled engine (076) |
| sdkSubprocess | fallback | Current letta-runner CLI spawn |
| wsByor | promotion target | Loopback WS (039) |
| existingLetta | advanced | External Letta.app / CLI |
| cloudRemote | advanced | Env list + status WS + sync/input (077) |
| cloudApi | advanced | Hosted chat API (limitations noted) |
| selfHosted | advanced | BYOR URL |

### Invariants (must be explicit)

- **`auto` = local ws ↔ sdk only** — no Cloud on failure
- Mode switch is operator-visible + receipted
- Paperclip/otto ticket Done ≠ Letta/Paperclip task done
- Secrets: boolean-only logging

### Event map (039)

- `sync`, `input/create_message`, `stream_delta`, `control_request`, reconnect, abort
- Mapping to `RuntimeStatus`, permission modal (045), receipts

### Promotion gate (039)

- Scorecard criteria before WS becomes default over SDK

### Cross-links

- `039-cathedral-ws-runtime-transport.md`
- `076-embedded-letta-one-app-distribution.md`
- `_Parked/077-letta-cloud-remote-mode.md`
- `docs/v1/contracts/adapter-seam.md`

## Non-goals

- Implementing transport (039/076/077)
- Public marketing copy

## Done when

- [ ] `docs/runtime-transport.md` merged in repo
- [ ] 039 and 077 tickets reference doc sections (no contradiction)
- [ ] Reviewer +1 on doc accuracy vs Letta remote client docs

## Blocker log

Leave blank unless blocked.
