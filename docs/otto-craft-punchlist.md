# Otto Desktop — Craft Punch-list

From a 5-dimension parallel craft audit (house-style · code-quality · type-safety · surface-contracts ·
a11y/ux). **Overall craft score: 3/5** — a genuinely well-crafted, honest shell with two live-runtime
correctness holes that hold it back. This is the handoff list for the core-work owner (Codex).

## Applied in the craft pass (Claude, already shipped to /Applications/otto.app)

- A11y: global `:focus-visible` ring + `.promptbox:focus-within` (was a WCAG 2.4.7 fail — zero focus rules).
- A11y: `aria-label="Send message"` on both icon-only Send buttons.
- A11y: Escape clears + blurs the chat composer.
- OSS hygiene: user messages render **"You"** instead of the hardcoded "Sebastian".
- Theming: Connect-Letta input `background: #fff` → `var(--panel)` (warm token, not cold white).
- Dev tooling: `Taskfile.yml` (14 tasks), `biome.json`, `.editorconfig`. `task check` is the gate.

## P0 — runtime correctness (do first; these are real bugs, not polish)

1. **Permission round-trip can deadlock.** `letta-runner.ts` `canUseTool()` sends `otto:permission` and
   parks a resolver in `this.pending` that is only cleared by `resolvePermission`. If the renderer never
   answers (no approval UI is wired yet), or the window closes, the promise never settles and the turn
   hangs. Wire the renderer approval card → `runtime.approve(requestId, decision)`, and add a timeout /
   abort path that rejects parked resolvers.
2. **Abort and stream-end never clear `busy`.** `abort()` breaks the stream loop on `if (this.aborted)
   break` without emitting a terminal event, so the renderer's `busy` (cleared only on `type:'result'`
   or `type:'error'`) stays true and the composer stays disabled. Emit a terminal event on abort and on
   normal stream end.

## P1 — robustness

- **Unify the IPC type contract.** `runtime.ts` re-declares `OttoApi`/`RuntimeStatus`/`StatusCode`/
  `ConnectionInfo`/`ConnectionInput`/`OttoEvent` that already live in `electron/shared/types.ts`. They
  can drift. Import the shared types in the renderer (or generate from one source).
- **Guard `webContents.send` + add main-process error handling.** `LettaRunner` calls
  `this.win.webContents.send` in hot paths; if the window is gone this throws. Guard `win.isDestroyed()`.
- **Surface connection errors.** `ConnectLetta.connect()` is `try/finally` with no `catch` — a failed
  `save` swallows the error. Catch + show the reason.
- **env-precedence reconnect trap.** `applyConnectionEnv()` only sets `LETTA_*` when unset, so once set,
  changing the base URL/agent in Settings won't take effect until restart. Recompute on reconnect.
- **Typed, single-source status→pill mapping.** Three overlapping mappers (`statusPill`, `readyPill`,
  `codePill`) — collapse to one typed map.

## P1/P2 — house-style + structure (warm/ink system is the canon — see note below)

- **Collapse the radius scale.** Corners at 5/6/7/8/9/10/11/12/13px coexist; two tokens exist
  (`--radius`, `--radius-lg`). Add `--radius-sm`/`--radius-pill` and replace hardcoded px (CSS + inline).
- **Centralize per-surface inline layout/type.** `maxWidth` bounces 760/820/880/920; font-sizes 11.5–14.5
  are inline. Add a `--measure` token + a small type-utility set so surfaces stop drifting.
- **Promote remaining one-off colors to tokens** (`#aaa59a`, `#6d7178`, `#747981`, the pill-tint borders,
  and the two JSX copies of `#e7dcc0`).
- **Remove the dead config bridge.** `api.config` (get/set) is declared in `runtime.ts`, exposed in
  `preload.ts`, handled in `ipc.ts`, but no renderer calls it. Remove or use it.

## Note on the palette (NOT a defect)

The audit was run against the old `_Meta/STYLE_GUIDE.md` (cool neutrals + action-blue `#245cff`). The
build deliberately ships a **warm-paper, action-is-ink** system (`--accent: #14161a`, "action = ink, not
blue"). It's internally coherent and consistent. **Keep the warm/ink system; update the stale spec doc**
so future reviewers don't flag it. Do not repaint to cool/blue.
