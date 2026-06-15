# Otto gates overlay — twitter-automation

Upstream skill: qu-skills/skills `twitter-automation`. This file is otto policy; it does not modify upstream content.

## Autonomy matrix

| Action | Gate | Notes |
|--------|------|-------|
| Draft tweet/copy locally | Green | No belt call |
| Read tweet / user profile | Green | Read-only belt apps |
| Post tweet / media | **Red** | Sebastian approval + receipt |
| Like / retweet | **Red** | Engagement is outbound |
| DM send | **Red** | Private outbound |
| Follow user | **Red** | Account relationship change |
| Delete post | **Red** | Destructive on platform |
| belt login / inference.sh spend | **Red** | Spend gate |

## Claim boundaries

- otto agents must not post, DM, follow, or engage on X without explicit human approval for that specific action.
- Drafts are not sends. Show draft; wait for approve.
- Receipt after approved send: tweet ID or belt run output saved under `docs/receipts/` or PR body.
- Do not store X or inference.sh tokens in otto repo or desktop config.

## Prerequisites

Skill requires `belt` CLI (`npx skills add belt-sh/cli`). Vet belt separately before installing.
