# Screen-reader script

Run by a person, once per slice, before approval (D-42). The expected announcements come from [accessibility](../spec/accessibility.md) (P3, D-91); section numbers below refer to it. The P3 prototype run (`prototypes/p3-vanilla/SCREEN-READER-SCRIPT.md`) is a worked example with exact fixture data.

## Setups

| Setup                      | Required     |
| -------------------------- | ------------ |
| VoiceOver + Safari (macOS) | Yes          |
| NVDA + Firefox (Windows)   | Yes          |
| JAWS                       | If available |

Before starting:

- **Safari:** Settings ▸ Advanced ▸ "Press Tab to highlight each item on a webpage", or Tab skips buttons.
- **VoiceOver:** turn QuickNav off (Left and Right Arrow together), or VoiceOver takes the arrow keys.
- **NVDA:** the grid should switch NVDA to focus mode on its own; note it if you have to press NVDA+Space.
- Use plain keys (Tab, arrows, Enter, Escape) unless a task says otherwise.

## Recording results

For each task and setup, record: pass or fail, roughly what was announced, and any difference from the expected announcement. Exact wording doesn't need to match; the information, its order, and the absence of repeats do. Screen readers add their own words ("button", "grid", "selected", "current date"); those are expected. Put the results in the slice PR. A fail becomes a finding and, if the spec changes, a new decision.

## Tasks

Run the tasks for each family the slice touches. The examples use English messages and the America/New_York zone.

### Every view

| #   | Do                                                                       | Expect (roughly)                                                                                                    | Spec |
| --- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- | ---- |
| 1   | Find the calendar with the screen reader's landmark or region navigation | "Calendar, October 2026" as a region                                                                                | 2.1  |
| 2   | Tab into the toolbar, then Left/Right                                    | One Tab stop; arrows move between Today, Previous, Next and the view switcher; "Previous week", "Next week"         | 2.2  |
| 3   | Activate Next, then Previous                                             | The date label announced once each time, not on first render                                                        | 2.2  |
| 4   | Open the view switcher                                                   | "View: Week", a menu of radio items with the current one checked                                                    | 2.2  |
| 5   | Tab through the whole calendar                                           | Toolbar, then each grid (one stop each), then the event group (one stop), then the side panel if open; nothing else | 2.3  |

### Day grid (month)

| #   | Do                                    | Expect (roughly)                                                                                                            | Spec     |
| --- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | -------- |
| 6   | Tab into the grid                     | The focused day: "Wednesday, October 28, 2026, 3 events", that it's the current date, and the grid's name                   | 3.1      |
| 7   | Arrows, including into the next month | Each day's name; days outside the month end with "next month" or "previous month"                                           | 3.1      |
| 8   | Page Down, then Page Up               | The new month label once each; the focused day keeps its day number                                                         | 3.2      |
| 9   | Shift+Right twice, then pause         | "Selected Wednesday, October 28 to Friday, October 30, 3 days", once, after you stop                                        | 6.1      |
| 10  | Escape                                | "Selection cleared"                                                                                                         | 3.2      |
| 11  | Tab, then Down through the events     | The day's first event: "9 AM Standup, 9:00 to 9:15 AM, Wednesday, October 28, Recurring"; then each event in order          | 2.6, 3.3 |
| 12  | Reach "+N more" and press Enter       | "3 more events, Wednesday, October 28"; a dialog named with the full date; focus on its first event, named without the date | 3.3      |
| 13  | Escape                                | Focus back on the "+N more" button                                                                                          | 3.3      |
| 14  | Shift+Tab from an event               | Back on that event's day in the grid                                                                                        | 2.3      |

### Time grid (day, week, work week)

