# Embedded Letta bundle — "This Mac" zero-setup runtime

Status: in progress. Tracks issues #671–#678. This is the canon for how otto ships and runs
its own Letta engine so the product story is **"download otto and it works."**

## Modes

- **This Mac (default, embedded).** otto bundles the published Letta Code engine inside
  `otto.app` and supervises it as a subprocess. No separate Letta install. `connectionMode`
  defaults to `embedded` (see `config-store.ts`).
- **Existing local Letta (advanced).** Power users point otto at a Letta they already run
  (Letta Desktop / self-hosted). otto must **not** silently fall back to this when the embedded
  bundle is missing — it surfaces the bundle error instead (#677).

Provider/API keys always live in Letta, never otto. otto stores only a `hasProviderKey` boolean.

## What ships and how it resolves

- Production dependency: `@letta-ai/letta-code` (pinned), declared directly in
  `apps/desktop/package.json` so electron-builder includes it in the production closure.
- Packaging uses `asar: false` (electron-builder.yml) so the engine is plain files the SDK can
  spawn. The CLI lands at:

  ```txt
  otto.app/Contents/Resources/app/node_modules/@letta-ai/letta-code/letta.js
  ```

- `resolveCli('embedded')` in `runtime-transport/runtime-common.ts` resolves that path from
  `process.resourcesPath` (and dev `node_modules` fallbacks). `LETTA_CLI_PATH` always wins when set.
- Transport is **SDK subprocess** (`@letta-ai/letta-code-sdk`), not WebSocket. The SDK owns the
  child process; otto owns session lifecycle, health gating, and the connected-state contract.

### Version pin

`@letta-ai/letta-code-sdk@0.1.14` declares an **exact** dependency on `@letta-ai/letta-code@0.19.5`.
otto pins the direct dependency to the **same `0.19.5`** so a single copy resolves and the running
engine matches the SDK's tested protocol. Shipping a newer engine (e.g. `0.27.9`) against an SDK that
expects `0.19.5` risks a subprocess protocol mismatch. **Upgrade policy:** bump
`@letta-ai/letta-code` in lockstep with the version `@letta-ai/letta-code-sdk` declares, then
re-run `bun run gen:notices` and `bash scripts/embedded-letta-smoke.sh`.

## Isolated state — `~/.otto/letta`

Embedded mode keeps Letta state out of a dev `~/.letta` install. `config-store.lettaStateDir()`
returns `<OTTO_HOME>/letta`. `applyEmbeddedLettaSettingsEnv` (dream-settings.ts) exports the env the
spawned engine reads — `LETTA_SETTINGS_PATH` and `LETTA_MEMORY_DIR` — into that dir (in addition to
otto's own `OTTO_LETTA_SETTINGS_PATH`). Existing/cloud modes are untouched.

Limitation (honest): the engine still defaults some paths (e.g. `~/.letta/agents`, skills) without a
single home override. Full home isolation needs an upstream `LETTA_HOME`-style knob; settings + memory
are isolated today.

## Licensing & attribution (#671 gate)

Verdict: **redistribution ALLOWED with attribution.** Letta Code + SDK are Apache-2.0; the shipped
tree has **no GPL/AGPL/SSPL**. Weak copyleft present: LGPL-3.0 (`@img/sharp-libvips-*`, unmodified
libvips prebuilt via `sharp`) and MPL-2.0 (`lightningcss`, build-time) — both satisfied by notice +
source pointer.

Build rules:

- Carry Letta Code's `LICENSE` in the bundle (automatic via `asar:false`).
- Keep `THIRD_PARTY_NOTICES.md` accurate: `bun run gen:notices` (generates from the shipped tree;
  point `--root` at a built `Resources/app/node_modules` for release accuracy).
- The generator is also a **guard**: `bun run check:notices` (and the smoke) fail the build if any
  GPL/AGPL/SSPL appears.
- Attribute as **"powered by Letta"**. Do **not** ship Letta marks/logos/wordmarks/ASCII banner as
  otto branding (otto's mark is the owl). The CLI runs headless (non-TTY) via the SDK, so its
  interactive ASCII banner does not render in the embedded path.
- Never fork/absorb Letta source; bundle the published package. Keep otto behavior separate from the
  Letta runtime (no Veto/source-record mechanisms inside a Letta fork).

## Verify

```sh
bun install
bun run --cwd apps/desktop electron:build
(cd apps/desktop && bunx electron-builder --mac dir --arm64)
bash scripts/embedded-letta-smoke.sh   # bundle path + LICENSE + license guard + resolveCli
bun test apps/desktop/electron/runtime-transport/runtime-common.test.ts apps/desktop/electron/connection-reconnect.test.ts  # #677 mode matrix
```

Release gate (#678): the smoke must pass against a packaged staging/Release artifact (never against
`/Applications/otto.app` in agent loops). CI enforces the bundle path + `cliResolved` slice on every
PR via `.github/workflows/ci.yml` job `embedded-letta-release-gate` (`bash scripts/ci-embedded-letta-gate.sh`).
A clean-machine init + one disposable chat turn (`task smoke:clean-machine`) proves the full
bootstrap (#675) before tag cut.

## Trust boundary (verbatim — #670)

```txt
otto supervises UI and session lifecycle.
embedded Letta is keystore + memory system-of-record.
Provider/API keys never live in otto config — only hasProviderKey boolean.
```

otto must **not** silently fall back to Letta.app when the bundled engine is missing (#677). Advanced
**Existing local Letta** is explicit opt-in only.

## Slice map (#670 plan gate)

| Issue | Slice | Status |
|-------|-------|--------|
| #671 | License / attribution gate | closed (PR #753) |
| #672 | Bundle `letta.js` packaging | closed (smoke @ a5d950d6) |
| #673 | Runtime supervisor (spawn, health, crash recovery) | in progress |
| #674 | Diagnostics embedded state | open |
| #675 | First-run bootstrap — This Mac default | in progress |
| #676 | Provider write-only UI mirror | open |
| #677 | Existing Letta mode (no silent fallback) | shipped |
| #678 | CI/staging embedded smoke gate | open |

**Plan gate:** Sebastian must approve this contract before #670 closes. No v0.1.7 release cut without
explicit Sebastian sign-off (`docs/v1/runbooks/sebastian-release-sign-off.md`).

Related: #456 (standalone otto), #97 / #575 (zero-setup onboarding), `planning/hq-tickets/076`.
