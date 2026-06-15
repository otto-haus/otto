# Chat turn navigation

Long chat threads support keyboard jumps between **turn anchors** — the first message in each consecutive speaker block (You → otto → You …).

## Shortcuts

| Action | Shortcut |
| --- | --- |
| Previous turn | `Alt+↑` |
| Next turn | `Alt+↓` |

Shortcuts are ignored while focus is in a text field (composer, inputs) so typing is unaffected.

## Behavior

- Scrolls the chat stream so the target turn starts near the top of the viewport.
- Works on the active thread only; presentation-only — no message content is changed.
- Related: long assistant replies collapse after ~420px with an explicit **Show more** control (#162).
