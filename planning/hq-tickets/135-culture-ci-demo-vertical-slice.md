# 135 — Culture CI Demo: 30-Second Vertical Slice

Owner: Claude
Priority: P0
Depends on: 123, 126, 132, 133, 134, 124
Release bucket: category wedge — **Culture CI** (prose); product primitive **Checks**

Label: Launch Polish

## Outcome

One reproducible **30-second demo** proves the company thesis:

```txt
Watch Otto learn a rule once, then enforce it.
```

Script:

```txt
1. Agent: “Done.” (no proof)
2. Human: “No proof. Not done.” → Correct this
3. Otto: proposal in Curation
4. Human: ratifies → Behavior updated
5. Check compiles (**132**)
6. Agent tries “Done.” again later
7. Otto blocks: “Not done: missing receipts mapped to ACs.”
8. Receipt appears (**124**)
```

This demo supersedes Remotion-only polish as the **primary launch proof** (**064** may reuse capture).

## Why this matters

Stronger than “we store Standards” or “we have Curation.”

Investor/OSS one-liner (Culture CI category — prose):

```txt
Otto is CI for agent behavior. Every correction can become a regression test.
```

Product noun in demo UI: **Checks** (not “Behavior Checks”).

## Scope

- **Demo runbook:** `docs/v1/demo-culture-ci.md` — disposable conversation, exact clicks, reset steps
- **Fixture path:** optional seeded proposal/standard/check for demo reset (no mock operational data in prod UI — demo mode flag or disposable profile only)
- **Receipt artifact:** demo run produces receipt suitable for **124** hero screenshot
- **Marketing hooks:** copy block for **065** otto.haus hero / loop diagram (Culture CI step)
- **064 coordination:** screen recording spec (1280px, captions, 30s target)

## Non-goals

- Full Remotion rebuild (**064** scope stays separate)
- Multiple demo scenarios (only No Fake Done path v1)
- Live Letta dependency for demo (may use staging with **076** embedded)

## Done when

- [ ] Sebastian can run demo from runbook on staging in ≤5 min setup
- [ ] Video or screenshot sequence attached to ticket Execution receipt
- [ ] Demo uses disposable conversation — never `conversation=default`
- [ ] Reviewer +1: “would a skeptic believe improvement is falsifiable?”

## Verification

```sh
bash apps/desktop/scripts/deploy-staging.sh
# follow docs/v1/demo-culture-ci.md end-to-end
```

## Blocker log

Leave blank unless blocked.
