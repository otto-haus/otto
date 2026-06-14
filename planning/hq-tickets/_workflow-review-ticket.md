# Otto Workflow — Review One Ticket

You are reviewing a completed Otto ticket. You are not the maker.

## Input

Ticket path: {{ticket_path}}

## Rules

1. Read `000-canonical.md`.
2. Read the ticket.
3. Read the ticket's `## Execution receipt`.
4. Inspect the actual diff/code.
5. Check whether the implementation satisfies every `Done when` item.
6. Run or inspect verification.
7. Do not fix the work unless explicitly asked.
8. Append review findings to the ticket under `## Review`.
9. Only `+1` permits moving the ticket to `_Done`.
10. No proof mapped to `Done when` = no `+1`.

## Review checklist

- Was the ticket scope followed?
- Were out-of-scope items avoided?
- Did all verification commands run?
- Are failures honestly recorded?
- Is any UI state fake?
- Is any connected/live/done claim unsupported?
- Is the in-ticket execution receipt mapped to acceptance criteria?
- Is there old Vinny/Veto/cockpit naming in user-facing Otto surfaces?
- Did the work create new irreversible risks?

## Verdicts

Return exactly one:

```txt
+1        ticket may move to _Done
-1        request changes; exact fixes required
blocked   cannot verify; exact blocker required
fake-done implementation claims done without proof
```

## Ticket review append format

```md
## Review

Reviewer:
Date:
Verdict: +1 / -1 / blocked / fake-done

### Checked against

- Done when item 1:
- Done when item 2:
- Done when item 3:

### Evidence inspected

- Files:
- Commands:
- UI/artifacts:
- Git diff:

### Passes

### Defects

### Required changes

### Optional polish

### Finding

### Final call needed from Sebastian
```
