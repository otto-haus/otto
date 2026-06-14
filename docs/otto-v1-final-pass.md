# otto v1 final pass

Status: final polish before switching the live conversation into otto.

## Confirmed

- Live app is `/Applications/otto.app` built from `apps/desktop`.
- Chat connects to the local Letta runtime and this local agent.
- Smoke checks are isolated from `conversation=default`.
- Provider auth belongs in Letta; otto does not ask for or store provider API keys in v1.
- Model and effort are selected in otto and applied through Letta model/preset handles.
- Chat supports queued follow-ups while a run is active.

## Intentional empty states

These panes must stay honest until real loaders exist:

- Charters
- Standards
- Routines
- Curation
- Receipts
- Autonomy

Practices is file-backed from real `practice.yaml` specs, so the Charter card in Practices is not mock Charter data.

## Remaining gates before public release

- Sebastian approval for public release/tag/final license/naming.
- No website required for v0.1.
- No fake Done: every shipped claim needs checks/receipts.
