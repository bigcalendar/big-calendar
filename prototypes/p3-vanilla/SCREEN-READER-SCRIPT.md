# P3 screen-reader run: VoiceOver + Safari

The spec being tested is [`docs/spec/accessibility.md`](../../docs/spec/accessibility.md). This run takes about 30–40 minutes. The NVDA + Firefox run uses the same steps once Windows is available.

## Before you start

1. **Start the prototype:** in the repo, run `node prototypes/p3-vanilla/serve.mjs`, then open `http://localhost:4800/?view=month` in **Safari**.
2. **Let Tab reach every control:** Safari ▸ Settings ▸ Advanced ▸ turn on **"Press Tab to highlight each item on a webpage"**. Without it, Tab skips buttons in Safari.
3. **Turn on VoiceOver:** Command+F5.
4. **Turn QuickNav off** if it's on: press Left Arrow and Right Arrow together until VoiceOver says "QuickNav off". With QuickNav on, VoiceOver eats the arrow keys and the calendar never sees them.
5. Use **plain keys** (Tab, arrows, Enter, Escape) unless a step says otherwise. Don't use VoiceOver's own navigation (Control+Option+arrows) except in step 0.

**What to record for each step:** pass or fail, and for any fail, roughly what VoiceOver said. Exact wording doesn't need to match. What matters:

- the information is there, in a sensible order;
- nothing important is missing or repeated many times;
- nothing is announced that shouldn't be.

VoiceOver adds its own words (such as "button", "grid", "selected", "current date"). Those are expected.

## Steps

### Month view (`?view=month`)

| #   | Do                                                                                                 | Expect to hear (roughly)                                                                                                               | Result |
| --- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 0   | Press Control+Option+Right Arrow a few times from the top of the page until you reach the calendar | "Calendar, October 2026", as a region or landmark                                                                                      |        |
| 1   | Click the **Today** button once, then press Tab                                                    | Focus is on a day: "Wednesday, October 28, 2026, 6 events", plus that it's the current date and part of a grid ("Month, October 2026") |        |
| 2   | Right Arrow, then Down Arrow                                                                       | "Thursday, October 29, 2026, 1 event", then "Thursday, November 5, 2026, no events, next month"                                        |        |
| 3   | Up Arrow, Left Arrow (back to the 28th), then Shift+Right Arrow twice                              | "Selected Wednesday, October 28 to Friday, October 30, 3 days", spoken once after you stop                                             |        |
| 4   | Escape                                                                                             | "Selection cleared"                                                                                                                    |        |
| 5   | Tab                                                                                                | The first event on the 28th: "9 AM Standup, 9:00 to 9:15 AM, Wednesday, October 28, Recurring"                                         |        |
| 6   | Down Arrow twice                                                                                   | "10 AM Design review, …, Room A", then "4 more events, Wednesday, October 28"                                                          |        |
| 7   | Enter                                                                                              | A dialog: "Wednesday, October 28, 2026". Focus on the first event in it, named without the date                                        |        |
| 8   | Down Arrow, then Escape                                                                            | The next event in the list, then focus back on "4 more events, Wednesday, October 28"                                                  |        |
| 9   | Shift+Tab                                                                                          | Back on the day: "Wednesday, October 28, 2026, 6 events"                                                                               |        |
| 10  | Page Down, then Page Up                                                                            | The heading announces "November 2026", then "October 2026", once each. The focused day says its date each time                         |        |
| 11  | Tab, then Shift+F10                                                                                | A menu: "Actions for Standup", with "Open" focused                                                                                     |        |
| 12  | Down Arrow, Enter                                                                                  | "Moving Standup. Use arrow keys to move, Enter to drop, Escape to cancel. Or click a slot to drop it there."                           |        |
| 13  | Right Arrow three times, quickly                                                                   | One announcement only, where it settled: "…Saturday, October 31, …, not allowed: on a weekend"                                         |        |
| 14  | Enter                                                                                              | The drop is refused: the same "not allowed" message, and nothing moves                                                                 |        |
| 15  | Left Arrow, Enter                                                                                  | "…Friday, October 30…", then "Dropped. … Waiting for the app to confirm." Focus stays on Standup, which now says "Pending"             |        |
| 16  | Wait 2 seconds, then Shift+F10, Down, Enter, Right Arrow, Escape                                   | "Moving Standup…", one position, then "Move cancelled. Standup is back where it was."                                                  |        |

### Week view (click the "Week" link at the top)

| #   | Do                                                | Expect to hear (roughly)                                                                                                                          | Result |
| --- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 17  | Click **Today**, then Tab                         | An all-day cell: "All day, Wednesday, October 28, 1 event", in a grid named "All-day events, October 25 – 31, 2026"                               |        |
| 18  | Down Arrow                                        | The hop: focus moves into a different grid ("Times, …") on "12:00 to 12:30 AM, Wednesday, October 28". Does VoiceOver make the grid change clear? |        |
| 19  | Up Arrow                                          | Back in the all-day grid on Wednesday                                                                                                             |        |
| 20  | Tab, then Down Arrow a few times                  | In the time grid, one slot at a time: "12:30 to 1:00 AM, Wednesday, October 28", …                                                                |        |
| 21  | Shift+Down Arrow twice, then Enter                | "Selected …", then "App: onSelectSlot: …"                                                                                                         |        |
| 22  | Tab                                               | The first event at or after that time. Is it clear you've left the grid?                                                                          |        |
| 23  | Shift+Tab                                         | Back on the event's own slot in the time grid                                                                                                     |        |
| 24  | In the time grid, move to Friday 9:00 AM (arrows) | "9:00 to 9:30 AM, Friday, October 30", then the description "Busy: Team offsite"                                                                  |        |

### DST weeks (links at the top of the page)

| #   | Do                                                                                                                                                       | Expect to hear (roughly)                                                                                                                   | Result |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------ |
| 25  | Click the **Fall-back week** link. Press Tab until you hear a time slot (past the page links, the toolbar and the all-day grid), then press Control+Home | "12:00 to 12:30 AM, Sunday, November 1"                                                                                                    |        |
| 26  | Down Arrow three times                                                                                                                                   | "1:30 to 2:00 AM, Sunday, November 1, first or second occurrence (EDT or EST)"                                                             |        |
| 27  | Tab, then Down Arrow                                                                                                                                     | "Shift handover, 1:30 to 2:00 AM EDT, …", then "Server patch, 1:30 to 2:30 AM EST, …". Are the two occurrences clearly different?          |        |
| 28  | Click the **Spring-forward week** link. Tab to a time slot as in step 25, press Control+Home, then Down Arrow four times                                 | 12:00, 12:30, 1:00 and 1:30 AM, then "3:00 to 3:30 AM, Sunday, March 8, after the daylight-saving change". The 2:00–3:00 slots are skipped |        |

### General impressions

| Question                                                                                      | Answer |
| --------------------------------------------------------------------------------------------- | ------ |
| Were any names too long to be useful? Which ones?                                             |        |
| Was anything announced twice in a row?                                                        |        |
| Did you ever lose track of where focus was?                                                   |        |
| Did VoiceOver ever take over the arrow keys (a sign QuickNav or a VoiceOver mode interfered)? |        |
| Anything else that felt wrong or slow?                                                        |        |

## After the run

Paste the filled tables back into the conversation, or edit this file and commit it. Each fail becomes a numbered finding in section 13 of the spec, with a new decision for the change made.
