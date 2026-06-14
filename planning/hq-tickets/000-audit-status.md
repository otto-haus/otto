# HQ ticket audit

Generated: 2026-06-14T14:13:39Z
Branch: ship/functional-labs @ b3861d5

## Counts

- `_Done/`: 42 tickets
- `_Backlog/`: 20 tickets
- `_Parked/`: 29 tickets
- `root/`: 42 tickets
- `_InReview/`: 0 tickets

## Reopen summary

- Premie-dones moved `_Done` → `_Backlog`: **20** (47, 59, 63, 65, 68, 69, 71, 72, 73, 78, 80, 81, 115, 116, 119, 127, 129, 131, 134, 135)
- `_Done` tickets with open Done-when: **0**

## Rule

Folder location is truth. `_Done` requires every Done-when proven + independent `Verdict: +1`. `_Backlog` = not done.

## Full audit

| id | folder | owner | depends | reopen? | status |
|---:|---|---|---|---|---|
| 0 | `root/` | ? | none | no | no |
| 0 | `root/` | ? | none | no | no |
| 0 | `root/` | ? | none | no | no |
| 0 | `root/` | ? | none | no | no |
| 0 | `root/` | ? | none | no | no |
| 0 | `root/` | ? | none | no | no |
| 1 | `_Done/` | Cursor | none | no | +1 |
| 2 | `_Done/` | Cursor | none | no | blocked |
| 3 | `_Done/` | Claude | none | no | blocked |
| 4 | `_Done/` | Codex | none | no | blocked |
| 5 | `_Done/` | Claude | none | no | blocked |
| 6 | `_Done/` | Codex | none | no | blocked |
| 7 | `_Done/` | Claude | none | no | **+1** |
| 8 | `_Done/` | Codex | none | no | no |
| 9 | `_Done/` | Claude | none | no | blocked |
| 10 | `_Done/` | Codex | none | no | blocked |
| 11 | `_Done/` | Claude | none | no | blocked |
| 12 | `_Done/` | Codex | none | no | blocked |
| 13 | `_Done/` | Claude | none | no | blocked |
| 14 | `_Done/` | Codex | none | no | blocked |
| 15 | `_Done/` | Claude | none | no | blocked |
| 16 | `_Done/` | Codex | none | no | blocked |
| 17 | `_Done/` | Codex | none | no | blocked |
| 18 | `_Done/` | Codex | none | no | blocked |
| 19 | `_Parked/` | Codex | none | no | no |
| 20 | `_Parked/` | Cursor | none | no | no |
| 21 | `_Parked/` | Cursor | none | yes | 7 open Done-when |
| 22 | `_Parked/` | Cursor | none | yes | 5 open Done-when |
| 23 | `_Parked/` | Codex | none | no | no |
| 24 | `_Parked/` | Claude | none | no | no |
| 25 | `_Parked/` | Claude | none | no | no |
| 26 | `_Done/` | Claude | none | no | no |
| 27 | `_Done/` | Claude | none | no | -1 |
| 28 | `_Done/` | Claude | none | no | no |
| 29 | `_Done/` | Claude | none | no | no |
| 30 | `_Done/` | Claude | none | no | no |
| 31 | `_Done/` | Claude | none | no | no |
| 32 | `_Done/` | Claude | none | no | **+1** |
| 33 | `_Done/` | Claude | none | no | no |
| 34 | `_Done/` | Codex | none | no | no |
| 35 | `_Done/` | Cursor | none | no | no |
| 36 | `_Done/` | Claude | none | no | no |
| 37 | `_Done/` | Claude | none | no | no |
| 38 | `_Done/` | Cursor | none | no | no |
| 39 | `root/` | Codex | none | no | no |
| 40 | `_Done/` | Codex | none | no | no |
| 41 | `root/` | Cursor | none | no | pending |
| 42 | `root/` | Cursor | none | no | pending |
| 43 | `root/` | Cursor | none | no | pending |
| 44 | `root/` | Claude | none | no | pending |
| 45 | `root/` | Cursor | none | no | no |
| 46 | `root/` | Claude | none | yes | 9 open Done-when |
| 47 | `_Backlog/` | Cursor | none | yes | 6 open Done-when |
| 48 | `_Done/` | Cursor | none | no | no |
| 49 | `root/` | Cursor | none | no | no |
| 50 | `_Done/` | Codex (contract) + Claude (UI) | none | no | no |
| 51 | `root/` | Codex | none | no | no |
| 52 | `root/` | Cursor | none | no | +1 |
| 53 | `root/` | Cursor | none | no | no |
| 54 | `root/` | Cursor | none | no | no |
| 55 | `root/` | Cursor | none | no | no |
| 56 | `root/` | Cursor | none | no | no |
| 57 | `_Done/` | Claude | none | no | no |
| 58 | `root/` | Cursor | none | no | +1 |
| 59 | `_Backlog/` | Claude | none | yes | +1 |
| 60 | `root/` | Codex | none | no | +1 |
| 61 | `root/` | Codex | none | no | +1 |
| 62 | `root/` | Cursor | none | no | +1 |
| 63 | `_Backlog/` | Cursor + Claude | none | yes | no |
| 64 | `_Done/` | Claude | none | no | no |
| 65 | `_Backlog/` | Claude | none | yes | no |
| 66 | `root/` | Cursor | none | no | pending |
| 67 | `_Done/` | Claude | none | no | -1 |
| 68 | `_Backlog/` | Codex | none | yes | 1 open Done-when |
| 69 | `_Backlog/` | Claude | none | yes | 4 open Done-when |
| 70 | `root/` | Cursor | none | yes | 5 open Done-when |
| 71 | `_Backlog/` | Claude | none | yes | 5 open Done-when |
| 72 | `_Backlog/` | Claude | none | yes | 4 open Done-when |
| 73 | `_Backlog/` | Claude | none | yes | 5 open Done-when |
| 74 | `_Parked/` | Claude | none | yes | 4 open Done-when |
| 75 | `_Parked/` | Codex | none | yes | 3 open Done-when |
| 76 | `root/` | Codex | none | yes | 8 open Done-when |
| 77 | `_Parked/` | Codex | none | yes | 3 open Done-when |
| 78 | `_Backlog/` | Claude | none | yes | 1 open Done-when |
| 79 | `_Done/` | Codex | none | no | -1 |
| 80 | `_Backlog/` | Claude | none | yes | 2 open Done-when |
| 81 | `_Backlog/` | Claude | none | yes | 4 open Done-when |
| 82 | `_Done/` | Codex | none | no | no |
| 83 | `_Parked/` | Claude | none | yes | 3 open Done-when |
| 84 | `_Parked/` | Cursor | none | yes | 3 open Done-when |
| 85 | `_Parked/` | Codex | none | yes | 4 open Done-when |
| 86 | `_Parked/` | Cursor | none | yes | 3 open Done-when |
| 87 | `_Parked/` | Cursor | none | yes | 2 open Done-when |
| 88 | `_Parked/` | Codex | none | yes | 2 open Done-when |
| 89 | `_Parked/` | Codex | none | yes | 4 open Done-when |
| 90 | `_Parked/` | Codex | none | yes | 3 open Done-when |
| 91 | `_Done/` | Cursor | none | no | -1 |
| 92 | `_Done/` | Codex | none | no | no |
| 93 | `_Parked/` | Codex | none | yes | 4 open Done-when |
| 94 | `_Parked/` | Codex | none | yes | 3 open Done-when |
| 95 | `_Parked/` | Codex | none | yes | 3 open Done-when |
| 96 | `_Parked/` | Cursor | none | yes | 3 open Done-when |
| 97 | `_Parked/` | Cursor | none | yes | 3 open Done-when |
| 98 | `_Parked/` | Codex | none | yes | 3 open Done-when |
| 99 | `_Parked/` | Claude | none | yes | 3 open Done-when |
| 115 | `_Backlog/` | Claude | none | yes | 4 open Done-when |
| 116 | `_Backlog/` | Codex | none | yes | 3 open Done-when |
| 117 | `_Parked/` | Claude | none | yes | 3 open Done-when |
| 118 | `_Parked/` | Claude | none | yes | 2 open Done-when |
| 119 | `_Backlog/` | Claude | none | yes | 2 open Done-when |
| 120 | `_Parked/` | Codex | none | yes | 3 open Done-when |
| 121 | `root/` | Claude | none | yes | 4 open Done-when |
| 122 | `root/` | Codex | none | yes | 5 open Done-when |
| 123 | `root/` | Claude | none | yes | 4 open Done-when |
| 124 | `root/` | Claude | none | yes | 4 open Done-when |
| 125 | `root/` | Codex | none | yes | 4 open Done-when |
| 126 | `root/` | Claude | none | yes | 4 open Done-when |
| 127 | `_Backlog/` | Claude | none | yes | 4 open Done-when |
| 128 | `root/` | Codex | none | yes | 4 open Done-when |
| 129 | `_Backlog/` | Cursor | none | yes | no |
| 130 | `_Parked/` | Cursor | none | yes | 3 open Done-when |
| 131 | `_Backlog/` | Codex | none | yes | 4 open Done-when |
| 132 | `root/` | Codex | none | yes | 1 open Done-when |
| 133 | `_Done/` | Codex | none | no | +1 |
| 134 | `_Backlog/` | Claude | none | yes | 1 open Done-when |
| 135 | `_Backlog/` | Claude | none | yes | 4 open Done-when |
| 136 | `root/` | Codex | none | yes | 3 open Done-when |
| 137 | `root/` | Cursor | none | yes | 7 open Done-when |
| 138 | `root/` | Codex + Cursor | none | yes | 7 open Done-when |
| 139 | `root/` | Claude | none | yes | 6 open Done-when |
| 140 | `root/` | Cursor + Claude | none | yes | 10 open Done-when |
| 141 | `root/` | Cursor | none | yes | 4 open Done-when |
| 142 | `root/` | Cursor+Claude | none | no | pending |
