# Ship Check — Channels

## Spec promise

Channels are communication surfaces. Discord is v0/v1 backend: mobile and ambient console, not source of truth.

## Required file contract if shipping

- [ ] Channel type exists in core.
  - Evidence: Type defined at `/packages/core/src/types.ts` lines 53, 181-191 with `ChannelKind` enum and `Channel` interface including `requires_approval_to_send` field.
  - Gap: Type exists but is a passive data structure. No config file contract exists (no templates/channel.yaml, no channels/ directory, no channel initialization spec).

- [ ] Channel config exists.
  - [ ] Not done. No channel configuration template, storage location, or initialization spec exists.
  - Missing: `templates/channel.yaml` (contrast with `templates/approval.yaml`, `templates/practice.yaml`, `templates/routine-proposal.md` which exist).
  - Missing: `channels/` directory or durable config storage.
  - Missing: configuration format for channels (address, kind, approval settings).

- [ ] Discord docs/templates exist.
  - [ ] Not done. No Discord-specific documentation or integration guide.
  - Missing: `docs/channels.md` or `docs/discord.md`
  - Missing: `docs/channels/discord-setup.md` or equivalent.
  - Missing: `practices/channels/` or similar (contrast with existing practices: charter, decision, field-note, follow-up, review).

- [ ] Approval gate for outbound messages exists.
  - [~] Partial. Gate pattern detection for "send/discord" exists in `/extension/charter.ts` line 1 (regex: `/\bdiscord\b[^|;&\n]*\bsend\b/i`), but:
  - Gap: This is Charter-specific pattern detection, not a general channel-send gate.
  - Gap: No runtime pathway exists to actually send via a channel, so the gate has no target.
  - Gap: Approval is persisted (`Approval` type exists, `approval.yaml` template exists) but not connected to channel sends.
  - Evidence path: `/docs/gates.md` describes approval records as first-class (lines 22–37) but channels are not mentioned.

- [ ] Channel receipts exist.
  - [ ] Not done. `delivered_to?: Channel['id']` field exists in `Run` type (types.ts line 213) but:
  - Gap: No receipt template for channel delivery.
  - Gap: No mechanism to generate receipts when a message is sent via channel.
  - Gap: No example of a channel receipt in `/receipts/` directory.

## Required runtime behavior if shipping

- [ ] Can read/send via channel or explicitly mark scaffold-only.
  - [ ] Not done. No channel read/send implementation exists.
  - Missing: Letta extension for channels (only `extension/charter.ts` and `extension/routine.ts` exist; no `extension/channels.ts`).
  - Missing: Channel-send skill (contrast with existing skills in `skill/SKILL.md` and `skill/routine/SKILL.md`).
  - Missing: Channel integration in any Practice (follow-up.practice.yaml is draft-only, no send implementation).
  - Missing: Desktop runtime integration (Channels not wired to Chat or other surfaces).

- [ ] Outbound side effects require approval.
  - [ ] Not done. No approval enforcement pathway for channel sends.
  - Gap: Gate detection exists (charter.ts regex) but channels have no send mechanism to intercept.
  - Gap: No test or example of approval → channel send flow.

- [ ] Files remain source of truth.
  - [ ] Not done. No file-backed channel configuration or send log.
  - Missing: Channel configuration files (e.g., `~/.otto/channels/discord.yaml`).
  - Missing: Send receipts or logs in files (e.g., `~/.otto/channels/sent/<date>.yaml`).

## v0.1 decision

- [ ] Ship only if live/local flow works and approval is enforced.
  - Status: Flow does NOT work. No runtime, no send capability, no approval enforcement.

- [x] Otherwise Defer and remove demo/ship claims.
  - Status: **Explicitly deferred from v0.1** (README.md line 132, RELEASE_CHECKLIST.md line 22, baseline.md line 17).
  - Demo claim: None in `demo/` (no channel-related demo videos).
  - Ship claim: Correctly marked deferred in RELEASE_CHECKLIST.md.

## Status legend

- `[x]` Done — evidence path required
- `[~]` Partial / prototype / proposed — evidence + gap required
- `[ ]` Not done — missing work required

## Ship decision

**Defer**

## Truth rule

If it cannot be run, inspected, proven, and approved, it is not Shipped.
Channels cannot be run, inspected, or proven in v0.1 — no runtime exists.

