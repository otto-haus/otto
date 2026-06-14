# 154 - Channel Store Malformed Row Guard

Owner: Codex
Priority: P1
Related: 056, 020
Release bucket: v0.1 system

## Outcome

The Channels file-backed surface loads valid channels while reporting malformed `channels.yaml` rows, without crashing IPC or fabricating plausible-looking fallback channels.

## Why this matters

Channels are reachability surfaces, and outbound sends are a side-effect boundary. A malformed row should not become an `unknown` channel, an implicitly enabled channel, or a renderer crash. Files remain canon only if loader failures stay visible.

## Scope

- Review `ChannelStore` normalization and the Channels pane's skipped-loader visibility.
- Validate YAML parse output shape before normalization.
- Add skipped-row evidence to `ChannelListResult`.
- Add focused store tests for missing config and malformed rows.

## Out of scope

- Live Discord send path, still parked in 020.
- Reworking the broader Channels split/detail UI already present in the dirty worktree.
- Changing the canonical `channels/channels.yaml` fixture.
- Opening a remote PR without Sebastian approval.

## Critique pass - 2026-06-14 Codex

Feature reviewed: file-backed Channels loader.

Design decisions:

- Right: `channels/channels.yaml` is source of truth, and the desktop pane shows file-backed channel state.
- Right: outbound sends default to approval-required unless a row explicitly opts out.
- Wrong: `ChannelStore` trusted parsed YAML rows and cast each entry to an object. `null`, scalar, or unsupported-kind rows could crash or normalize into `unknown`/`desktop`-looking records.
- Right fix: parse is not validation. The store should validate root/list/item shape, skip malformed rows with reasons, and keep valid rows available.

Docs/best-practice context:

- Context7 YAML docs confirm `YAML.parse()` returns native JavaScript matching the YAML root: mappings become objects, sequences become arrays, and scalars can be null/booleans/numbers/strings.
- That means a config loader must validate the parsed shape before treating values as records.
- Exa was not available in this session; tool discovery exposed Context7 but no Exa capability.

## Rebuild

- Added `ChannelSkip` and `ChannelListResult.skipped`.
- Validated channel rows before normalization: object shape, non-empty `id`, supported `kind`, and non-empty `address`.
- Stopped defaulting malformed rows to `unknown` or `desktop`.
- Made configured rows enabled only when `enabled: true` is explicit.
- Surfaced skipped channel rows in the Channels pane using the existing skipped-loader warning pattern.
- Added focused tests for missing config fallback and malformed row skipping.

## Done when

- [x] Missing `channels.yaml` returns the safe built-in desktop channel and no skipped rows.
- [x] Malformed channel rows are skipped without crashing.
- [x] Unsupported or incomplete rows do not become `unknown` channels.
- [x] Valid rows still load.
- [x] Channels pane can show skipped row reasons.
- [x] Focused store tests pass.
- [x] Core, desktop renderer, and Electron typechecks pass.
- [ ] Independent reviewer +1.
- [ ] PR opened after approval and clean branch review.

## Verification

```sh
bun test ./apps/desktop/electron/channel-store.test.ts
bun run typecheck
bun run --cwd apps/desktop typecheck
bun run --cwd apps/desktop electron:typecheck
```

Result: all passed on 2026-06-14.

## Blocker log

- Independent reviewer +1 pending.
- PR not opened: remote publication is approval-gated, and the worktree contains unrelated dirty files outside this ticket.
- `apps/desktop/src/surfaces/Panes.tsx` already contains unrelated Settings/Channels craft changes from another slice; this ticket's UI delta is the skipped-row warning only.