| #   | Do                                      | Expect (roughly)                                                                                                     | Spec     |
| --- | --------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | -------- |
| 15  | Tab into the all-day grid               | "All day, Wednesday, October 28, 1 event", in the all-day grid                                                       | 4.1      |
| 16  | Down Arrow                              | The hop: a different grid ("Times, …"), on "12:00 to 12:30 AM, Wednesday, October 28". The grid change is announced  | 4.3      |
| 17  | Up Arrow                                | Back in the all-day grid on the same day                                                                             | 4.3      |
| 18  | In the time grid, Down and Right        | One slot at a time, each with its date: "12:30 to 1:00 AM, Wednesday, October 28"; Right keeps the time, changes day | 4.2      |
| 19  | Shift+Down twice; then Shift+Right      | "Selected 9:00 to 10:30 AM, Wednesday"; then one continuous span: "9:00 AM Wednesday to 10:30 AM Thursday"           | 4.2, 6.1 |
| 20  | Enter                                   | The app's slot callback runs with the selection                                                                      | 3.2      |
| 21  | Move to a slot under a background event | The slot's name, then its description: "Busy: Team offsite"                                                          | 6.6      |
| 22  | Tab, then Shift+Tab                     | The first event at or after the focused slot; then back on that event's own slot                                     | 2.3      |

### DST weeks (when the slice touches the time grid)

| #   | Do                                         | Expect (roughly)                                                                                         | Spec |
| --- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------- | ---- |
| 23  | Fall-back day: move through 1:00–2:00 AM   | "1:30 to 2:00 AM, Sunday, November 1, first or second occurrence (EDT or EST)"                           | 4.4  |
| 24  | Tab to the events in that hour             | The two occurrences are told apart by zone: "Shift handover, 1:30 to 2:00 AM EDT, …", "… 1:30 AM EST, …" | 4.4  |
| 25  | Spring-forward day: move down past 1:30 AM | The 2:00–3:00 slots are skipped: "3:00 to 3:30 AM, Sunday, March 8, after the daylight-saving change"    | 4.4  |

### Interactions (when the slice touches events)

| #   | Do                                       | Expect (roughly)                                                                                             | Spec     |
| --- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------ | -------- |
| 26  | On an event, Shift+F10 (or the menu key) | A menu, "Actions for Standup", with "Open" first                                                             | 6.3      |
| 27  | Choose Move                              | "Moving Standup. Use arrow keys to move, Enter to drop, Escape to cancel. Or click a slot to drop it there." | 6.4      |
| 28  | Arrow three times quickly                | One announcement, where it settled; an invalid place adds "not allowed: <reason>"                            | 2.5, 6.4 |
| 29  | Enter on an invalid place                | The drop is refused with the same reason; nothing moves                                                      | 6.4      |
| 30  | Move to a valid place and Enter          | "Dropped. … Waiting for the app to confirm."; focus stays on the event, whose name now ends with "Pending"   | 6.4      |
| 31  | Start a move, then Escape                | "Move cancelled. Standup is back where it was."; focus on the event                                          | 6.4      |
| 32  | Make the app reject a change             | An assertive announcement of the rollback (the only assertive message)                                       | 2.5      |

### Prebuilt extras (when the slice ships them)

| #   | Do                                | Expect (roughly)                                                                          | Spec |
| --- | --------------------------------- | ----------------------------------------------------------------------------------------- | ---- |
| 33  | Mini calendar: arrows, Page Down  | A date-picker grid; each date; the month label announced on Page Down                     | 7.1  |
| 34  | Resource panel: arrows, Space     | A tree with levels and positions; Space toggles: "Room A, hidden" / checked state         | 7.2  |
| 35  | Source list: Tab, Space           | Native checkboxes in a named group, one per source                                        | 7.3  |
| 36  | Delete an event                   | A modal dialog with its message; focus on Cancel; focus back on the opener when it closes | 7.4  |
| 37  | Collapse the side panel, then Tab | Nothing in the panel is reachable or announced                                            | 2.1  |

## General impressions

Answer for each setup:

- Were any names too long to be useful? Which ones?
- Was anything announced twice in a row?
- Did you ever lose track of where focus was?
- Did the screen reader take over the arrow keys?
- Anything else that felt wrong or slow?
