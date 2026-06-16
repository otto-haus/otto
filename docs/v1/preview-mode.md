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
| Auto-open when agent emits artifact | **Opt-in** — separate slice (not v1 default) |
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
| Resize handle | Drag left edge; width clamped 280px–62% of Chat+Preview container |
| Close button | Sets `open` false; does not clear last `content` |

Persistence keys (`localStorage`, best-effort):

| Key | Value |
| --- | --- |
| `otto.preview.open` | `'1'` or `'0'` |
| `otto.preview.width` | Integer pixels |

## Ship vs Labs

| Capability | Ship (default) | Labs / later |
| --- | --- | --- |
| Toggle rail + empty state | Yes | — |
| Open preview on message / HTML code block | Yes | — |
| Sandboxed HTML `srcDoc` | Yes (strict sandbox + CSP wrapper) | — |
| Auto-open on new artifact | No | Opt-in slice |
| Point-to-element → Propose Correction | No | #653 |
| Open from Receipts surface | Yes | #660 |
| Interactive canvas / embedded prompts | No | Labs tier |

## Downstream slices

- ~~#659 — sandbox hardening for model HTML~~ (shipped)
- ~~#660 — Open in preview from Receipts~~ (shipped)
- #653 — point-to-element → Propose Correction (Design Mode analog)

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
