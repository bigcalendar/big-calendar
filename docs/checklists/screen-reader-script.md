# Screen-reader script

Run by a person, once per slice, before approval (D-42). Source: [interaction and accessibility](../spec/interaction-accessibility.md).

> **The tasks below are a skeleton.** P3 writes the full script per family (roles, keyboard map, focus model and expected announcements) from the vanilla prototype. When P3 is approved, its expected announcements replace the placeholders here.

## Setups

| Setup                      | Required     |
| -------------------------- | ------------ |
| VoiceOver + Safari (macOS) | Yes          |
| NVDA + Firefox (Windows)   | Yes          |
| JAWS                       | If available |

## Recording results

For each task and setup, record: pass or fail, what was announced, and any difference from the expected announcement. Put the results in the slice PR.

## Tasks

For each family the slice touches:

1. **Orientation.** Tab into the calendar. Expected: the labelled section, then the grid, with its position (P3).
2. **Navigate.** Use the arrow keys through days or slots, crossing a week or day boundary. Expected: each cell's date (and time) and its events (P3).
3. **Today.** Reach today. Expected: today is announced as current.
4. **Change period.** Use the toolbar to go to the next period. Expected: the new date label is announced once (polite live region).
5. **Select.** Use Shift+Arrow to select a range. Expected: the range is announced (P3).
6. **Events.** Tab to the event group, move between events, and activate one with Enter. Expected: the composed event name (title, time or "All day", date, resource, "Recurring").
7. **Secondary action.** Open the context menu with Shift+F10. Expected: a menu with its items.
8. **Overflow.** Open "+N more". Expected: the full-date header and the same event names as the grid; closing returns focus to the button.
9. **Keyboard DnD** (from S4). Move an event with the keyboard. Expected: start, each step, drop or cancel (P3).
10. **Rollback** (from S1). Trigger a rejected change. Expected: the rollback is announced.
11. **Family hops** (from S2). Move between the all-day row and the time body. Expected: the defined focus hop (P3).
12. **DST** (from S2). On a fall-back day, reach events in both 01:30 hours. Expected: the two occurrences are distinguishable (P3, T-14).
