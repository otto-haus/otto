# Preview Mode (v1)

Resizable artifact rail beside Chat that renders agent output the operator selects — without becoming a second workspace. Preview feeds the correction → proposal loop; it does not verify, approve, or certify rendered content.

Parent implementation: #527 (merged). This contract governs v1 behavior and explicit non-goals.

## Purpose

```txt
See what the agent produced in-thread, without leaving Chat.
```

Preview is a **read-only render surface** for markdown, sandboxed HTML, and images extracted from messages or code blocks. It is not an IDE, file tree, or cloud share target.

## Cursor reference (what otto borrows)

| Cursor capability | otto v1 stance |
| --- | --- |
| Resizable artifact rail beside thread | **Ship** — Chat `PreviewPane` |
| Sandboxed HTML / markdown / image render | **Ship** — `preview-content.ts` kinds |
| ⌘⇧P toggle + honest empty state | **Ship** — `usePreviewPane` + `previewCopy` |
| Auto-open when agent emits artifact | **Opt-in** — Settings → Auto-open preview (#652) |
| Click/draw on rendered UI → agent edit context | **Adapt** — point-to-correction (#653), not codegen |
| Canvas dashboards with embedded prompt buttons | **Labs** — later slice |
| Full IDE / multi-file tree in preview | **Out of scope** |

## States

| State | Meaning | Required UI |
| --- | --- | --- |
| `closed` | Rail hidden | Chat uses full width; toggle shows inactive |
| `open_empty` | Rail visible, no selection | Honest empty state (`previewCopy.empty*`) |
| `open_content` | Rail shows selected artifact | Title, kind pill, render by `PreviewKind` |

Never show mock artifacts in PreviewChat (web preview) or when runtime is disconnected.

## Content kinds

| Kind | Source | Render |
| --- | --- | --- |
| `markdown` | Message text or fenced snippet | `StreamMarkdown` in pane body |
| `html` | Fenced `html` block, bare `<html>` doc, or HTML code block | Sandboxed `<iframe srcDoc>` |
| `image` | Lone markdown image or `data:image/` | `<img>` in pane body |

Detection lives in `apps/desktop/src/preview/preview-content.ts`. Renderer does not fetch remote URLs for preview.

## Security boundary (v1)

HTML artifacts render in an iframe with a **strict empty sandbox** (no `allow-scripts`, no `allow-same-origin`, no navigation or popups). Untrusted model HTML is wrapped by `wrapHtmlForSandboxPreview()` before `srcDoc` assignment.

### Sandbox matrix

| Capability | iframe `sandbox` | CSP (injected) | Notes |
| --- | --- | --- | --- |
| JavaScript | **Blocked** | `default-src 'none'` (no script-src) | `<script>` tags present in source are inert at runtime |
| Network fetch / XHR | **Blocked** | no `connect-src` | External `<script src>` and `fetch()` cannot reach network |
| Top navigation | **Blocked** | `navigate-to 'none'` | Links get `rel="noopener noreferrer"` |
| `window.open` / popups | **Blocked** | — | Empty sandbox denies popups |
| Same-origin access | **Blocked** | — | No `allow-same-origin` |
| Inline CSS | **Allowed** | `style-src 'unsafe-inline'` | Layout for model HTML snippets |
| `data:` / `blob:` images | **Allowed** | `img-src data: blob:` | Remote `https:` images in HTML body are blocked |
| Forms | **Blocked** | `form-action 'none'` | Empty sandbox denies forms |

Diagnostics footer inside wrapped HTML: **Sandboxed preview · not live web** (`previewCopy.sandboxFooter`).

Implementation: `apps/desktop/src/preview/preview-sandbox.ts` · tests in `preview-sandbox.test.ts` · renderer `PreviewPane.tsx`.

v1 rules:

- **No network fetch** from preview HTML.
- **No elevated script privileges** — sandbox + CSP defense in depth.
- **No claim that preview content is safe, verified, or approved** — copy stays observational ("artifact preview").
- Operator treats model HTML as **untrusted input**; sandbox reduces blast radius, not trust.

## Keyboard and persistence

| Control | Behavior |
| --- | --- |
| ⌘⇧P | Toggle preview rail open/closed (`previewCopy.toggleHint`) |
| ⌘⇧F | Toggle fullscreen artifact review when preview pane is focused (#655) |
| ⌘[ / ⌘] | Previous / next artifact in session history (when preview focused) |
| Esc | Exit fullscreen (returns to split pane; selection preserved) |
| Resize handle | Drag left edge; width clamped 280px–62% of Chat+Preview container |
| Close button | Sets `open` false and clears artifact history for the active thread |
| Fullscreen button | Expands selected artifact to modal overlay; same sandbox policy |

Persistence keys (`localStorage`, best-effort):

| Key | Value |
| --- | --- |
| `otto.preview.open` | `'1'` or `'0'` |
| `otto.preview.width` | Integer pixels |
| `otto.preview.autoOpen.v1` | `'on-new-artifact'` · `'always-on-pane'` · absent = off |

Artifact history (session, in-memory per thread):

| Rule | Behavior |
| --- | --- |
| Stack depth | Max 20 entries; oldest dropped |
| Dedupe | Re-opening the same message/block does not fork history |
| Thread switch | Visible stack resets; prior thread history restored if you return |
| Close pane | Clears history for the active thread |
| Title | First heading in body, else kind-specific fallback |

Implementation: `apps/desktop/src/preview/preview-history.ts` · tests in `preview-history.test.ts`.

## Interactive canvas (Labs — #661)

When **Settings → Labs → Interactive preview canvas** is off (default), HTML preview uses the strict static sandbox — model `<button>` elements are inert (no scripts).

When the Labs flag is on, HTML artifacts render with an action bridge (`preview-canvas.ts`) that only forwards **otto-defined** actions via `postMessage`:

| Allowed action | Purpose |
| --- | --- |
| `navigate_surface` | Jump to a named otto surface (e.g. `settings`) |
| `copy_diagnostic` | Copy diagnostics bundle to clipboard |
| `open_receipt` | Open a linked receipt path |

**Deny list (always blocked):** `shell`, `exec`, `eval`, `fetch`, `write_file`, `delete_file`, `send_message`.

Model HTML dispatches via `data-otto-action` / `data-otto-target` on buttons. Arbitrary inline scripts and network fetch remain blocked by CSP + sandbox (no `allow-same-origin`, no navigation).

Implementation: `preview-canvas-actions.ts` · `preview-canvas-host.ts` · `preview-canvas.ts` · `PreviewPane.tsx` · tests in `preview-canvas-actions.test.ts` and `preview-canvas-host.test.ts`.

## Ship vs Labs

| Capability | Ship (default) | Labs / later |
| --- | --- | --- |
| Toggle rail + empty state | Yes | — |
| Open preview on message / HTML code block | Yes | — |
| Sandboxed HTML `srcDoc` | Yes (strict sandbox + CSP wrapper) | — |
| Auto-open on new artifact | No (opt-in via Settings) | #652 — `on-new-artifact` · `always-on-pane` |
| Fullscreen artifact review | Yes (#655) | — |
| Point-to-element → Propose Correction | Yes (HTML + runtime connected) | — |
| Open from Receipts surface | Yes | #660 |
| Interactive canvas / embedded prompts | No | Labs `preview_canvas` (#661) |

## Downstream slices

- ~~#659 — sandbox hardening for model HTML~~ (shipped)
- ~~#660 — Open in preview from Receipts~~ (shipped)
- ~~#654 — artifact history back/forward in pane~~ (shipped)
- #653 — point-to-element → Propose Correction (Design Mode analog) — shipped annotate slice

## Non-goals (v1)

- No IDE file tree or multi-file workspace in the rail
- No cloud share / publish from preview
- No pretending preview validates agent output
- No network-backed live reload of external sites
- No duplicate Chat composer inside preview

## Acceptance (doc)

- [x] Contract doc at `docs/v1/preview-mode.md`
- [x] Linked from Chat surface contract
- [x] Keyboard, persistence, sandbox rules documented
- [x] Ship vs Labs and downstream issues listed
- [x] No product copy implying otto verifies or approves rendered content
