# Agent turn trail (v1)

Read-only play-by-play of agent tool/reasoning steps during and after a Chat turn. Spans are accumulated in the main process from Letta WS/SDK events — the renderer never fabricates spans.

## Ship vs Labs

| Surface | Ship (default) | Labs (`turn_phase_timeline`) |
| --- | --- | --- |
| Live streaming strip | Ordered span labels; latest emphasized | Same |
| Collapsed message chip | Count + duration summary; expand to span list | Adds phase strip (`Orient · Locate · Edit · Verify`) when derivable |
| Empty / text-only turn | No chip; live strip shows `thinking…` only | No fake phases |
| PreviewChat (disconnected) | No mock spans | No mock spans |

## Span copy table

Labels use `spanLabelFromTool(toolName, input, phase)`. Targets are truncated and secrets redacted.

| Tool family | Call label | Done label | Target field |
| --- | --- | --- | --- |
| `read`, `read_file` | Reading `{basename}`… | Read `{basename}` | `path`, `file`, `file_path` |
| `grep` | Searching for `{pattern}`… | Searched for `{pattern}` | `pattern`, `query` |
| `glob` | Finding `{pattern}`… | Found `{pattern}` | `pattern`, `glob_pattern` |
| `write`, `write_file` | Writing `{basename}`… | Wrote `{basename}` | `path`, `file` |
| `edit`, `edit_file` | Editing `{basename}`… | Edited `{basename}` | `path`, `file` |
| `bash`, `run_shell`, `shell` | Running `{argv0}`… | Ran `{argv0}` | `command` first token |
| `web_search` | Searching web for `{query}`… | Searched web for `{query}` | `query` |
| `web_fetch` | Fetching `{host}`… | Fetched `{host}` | URL host from `url` |
| `reasoning` | Reasoning… | Reasoned | — |
| other | `{Humanized tool}…` | `{Humanized tool} — done` | — |

## Collapsed summary

- **Explored** `{n}` files · `{duration}` — when ≥2 locate/read spans (`read`, `read_file`, `grep`, `glob`, `web_search`, `web_fetch`).
- Otherwise: `{spanCount}` steps · `{duration}` (e.g. `4 steps · 3.2s`).
- Hidden when `trail.spans.length === 0`.

## Phase derivation (Labs only)

Heuristic mapping from closed tool spans (no spans → no phases):

| Phase | Tool names |
| --- | --- |
| Orient | `reasoning`, `askuserquestion`, `exitplanmode`, `todowrite` |
| Locate | `read`, `read_file`, `grep`, `glob`, `web_search`, `web_fetch` |
| Edit | `write`, `write_file`, `edit`, `edit_file`, `bash`, `run_shell`, `shell` |
| Verify | `bash`/`shell` when command matches test/lint/verify/check |

Phases appear in first-seen order; collapsed chip shows joined labels (e.g. `Locate · Edit · 3.2s`).

## Redaction

`detail` and label targets redact: `LETTA_*`, `OPENAI_*`, `*_API_KEY`, `*_TOKEN`, `password`, `secret`, and env-var-like `KEY=value` patterns.

## Evidence

WS turns mirror `turn_trail` summary into `~/.otto/runs/*.jsonl` chat trace receipts.
