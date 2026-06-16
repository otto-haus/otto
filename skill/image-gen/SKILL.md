---
name: image-gen
description: Image generation via Letta tool — artifacts saved locally; publish/external use is a red zone.
---

# Image generation skill (stub)

## Triggers

- generate image, image gen, gpt-image, illustration, diagram asset

## Constraints

- **Gate:** `image_gen` Labs feature must be enabled in Settings → Voice & image (Labs).
- **Keys:** OpenAI Images auth lives in Letta — otto never stores or reads back provider keys.
- **Artifacts:** Saved under `~/.otto/artifacts/` with provenance metadata; not auto-canon.
- **Red:** publish, post, or ship generated images externally without explicit approval.
- **Red:** treat generated pixels as ratified standards, receipts, or canon without human review.

## Autonomy

- `image_gen.request`: yellow — allowed when Labs gate on; write artifact + receipt
- `image_gen.publish`: red — external distribution requires approval

## UI truth

Generated images display **generated · not ratified** until a ratification workflow accepts them.
