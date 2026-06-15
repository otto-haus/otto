# BYOK / fusion / custom model provider research

**Issue:** [#344](https://github.com/otto-haus/otto/issues/344)  
**Status:** research complete (2026-06-14)  
**Contract:** [`docs/v1/contracts/byok-provider-contract.md`](v1/contracts/byok-provider-contract.md)

## Executive summary

otto v1 should **not** become a provider or key system of record. Letta already exposes BYOK providers, fusion/auto routing handles, and a `/v1/models/` discovery API that otto consumes today. Feasible path: extend the existing **write-only provider mirror (078)** and **model picker curation** to surface custom/BYOK handles honestly, while routing auth and inference through Letta.

**Recommendation:** Proceed with contract-first integration (mirror + picker + fallback UX). Do not build a parallel otto provider registry until Letta upstream gaps (#3229, #3278) are resolved or explicitly scoped.

---

## Terminology

| Term | Meaning in this research |
|------|--------------------------|
| **BYOK** | User supplies provider API keys to Letta; billed by upstream provider. Letta `provider_category: "byok"`. |
| **Fusion / auto routing** | Letta-managed model selection — handles `letta/auto`, `letta/auto-fast`, `letta/auto-chat`. API-gated; requires Letta cloud/router infra (Redis on self-host per upstream #3328). |
| **Custom model** | Any handle not in Letta's preconfigured catalog — typically `{provider_name}/{model_id}` from BYOK discovery or manual registration. |
| **OpenAI-compatible proxy** | BYOK provider with `provider_type: openai` + custom `base_url` (Ollama, vLLM, LM Studio, sglang, corporate gateways). |

---

## Currently available APIs (verified 2026-06-14)

### Letta (otto's runtime authority)

| Surface | Availability | otto usage today |
|---------|--------------|------------------|
| `GET /v1/models/` | Local + cloud Letta | `listLocalLettaModels()` in `letta-discovery.ts` |
| Model handles `provider/model` | Documented | Chat picker + `config.modelHandle()` |
| BYOK via `/connect` (Letta Code) | Local + Constellation subset | Settings mirror handoff (078) — write-only |
| `provider_category: base \| byok` | API schema | Not yet surfaced in otto UI |
| Auto/fusion handles | `letta/auto*`, cloud-gated | Fallback in `resolveModelHandle()` |

**Sources:** [Letta models guide](https://docs.letta.com/guides/build-with-letta/models/), [Letta providers](https://docs.letta.com/letta-code/providers/), [Letta `/v1/models/` API](https://docs.letta.com/api/resources/models).

### First-party BYOK providers (via Letta)

Letta Code documents 40+ connectable providers. Highest signal for otto v1:

| Protocol / provider | Handle prefix | Public API | Notes |
|---------------------|---------------|------------|-------|
| OpenAI API | `openai/` | Yes | Base + BYOK |
| Anthropic | `anthropic/` | Yes | Custom `base_url` supported (Letta PR #3131) |
| OpenRouter | `openrouter/` | Yes | Unified gateway; BYOK keys on OpenRouter workspace |
| Ollama (local) | `ollama/` | Local HTTP | OpenAI-compatible `/v1`; discovery bugs historically (#3037, fixed 0.15.1) |
| LM Studio | `lmstudio_openai/` | Local | OpenAI-compatible |
| vLLM / sglang | `vllm/`, `sglang/` | Self-host | OpenAI-compatible |
| AWS Bedrock | `bedrock/` | Yes | Enterprise |
| Azure OpenAI | `azure/` | Yes | Deployment-per-model |
| Google AI / Vertex | `google_ai/`, `google_vertex/` | Yes | |
| Groq, Together, Fireworks, Cerebras, xAI, Mistral, DeepSeek, Moonshot, zAI | various | Yes | BYOK API keys |
| ChatGPT / Claude subscriptions | `chatgpt_oauth/`, coding plans | OAuth/plan | Not raw API BYOK |

### OpenRouter (multi-provider fusion layer)

OpenRouter aggregates 400+ models across 60+ providers with:

- OpenAI-compatible `/v1/chat/completions`
- BYOK: user provider keys with prioritization, per-model filters, fallback chains
- 5% fee on BYOK-routed usage (OpenRouter credits)

**Sources:** [OpenRouter BYOK](https://openrouter.ai/docs/guides/overview/auth/byok), [models API](https://openrouter.ai/docs/api/api-reference/models/get-models).

When connected through Letta as `openrouter/{slug}`, otto inherits discovery via Letta's provider sync — no separate otto integration required for v1.

### Local OpenAI-compatible endpoints

| Runtime | Typical base URL | Discovery |
|---------|------------------|-----------|
| Ollama | `http://127.0.0.1:11434/v1` | `/api/tags` or OpenAI `/v1/models` |
| LM Studio | `http://127.0.0.1:1234/v1` | OpenAI `/v1/models` |
| vLLM / sglang | operator-defined | OpenAI `/v1/models` |

These are **publicly/API available** once the operator runs the server; availability is machine-local, not cloud-catalog.

---

## Fusion / auto routing availability

| Handle | Where available | Self-hosted local? |
|--------|-----------------|-------------------|
| `letta/auto` | Letta API accounts with router | Requires Redis/router infra (#3328) |
| `letta/auto-fast` | Same | Same |
| `letta/auto-chat` | Same | Same |

otto already treats `letta/auto` as primary-tier in `model-picker-curation.ts` and as the default fallback in `resolveModelHandle()`.

**Implication:** Fusion/auto is **feasible in otto UI today** when Letta exposes the handle. otto should not implement its own fusion router — display availability honestly and defer routing to Letta.

---

## Known upstream gaps (affect otto UX)

| Issue | Impact on otto |
|-------|----------------|
| [letta#3229](https://github.com/letta-ai/letta/issues/3229) | Unlisted BYOK models rejected despite working upstream API |
| [letta#3278](https://github.com/letta-ai/letta/issues/3278) | OpenAI-compatible BYOK handles prefixed `openai-proxy/` instead of provider name — breaks handle routing |
| [letta#3328](https://github.com/letta-ai/letta/issues/3328) | Self-hosted env-var providers missing from `provider_models` registry → handle 404 |
| [letta#3037](https://github.com/letta-ai/letta/issues/3037) | Custom Ollama BYOK not in `/v1/models/` (reported fixed in 0.15.1) |

otto should surface **requested vs active** fallback (already in `ResolvedModelHandle`) and never silently rewrite user selection in config.

---

## Answers to issue #344 questions

### Which fusion models are publicly/API available?

- **Letta auto family:** `letta/auto`, `letta/auto-fast`, `letta/auto-chat` — API-gated via Letta cloud/router, not a separate public model SKU.
- **OpenRouter:** 400+ models as a unified API; acts as fusion/routing layer with provider failover.
- **No standalone "fusion model" SKU** from OpenAI/Anthropic — fusion is a **routing product** (Letta auto, OpenRouter), not a model weights release.

### Which provider protocols should otto support first?

Priority order (delegate to Letta; otto mirrors + displays):

1. **Already wired:** OpenAI, Anthropic, Letta auto — primary picker tier.
2. **Next BYOK UX:** OpenRouter (widest catalog), Ollama/LM Studio (local dev), OpenAI-compatible custom `base_url`.
3. **Defer:** Direct otto-side provider SDKs, otto key storage, non-Letta inference paths.

### How should custom model handles appear in the model picker?

See contract § Model picker. Summary:

- Tier: `other` by default; pin selected handle when collapsed.
- Label: Letta `display_name` → `label` → handle.
- Badge: `BYOK` when `provider_category === 'byok'` (once plumbed from API).
- Section: "Custom / BYOK" when expanded; never mock unavailable models.

### How do we test fallback, cost, and error handling?

| Concern | Test approach |
|---------|---------------|
| Fallback | Unit: `resolveModelHandle()` + `resolveModelHandle` integration; smoke: disposable conversation, request invalid handle, assert banner |
| Cost | Knowledge layer (`knowledge/ai-frontier/provider-costs.md`); no otto billing in v1 |
| Error handling | Runtime status `fallbackReason`; Settings mirror boolean-only; no key material in logs (`check:provider-mirror-audit`) |
| BYOK connect | Manual staging: add key via Settings → refresh mirror → model list includes new handles |

---

## Implementation tickets created

Follow-up GitHub issues filed from this research (see PR body for numbers).

---

## Verification

Research-only deliverable. No runtime behavior change in this PR.

```sh
# Contract cross-links valid; no code path changes
bun run typecheck
```
