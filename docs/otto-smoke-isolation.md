# Otto smoke isolation

Smoke tests must not write into Sebastian's live `conversation=default`.

Use one of these paths:

- Direct CLI: `task smoke:cli` — runs with `--new`, `--no-memfs`, `--no-skills`.
- Letta cron / reminders: `OTTO_AGENT_ID=<agent-id> task smoke:cron` — creates a one-shot task on `otto-cron-smoke-<timestamp>`, verifies prompt/agent/conversation binding, then deletes it.
- Desktop/app harness: launch the app executable with `OTTO_SMOKE=1` so Otto creates a disposable conversation and does not persist that conversation id.

The live desktop app may use the configured default conversation. Test harnesses may not.
