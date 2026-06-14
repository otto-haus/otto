# HQ ticket audit

Generated: 2026-06-14T14:20:31Z
Branch: ship/functional-labs @ 956ef81

## Counts
- `_Done/`: 48 tickets
- `_Parked/`: 29 tickets
- root queue: 43 tickets

## Reopen summary
- `_Done` tickets flagged for reopen: **6**

## Full audit

| id | folder | owner | depends | proof_class | reopen? | open_gaps |
|---:|---|---|---|---|---|---|
| 1 | `_Done/` | Cursor | none | proven | no | foundation lane +1 |
| 2 | `_Done/` | Cursor | 001 | blocked | no | foundation lane +1 |
| 3 | `_Done/` | Claude | 001, 002 | blocked | no | foundation lane +1 |
| 4 | `_Done/` | Codex | 001, 002 | blocked | no | foundation lane +1 |
| 5 | `_Done/` | Claude | 004 | blocked | no | foundation lane +1 |
| 6 | `_Done/` | Codex | 004 | blocked | no | foundation lane +1 |
| 7 | `_Done/` | Claude | 006 | blocked | no | foundation lane +1 |
| 8 | `_Done/` | Codex | 004 | blocked | no | foundation lane +1 |
| 9 | `_Done/` | Claude | 008 | blocked | no | foundation lane +1 |
| 10 | `_Done/` | Codex | 008 | blocked | no | foundation lane +1 |
| 11 | `_Done/` | Claude | 010 | blocked | no | foundation lane +1 |
| 12 | `_Done/` | Codex | 010 | blocked | no | foundation lane +1 |
| 13 | `_Done/` | Claude | 012 | blocked | no | foundation lane +1 |
| 14 | `_Done/` | Codex | 004, 008, 010 | blocked | no | foundation lane +1 |
| 15 | `_Done/` | Claude | 014 | blocked | no | foundation lane +1 |
| 16 | `_Done/` | Codex | 015 | blocked | no | foundation lane +1 |
| 17 | `_Done/` | Codex | 016 | blocked | no | foundation lane +1 |
| 18 | `_Done/` | Codex | 001-017 | blocked | no | foundation lane +1 |
| 19 | `_Parked/` | Codex | 016, 048 | stub | no |  |
| 20 | `_Parked/` | Cursor | 016, 045, 048, 056 | stub | no |  |
| 21 | `_Parked/` | Cursor | 048, 051 | stub | no |  |
| 22 | `_Parked/` | Cursor | 021, 049, 051 | stub | no |  |
| 23 | `_Parked/` | Codex | 019, 040 | stub | no |  |
| 24 | `_Parked/` | Claude | 044, 023 | stub | no |  |
| 25 | `_Parked/` | Claude | 002, 003 | stub | no |  |
| 26 | `_Done/` | Claude | Brand Style Guide | blocked | no | craft wave with staging receipt + +1 |
| 27 | `_Done/` | Claude | Brand Style Guide | proven | no | craft wave with staging receipt + +1 |
| 28 | `_Done/` | Claude | Brand Style Guide · §09 Motion (027) · product tickets 001/002/004/005 | blocked | no | craft wave with staging receipt + +1 |
| 29 | `_Done/` | Claude | none | proven | no | craft wave with staging receipt + +1 |
| 30 | `_Done/` | Claude | 026 (icon set) | proven | no | craft wave with staging receipt + +1 |
| 31 | `_Done/` | Claude | none | proven | no | craft wave with staging receipt + +1 |
| 32 | `_Done/` | Claude | none (Launch Polish — dependency-free craft, runs out of order per the index exception) | blocked | no | craft wave with staging receipt + +1 |
| 33 | `_Done/` | Claude | none | blocked | no | bug wave with staging receipt + +1 |
| 34 | `_Done/` | Codex | none | blocked | no | bug wave with staging receipt + +1 |
| 35 | `_Done/` | Cursor | none | stub | no | bug wave with staging receipt + +1 |
| 36 | `_Done/` | Claude | none | blocked | no | bug wave with staging receipt + +1 |
| 37 | `_Done/` | Claude | none | blocked | no | bug wave with staging receipt + +1 |
| 38 | `_Done/` | Cursor | none | stub | no | bug wave with staging receipt + +1 |
| 39 | `root/` | Codex | 033, 034, 035, 036, 037, 038, **076** | blocked | no |  |
| 40 | `_Done/` | Codex | 018, 033–038 | spec_only | no | spec-only ticket with +1 |
| 41 | `root/` | Cursor | 040 | blocked | no |  |
| 42 | `root/` | Cursor | 041 | blocked | no |  |
| 43 | `root/` | Cursor | 041, 016 | blocked | no |  |
| 44 | `root/` | Claude | 042, 043 | blocked | no |  |
| 45 | `root/` | Cursor | 002, 003 | blocked | no |  |
| 46 | `root/` | Claude | 002, 003 | blocked | no |  |
| 48 | `_Done/` | Cursor | 014, 016, 002 | blocked | no | Verdict: +1 |
| 49 | `root/` | Cursor | 035, 048 | blocked | no |  |
| 50 | `_Done/` | Codex (contract) + Claude (UI) | 009 | blocked | no | Verdict: +1 |
| 51 | `_Done/` | Codex | 004, 035, 050 | unit_only | yes | +1 but proof_class=unit_only |
| 52 | `_Done/` | Cursor | 012, 013 | unit_only | yes | +1 but proof_class=unit_only |
| 53 | `root/` | Cursor | 010, 011, 052 | unit_only | no |  |
| 54 | `root/` | Cursor | 033–038 | unit_only | no |  |
| 55 | `root/` | Cursor | 054, 017 | unit_only | no |  |
| 56 | `root/` | Cursor | 054, 055 | unit_only | no |  |
| 57 | `_Done/` | Claude | 030, 056 | blocked | no | Verdict: +1 |
| 58 | `root/` | Cursor | 045, 039 | unit_only | no |  |
| 60 | `root/` | Codex | 049, 051, 039 | unit_only | no |  |
| 61 | `root/` | Codex | 053, 016, 052 | unit_only | no |  |
| 62 | `root/` | Cursor | 055, 052 | unit_only | no |  |
| 64 | `_Done/` | Claude | 063, 033, 057 | blocked | no | Verdict: +1 |
| 66 | `root/` | Cursor | 056, 041 | unit_only | no |  |
| 67 | `_Done/` | Claude | none | blocked | no | Verdict: +1 |
| 70 | `_Done/` | Cursor | 069 | unit_only | yes | +1 but proof_class=unit_only |
| 74 | `_Parked/` | Claude | 021, 056 | stub | no |  |
| 75 | `_Parked/` | Codex | 022, 051 | stub | no |  |
| 76 | `root/` | Codex | 033, 034, 035, 036, 037, 038 | blocked | no |  |
| 77 | `_Parked/` | Codex | 076, 039 | stub | no |  |
| 79 | `_Done/` | Codex | 076, 039 | spec_only | no | spec-only ticket with +1 |
| 82 | `_Done/` | Codex | 018 | spec_only | no | spec-only ticket with +1 |
| 83 | `_Parked/` | Claude | 082, 065 | stub | no |  |
| 84 | `_Parked/` | Cursor | 083 | stub | no |  |
| 85 | `_Parked/` | Codex | 084, 079 | stub | no |  |
| 86 | `_Parked/` | Cursor | 085 | stub | no |  |
| 87 | `_Parked/` | Cursor | 084, 056 | stub | no |  |
| 88 | `_Parked/` | Codex | 087 | stub | no |  |
| 89 | `_Parked/` | Codex | 082, 084 | stub | no |  |
| 90 | `_Parked/` | Codex | 082 | stub | no |  |
| 91 | `_Done/` | Cursor | none | spec_only | no | spec-only ticket with +1 |
| 92 | `_Done/` | Codex | 017, 051, 082 | spec_only | no | spec-only ticket with +1 |
| 93 | `_Parked/` | Codex | 076, 092 | stub | no |  |
| 94 | `_Parked/` | Codex | 092, 084 | stub | no |  |
| 95 | `_Parked/` | Codex | 094, 060 | stub | no |  |
| 96 | `_Parked/` | Cursor | 092, 084 | stub | no |  |
| 97 | `_Parked/` | Cursor | 092, 086, 085 | stub | no |  |
| 98 | `_Parked/` | Codex | 094, 095, 039 | stub | no |  |
| 99 | `_Parked/` | Claude | 092, 020, 087 | stub | no |  |
| 117 | `_Parked/` | Claude | 115, 116 | stub | no |  |
| 118 | `_Parked/` | Claude | 115 | stub | no |  |
| 120 | `_Parked/` | Codex | 119, 093, 076 | stub | no |  |
| 121 | `root/` | Claude | 048, 051, 016 | unit_only | no |  |
| 122 | `_Done/` | Codex | 008, 009, 017 | unit_only | yes | +1 but proof_class=unit_only |
| 123 | `root/` | Claude | 048, 002, 014 | unit_only | no |  |
| 124 | `root/` | Claude | 004, 005, 045, 059 | unit_only | no |  |
| 125 | `_Done/` | Codex | 122, 051, 008, 124 | unit_only | yes | +1 but proof_class=unit_only |
| 126 | `root/` | Claude | 048, 123, 016, 051 | unit_only | no |  |
| 128 | `_Done/` | Codex | 048, 016, 047, 122 | unit_only | yes | +1 but proof_class=unit_only |
| 130 | `_Parked/` | Cursor | 053, 076, 039 | stub | no |  |
| 132 | `root/` | Codex | 131, 048, 126, 008, 009 | unit_only | no |  |
| 133 | `_Done/` | Codex | 131, 132, 051, 045, 004, 016 | unit_only | no | culture CI core +1 (unit) |
| 136 | `root/` | Codex | none | stub | no |  |
| 137 | `root/` | Cursor | 136 | stub | no |  |
| 138 | `root/` | Codex + Cursor | 136, 076, 137 | stub | no |  |
| 139 | `root/` | Claude | 137, 136 | stub | no |  |
| 140 | `root/` | Cursor + Claude | 136, 137, 138, 139, 063 | stub | no |  |
| 141 | `root/` | Cursor | 137 | stub | no |  |
| 142 | `root/` | Cursor+Claude | 063, 140 | stub | no |  |
| 143 | `root/` | Claude | 028 (done), 032 (done), 033 | stub | no |  |
| 144 | `root/` | Claude | 143, 069 | stub | no |  |
| 145 | `root/` | Claude | 143, 076, 078 | stub | no |  |
| 146 | `root/` | Cursor | 145, 002 (done), 076 | stub | no |  |
| 147 | `root/` | Claude | 146, 001 (done), 070, 073 | stub | no |  |
| 148 | `root/` | Claude | 147, 005 (done), 071, 126 | stub | no |  |
| 149 | `root/` | Claude | 143, 144, 145, 146, 147, 148, 027 (done), 081 | stub | no |  |
| 0 | `root/` |  |  | stub | no |  |
| 0 | `root/` |  |  | unit_only | no |  |
| 0 | `root/` |  |  | stub | no |  |
| 0 | `root/` |  |  | stub | no |  |
| 0 | `root/` |  |  | stub | no |  |
| 0 | `root/` |  |  | unit_only | no |  |
