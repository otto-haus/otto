# otto BYOK provider contract (v1)

**Issue:** [#344](https://github.com/otto-haus/otto/issues/344)  
**Research:** [`docs/byok-fusion-provider-research.md`](../../byok-fusion-provider-research.md)  
**Related:** 078 (provider mirror), 076 (embedded Letta), [`runtime-transport.md`](../../runtime-transport.md)

## One sentence

otto **mirrors and selects** models that Letta exposes; Letta **owns** provider auth, discovery, inference, and fusion routing. otto never stores, reads back, or logs API keys.

```txt
User → otto UI (picker + Settings mirror) → Letta /v1/models + /connect → upstream provider
```

---

## Authority boundaries

| Concern | System of record | otto role |
|---------|------------------|-----------|
| API keys / OAuth | Letta (+ OS keychain) | Write-only submit; boolean mirror |
| Model catalog | Letta `GET /v1/models/` | Read + curate for picker |
| Active inference | Letta runtime | Pass `modelHandle`; show requested vs active |
| Fusion / auto routing | Letta (`letta/auto*`) | Display when listed; no otto router |
| Cost / billing | Upstream provider (+ Letta cloud) | Knowledge notes only; no charges in otto |
| Provider registration | Letta `/connect` or platform UI | Deep link / embedded handoff |

**Invariant (078):** `ProviderMirrorSnapshot` and IPC payloads contain **boolean presence only** — never key substrings.

---

## Model handle format

Handles are opaque strings in **`{provider_prefix}/{model_id}`** form, as returned by Letta.

Examples:

```txt
openai/gpt-5.5
anthropic/claude-sonnet-4-6
openrouter/anthropic/claude-sonnet-4
ollama/llama3.2
letta/auto
my-local-vllm/mistral-7b          # BYOK custom name when Letta registers it
```

otto **must not** parse handles for routing logic beyond display curation (primary/legacy/other tiers). Resolution and fallback belong to Letta + `resolveModelHandle()`.

---

## Provider categories

Letta API exposes `provider_category`:

| Value | Meaning | otto UX |
|-------|---------|---------|
| `base` | Letta-hosted or env-configured base provider | Standard row |
| `byok` | User-supplied key or custom endpoint | Show BYOK badge; explain upstream billing |

When `provider_category` is not available in list response, infer nothing — treat as unknown.

---

## Settings: connect flow (write-only mirror)

Extends 078. Required behaviors:

1. **Submit only** — password-style fields; no pre-fill, no show-key.
2. **Handoff target** — Letta `/connect` equivalent or embedded engine write path.
3. **Status rows** — per provider: `connected | missing | error | unknown`; last verified timestamp when available.
4. **Refresh** — after successful write, re-fetch `/v1/models/` and provider mirror booleans.
5. **Open Letta** — escape hatch for providers not yet mirrored in otto UI.

Forbidden:

- Persisting keys in `~/.otto/config.json` or renderer storage
- Logging key material (enforced by `check:provider-mirror-audit`)

---

## Model picker

Extends `model-picker-curation.ts` rules.

### Tiers

| Tier | Criteria | Default visibility |
|------|----------|-------------------|
| `primary` | Curated handles + `letta/auto*` + current flagship patterns | Always |
| `legacy` | Deprecated / old-family patterns | Expanded only |
| `other` | Everything else, including BYOK custom | Expanded; pin if selected |

### BYOK / custom rows

- **Label:** `display_name` → `label` → handle (existing).
- **Badge:** `BYOK` when `provider_category === 'byok'`.
- **Subtitle (optional):** `provider_name` when distinct from handle prefix.
- **No fabrication:** If Letta returns empty list, show honest empty state — not fallback catalog pretending to be live.

### Requested vs active

When `ResolvedModelHandle.fallbackReason` is set:

- Show banner in Chat header/composer area.
- Persist **requested** handle in config; **active** handle is session-only unless user accepts switch.

---

## Supported protocols (v1 priority)

otto does not implement these protocols directly — it relies on Letta provider types.

| Priority | Letta `provider_type` | Use case |
|----------|----------------------|----------|
| P0 | `openai`, `anthropic`, `letta` | Default stack + auto |
| P1 | `openrouter` | Broad BYOK + fusion catalog |
| P1 | `ollama`, `lmstudio_openai`, `vllm`, `sglang` | Local inference |
| P2 | `bedrock`, `azure`, `google_vertex` | Enterprise |
| P2 | `chatgpt_oauth`, `zai_coding`, subscription plans | Plan auth (not raw BYOK key) |
| P3 | Remaining Letta providers | On demand via Letta connect |

**OpenAI-compatible custom endpoints:** Register in Letta with `provider_type: openai` + `base_url`. otto displays whatever handles Letta returns — track upstream handle-prefix bug ([letta#3278](https://github.com/letta-ai/letta/issues/3278)).

---

## Error handling

| Failure | User-visible behavior | otto action |
|---------|----------------------|-------------|
| Handle not in catalog | Banner: requested unavailable | Keep requested; use `resolveModelHandle` fallback for session |
| Provider key missing | Settings row `missing` + connect CTA | Mirror boolean `hasApiKey: false` |
| Provider HTTP error | Non-blocking toast + retry | Log provider id + status code only |
| Unlisted BYOK model (upstream) | Explain Letta validation gap | Link to Letta issue; optional manual handle entry **deferred** until upstream fix |
| Fusion/auto unavailable | Hide or mark disabled | Do not fake `letta/auto` in static fallback list when not in API response |

---

## Testing contract

| Layer | Requirement |
|-------|-------------|
| Unit | `resolveModelHandle`, `curateModelOptions`, `visiblePickerModels` with BYOK fixtures |
| Static audit | `provider-mirror.test.ts`, `check:provider-mirror-audit` |
| Smoke | Disposable conversation only; never `conversation=default` |
| Manual | Settings key submit → model appears → chat turn succeeds |

Cost testing is **out of scope** for otto v1 — document in `knowledge/ai-frontier/provider-costs.md` during AI Frontier review.

---

## Non-goals (v1)

- otto-native provider registry or key vault
- Direct OpenRouter / Ollama clients in renderer or main process
- otto-implemented model fusion / auto routing
- Billing or quota enforcement in otto
- Bypassing Letta for inference

---

## Done test

> Can a user connect a BYOK provider through Letta, see new handles in otto's picker, select one, and get an honest error or successful turn — without otto ever holding or echoing their key?

If yes, the integration fits this contract.
