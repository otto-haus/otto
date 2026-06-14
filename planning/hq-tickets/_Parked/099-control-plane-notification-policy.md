# 099 — Control Plane: Notification Policy

Owner: Claude
Priority: P2
Depends on: 092, 020, 087
Release bucket: cathedral / always-on

**Unpark when:** **092** reviewed; **020** or **087** unparked.

## Outcome

**Notification routing table** by severity and autonomy class: in-app, Discord, cloud feed, Letta remote HITL — documented and wired for approval-required paths.

## Scope

- Policy doc: class → channels → quiet hours (optional v2)
- Wire approval-required to Discord (**020**/**087**)
- No spam on info receipts by default

## Done when

- [ ] `docs/v1/contracts/notification-policy.md` merged
- [ ] One approval round-trip notifies configured channel
- [ ] Reviewer +1

## Blocker log

Leave blank unless blocked.
