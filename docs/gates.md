# Charter Gates

One-way doors require human approval. The `charter-gates` permission overlay forces
an approval prompt before high-stakes tool calls — even in unrestricted ("yolo")
mode. It returns `ask` at approval time; once approved, execution proceeds normally.

## Gated classes

| Class | Examples detected |
| --- | --- |
| send / post / publish | email/slack/discord/imessage `send`, `gh pr/issue/release/gist create`, `npm/pnpm/yarn/bun publish` |
| deploy | `vercel/netlify/fly/heroku/wrangler/eas/expo/railway/render/surge deploy` |
| merge / force-push | `gh pr merge`, `git push --force`, any `git push` (external) |
| delete / destroy | `rm -rf`/`rm -f`, `git reset --hard`, `git clean -f`, `git branch -D`, `drop/truncate`, `kubectl delete`, `terraform apply/destroy`, cloud `delete/terminate` |
| credential / security | writes to `.env`/secret/credential/key files, `op item create/edit/delete` |
| external write | `curl -X POST/PUT/DELETE/PATCH` |
| custom/MCP tools | tool names containing delete/destroy/remove/drop/deploy/publish/send/post/email/merge/transfer/payment/charge/refund/wire |

Customer / live-file access is policy-enforced by the agent (doctrine), not pattern
detection — keep that gate in the charter's `approval_gates`.

## Approval records are first-class

Chat approval is not enough — persist it. When a gate fires, the agent writes a
scoped, time-bound record under `approvals/<id>.yaml`:

```yaml
id: <short-id>
requested_action: <exact action>
scope: <what it covers, narrowly>
evidence_required: <proof needed before/after>
requested_at: <iso8601>
expires_at: <iso8601>
status: pending          # pending | approved | denied | expired
decided_by: <name>
decided_at: <iso8601>
```

Only act on an approval that is `approved`, unexpired, and within `scope`. Re-ask
after expiry.

## Design notes

- The overlay only acts at `phase: "approval"`. Once the human approves, the
  execution-phase check returns no opinion so the call proceeds.
- `deny` is never returned by default — the goal is to *ask*, not hard-block, so the
  human stays in control of legitimacy.
- Checks are fast, deterministic, regex-based, and conservative (asking is cheap).

## Escape hatch

Set `CHARTER_GATES=off` in the environment to disable the overlay (the command
still works). Do this only intentionally.

## Extending

Add patterns to `BASH_GATES`, `SECRET_PATH`, or `TOOL_NAME_GATE` in
`extension/charter.ts`. Keep org-specific gates in a separate private config so the OSS core stays generic.
