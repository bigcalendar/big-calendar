# Accessibility (P3)

> **Normative.** P3, the accessibility spec, approved 2026-10-29 (**D-91**). Tested on the vanilla prototype in `prototypes/p3-vanilla/` with axe on three engines and a full VoiceOver + Safari run; the maintainer's answers are D-89, and the machine pattern is D-90. Two items still need the **NVDA + Firefox run**, which happens before S1 starts (D-91); they're marked **NVDA check**. Changing anything here needs a new entry in the [decision log](../decisions.md).

Sources: [interaction and accessibility](interaction-accessibility.md) (D-50, D-51), [engine](engine.md), [time semantics](time-semantics.md) (T-14), [data model](data-model.md) (D-39), [gap additions](gap-additions.md) (#4, #13, #14, #16), [support matrix](support-matrix.md). Exit criteria: [roadmap](roadmap.md#planning-phase), row P3.

**Standard:** WCAG 2.2 level AA. **Screen readers:** VoiceOver + Safari (macOS), run in P3; NVDA + Firefox (Windows), run before S1 starts (D-91). Mobile screen readers are covered by the per-slice real-device checks from S1.

## 1. Principles

1. **Behavior is specified here once and implemented once**, in the interaction machines. Every rule below is something a machine or a prop-getter does; the binding and prebuilt UI only render it.
2. **Keyboard first, pointer equal.** Every pointer action has a keyboard path, and every drag has a single-pointer path without dragging (WCAG 2.5.7).
3. **One Tab stop per composite** (D-51). Arrow keys move inside a composite. Tab moves between composites.
4. **Names are built, not scraped, and start with what's visible.** Every event, slot and day gets its accessible name from the overridable name composer (D-50), using `messages` strings (D-40). The name may say more than the visible text, but it **always starts with the part's visible label** (WCAG 2.5.3 Label in Name), so speech-input users can say what they see. The visible chip "10 AM Dentist" is named "10 AM Dentist, 10:00 to 11:00 AM, Monday, October 26". (Prototype finding 1.)
5. **Announce changes, not state.** The live region speaks when something changes that the user didn't directly cause through focus: the period changed, a selection grew, a drop happened, a change was rolled back. Focus movement speaks for itself.
6. **No single-character shortcuts** at 1.0 (WCAG 2.1.4). Every key binding uses a modifier, a navigation key, Enter, Space, Escape, Delete, Shift+F10 or the menu key. Configurable shortcuts are post-1.0 (D-80 #10).

## 2. Structure shared by every view

### 2.1 Landmarks and regions

| Part                                                    | Element and roles                                           | Name                                                                                          |
| ------------------------------------------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Calendar root                                           | `<section>` (a `region` landmark because it is named)       | `aria-labelledby` → the toolbar date label, prefixed by `messages.calendarLabel` ("Calendar") |
| Side panel (mini calendar, resource panel, source list) | `<aside>`; `aria-hidden="true"` and `inert` while collapsed | `messages.sidePanelLabel`                                                                     |
| Panel toggle                                            | `<button aria-controls="<aside id>" aria-expanded>`         | `messages.toggleSidePanel`                                                                    |

**Decided (D-89):** `inert` as well as `aria-hidden` on the collapsed panel, so its controls can't be reached by Tab either. `inert` is Baseline (support matrix).

### 2.2 Toolbar

- A `role="toolbar"` with `aria-label` (`messages.toolbarLabel`), arrow-key roving between its controls and **one Tab stop** (APG toolbar pattern) (D-89), so the toolbar doesn't cost five Tab presses on every pass.
- **Today**, **Previous** and **Next** are buttons. Previous and Next have names that include the unit: "Previous week", "Next month".
- **The date label** (for example "October 2026" or "October 25 – 31, 2026") is a heading (`<h2>` by default; the level is a prop) and a **polite live region** (D-50). It is announced once per navigation, not on first render.
- **The view switcher** is a menu button (`aria-haspopup="menu"`, `aria-expanded`) opening a `role="menu"` of `menuitemradio` items with `aria-checked` (D-50). The button's name includes the current view: "View: Week".

### 2.3 Tab order

In every view, in this order:

1. the toolbar (one stop);
2. the view's grids, in visual order (each one stop): for the week view, the all-day grid then the time grid;
3. the **event group** (one stop) for the whole view;
4. the side panel's composites, if open.

The event group's **entry point follows the grid** (D-89): pressing Tab from a focused day or slot lands on the first event on or after that day or slot. Shift+Tab from an event lands on that event's day or slot in the grid. So "Tab" means "the events here", and "Shift+Tab" means "back to where this event is".

### 2.4 Grid metadata (D-50)

Every grid sets `aria-rowcount` and `aria-colcount` for its full size, and `aria-rowindex` and `aria-colindex` on rows and cells, so virtualized or clipped grids still report true positions. Today's cell has `aria-current="date"`. Week numbers are visually shown, `aria-hidden`, and attached to each day in their row with `aria-labelledby` (D-50), so the day's name ends with "week 44".

### 2.5 The live region

- One polite region per calendar, rendered from `getLiveRegionProps()`: `role="status"`, `aria-live="polite"`, `aria-atomic="true"`, visually hidden. The toolbar label is a second, separate polite region (D-50).
- **Decided (D-89):** a rejected change (rollback) is the only assertive message, sent through a second, `role="alert"` region, because the user's last action was undone.
- Messages are **debounced** (150ms), so rapid arrow presses during a keyboard move announce only where the move settled.
- The region is cleared before each message, so repeating the same message is still announced.

### 2.6 Event names (D-50)

The default composer joins, in this order, the parts that apply:

1. the part's visible label (by default the title; for a month chip with a time prefix, "10 AM Dentist");
2. time: "9:00 to 9:15 AM", or `messages.allDay` ("All day"); for an event that spans days, its start and end with dates;
3. date: "Wednesday, October 28" (omitted inside a single-day popover whose header already says it);
4. resources: "Room A" (and "and 2 more" past two);
5. flags: "Recurring", "Tentative", "Cancelled", "Read-only", "Pending" (a change is waiting for the app), "Invalid" (D-76);
6. a zone note, when the event's zone differs from the display zone (T-6) or the time falls in a repeated DST hour (T-14, section 4.4).

`tooltip` (D-74) becomes the event's `aria-description` when it differs from the composed name. VoiceOver reads `aria-description` (P3 run). **NVDA check:** NVDA reads it too.

Continuation pieces of a multi-day event (the parts on later rows or columns) are `aria-hidden`, and only the first visible piece is in the event group (D-50). Its name says it continues: "…, continues until Friday".

### 2.7 Decorative parts (D-50)

`aria-hidden="true"`: drag previews, continuation pieces, color dots, icons, the time axis, the "now" indicator line, and background-event blocks (their titles go into slot descriptions instead, D-39).

## 3. Day grid (month)

### 3.1 Roles

```
section (region, named)
├─ toolbar
└─ div role="grid" aria-labelledby=<date label> aria-rowcount=7 aria-colcount=7
   ├─ div role="row" aria-rowindex=1
   │  └─ div role="columnheader" ×7   visible "Wed", name "Wednesday"
   └─ div role="row" aria-rowindex=2..7      one per week
      └─ div role="gridcell" ×7 aria-colindex aria-selected? aria-current?
             name: "Wednesday, October 28, 3 events"   (count from messages, plural rules)
             contains: day number (aria-hidden), event chips, "+N more" button
```

- The month is read **row by row**: a week at a time (§5.2 of the engine spec).
- Days outside the current month are focusable and named the same way, with `messages.outsideMonth` appended ("September 29, previous month") (D-89).
- Hidden days (`hiddenDays`, D-75) are not cells at all; `aria-colcount` counts only shown days.

### 3.2 Keys in the grid

| Key                          | Action                                                                                                        |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Arrows                       | Move one day (Left and Right swap in RTL, D-35)                                                               |
| Home / End                   | First / last day of the week row                                                                              |
| Ctrl+Home / Ctrl+End         | First / last day of the visible range                                                                         |
| Page Up / Page Down          | Same day, previous / next month; the view navigates and the label announces                                   |
| Shift+Arrows, Shift+Home/End | Extend the selection from the anchor day (section 6.1)                                                        |
| Enter                        | Activate the slot: confirms the current selection, or selects just this day if none (the app's slot callback) |
| Space                        | Select just this day and make it the anchor, without confirming (D-89). Enter confirms                        |
| Escape                       | Clear the selection                                                                                           |
| Tab                          | To the event group, entering at this day's first event                                                        |

Moving past the first or last visible day navigates to the previous or next period and keeps the day (D-89), as Google Calendar and the APG date-picker do.

### 3.3 Events and "+N more"

- Event chips are `role="button"` elements in the **event group**, not grid content: they have `tabindex="-1"` except the group's current item, which has `tabindex="0"`.
- **Order** in the event group: by day, then by the layout order (D-59).
- **Keys in the event group:** Down/Right = next event, Up/Left = previous (swap Left/Right in RTL), Home/End = first/last in the view, Enter or Space = activate (D-51), Shift+F10 or the menu key = context menu (section 6.3), Delete = delete when the editing module is registered and the event isn't read-only.
- **"+N more"** is a button in the event group at the position of the first hidden event. Name: "3 more events, Wednesday, October 28". It opens the overflow popover:
  - a non-modal `popover` with `role="dialog"`, `aria-labelledby` its header (the full date, D-50);
  - inside, the day's events in the same order with the same names (D-50), as a roving list;
  - Escape or Tab-out closes it; focus returns to the "+N more" button, or to the day cell if the button no longer exists (D-50).

## 4. Time grid (day, week, work week, N-day)

### 4.1 Roles

```
section
├─ toolbar
├─ div role="grid"   all-day grid: the embedded day grid, one row
│     columnheaders: the days ("Wednesday, October 28")
│     gridcells: one per day, named "All day, Wednesday, October 28, 1 event"
└─ div role="grid"   time body, aria-rowcount = slots in the min/max window, aria-colcount = days
      rows: one per slot (aria-rowindex)
      gridcells: one per day per slot, named "9:00 to 9:30 AM, Wednesday, October 28"
                 aria-describedby → background events covering it (D-39)
      time axis: aria-hidden (D-50)
```

- Read **column by column** (engine spec §5.2): Up and Down move through a day's slots, Left and Right change day at the same time.
- Every slot is a focusable cell (D-51).
- **Decided (D-89):** the time body's day headers are shared with the all-day grid, and the time grid's cells carry the date in their own names instead of relying on header association, because the decorative axis can't be a row header.

### 4.2 Keys in the time body

| Key                       | Action                                                                                                                                                                                                                                                   |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Up / Down                 | Previous / next slot in the day                                                                                                                                                                                                                          |
| Left / Right              | Same slot, previous / next day (swapped in RTL)                                                                                                                                                                                                          |
| Home / End                | First / last slot of the day (the `min`/`max` window)                                                                                                                                                                                                    |
| Ctrl+Home / Ctrl+End      | First slot of the first day / last slot of the last day                                                                                                                                                                                                  |
| Page Up / Page Down       | Previous / next period (the view navigates)                                                                                                                                                                                                              |
| Shift+Up/Down             | Extend the selection by a slot, within one day                                                                                                                                                                                                           |
| Shift+Left/Right          | Extend the selection across days as **one continuous time span** from the anchor to the new position, for example Wednesday 9:00 AM to Thursday 10:00 AM (D-89; a multi-day timed selection, T-7). Announced as "9:00 AM Wednesday to 10:00 AM Thursday" |
| Enter, Space, Escape, Tab | As in the day grid                                                                                                                                                                                                                                       |

Focusing a slot scrolls it into view, inside the scroll container, with `scroll-padding` so sticky headers never cover it (WCAG 2.4.11).

### 4.3 The focus hop (engine spec §5.2)

- **Up from the first slot** of a day moves focus to that day's cell in the all-day grid. **Down from an all-day cell** moves to the first slot of the same day, scrolling the time body to the top of the `min` window. (D-89)
- The hop changes Tab stops' remembered positions: the all-day grid and the time grid each remember their own last-focused cell.
- The two grids are announced as different grids when focus hops between them (their names come from `messages.allDayGrid` and `messages.timeGrid`). VoiceOver announces the grid change on a hop (P3 run). **NVDA check:** NVDA does too.

### 4.4 DST days (T-14)

- **Spring forward:** the skipped hour is an empty band. Its slots are not focusable; Up/Down skip over them, and the next slot's name says what happened: "3:00 to 3:30 AM, Sunday, March 8, after the daylight-saving change". (D-89)
- **Fall back:** the repeated hour shares rows. Each slot in it is named with both offsets: "1:30 to 2:00 AM, first or second occurrence (EDT or EST)". Events in that hour carry the zone abbreviation in their time part: "Shift handover, 1:30 AM EST". (D-89) This is how screen-reader users tell the two occurrences apart, as T-14 requires.

### 4.5 Multi-day timed events (T-7)

The first piece is in the event group; later pieces are `aria-hidden`. Its name gives both dates: "Overnight shift, 10:00 PM Wednesday to 6:00 AM Thursday".

## 5. Agenda and timeline

These families are built in S3 and S6. Their full spec is written at those slices' kickoffs (rule 7); P3 fixes their structure now so the machines are designed for them.

- **Agenda:** a `role="grid"` of rows (date, time, event) with roving focus by row; dates are row headers. Virtualized, so `aria-rowcount` and `aria-rowindex` give true positions. (D-89)
- **Timeline:** a `role="grid"` with one row per lane (resource or day) and the lane name as the row header; it reads **row by row**. Columns are time slots. Rows are virtualized, with `aria-rowindex`. (D-89)

## 6. Interactions

### 6.1 Slot selection

- **Keyboard:** Shift+Arrow from an anchor (section 3.2, 4.2). Selected cells carry `aria-selected="true"`. The live region announces the whole range after each change (debounced): "Selected 9:00 to 10:30 AM, Wednesday".
- **Pointer:** press, move, release; **touch:** long-press, then move (interaction spec). Both produce the same `creation` draft as the keyboard.
- **Constraints (D-76):** an invalid selection marks its cells `data-invalid`, appends the reason to the announcement ("…, not allowed: outside working hours"), and Enter does nothing.

### 6.2 Activation

- **Primary** (click, tap, Enter, Space): the app's select-event callback.
- **Secondary** (double-click): **Decided (D-89):** the context menu's first item, "Open", is the keyboard and single-pointer alternative. There's no extra key, because Shift+Enter isn't reliable across screen readers.

### 6.3 Context menu

- Opens with Shift+F10, the menu key, or right-click; on coarse pointers, tapping an event shows the action toolbar instead (D-50).
- `role="menu"` with `menuitem`s, in a popover anchored to the event. Arrow keys move, Enter activates, Escape closes and returns focus to the event.
- **Items** (each only when it applies): Open (secondary action), Move, Resize start, Resize end, Delete (editing module), Show details (read-only events show this and no Delete, D-50).

### 6.4 Keyboard move and resize (keyboard DnD) and the single-pointer alternative

**Decided design** (D-89; confirmed in the prototype and VoiceOver):

1. Choose **Move** (or Resize start/end) from the context menu or the touch toolbar. The event enters move mode: `aria-grabbed` is not used (deprecated); the live region announces "Moving Standup. Use arrow keys, Enter to drop, Escape to cancel."
2. **Arrows** move the draft by one slot (time grid) or one day (day grid). Left and Right change day; in the time grid Up and Down change time by the snap step (gap addition #2). **Page Up/Down** moves to the previous or next period. **Shift+Up/Down** in the time grid moves by an hour. (D-89)
3. Moving onto the all-day grid with the focus hop converts the draft as T-12 says, and the announcement says so: "…, will become an all-day event".
4. Each settled position is announced: "Standup, Thursday, 10:00 to 10:15 AM". An invalid position adds the reason (D-76).
5. **Enter** drops: the change goes through the pipeline and shows as pending; **Escape** cancels and restores the event.
6. Focus stays on the event throughout and follows it to its new place.

**Single pointer (WCAG 2.5.7):** after choosing Move from the menu or the touch toolbar, **clicking or tapping a slot** drops the event there, and Escape or a Cancel button in the toolbar cancels. So nobody has to drag.

### 6.5 Dragging from outside the calendar (D-36)

External drags use native HTML drag-and-drop, which has no keyboard path in browsers. **Decided (D-89):** the docs show apps how to offer a keyboard path themselves (an "Add to calendar" action that creates an `external-drag` draft through the instance and enters move mode at the focused slot). The machine exposes that entry point.

### 6.6 Background events (D-39)

Not focusable, not in the event group, and selection passes through them. Their titles are in the `aria-describedby` of the slots they cover: "9:00 to 9:30 AM, Wednesday, October 28. Busy: Team offsite".

## 7. Prebuilt extras

### 7.1 Mini calendar (D-50)

APG date-picker grid: `role="grid"`, roving `tabIndex`, `aria-selected` on the selected date, `aria-current="date"` on today. Arrows move a day, Home/End to week start/end, Page Up/Down a month, Shift+Page Up/Down a year. Enter navigates the main calendar to the day. Its month label is a polite live region. Previous and next month buttons sit outside the grid.

### 7.2 Resource panel (D-50)

The APG tree pattern: `role="tree"`, `treeitem`s with `aria-level`, `aria-setsize`, `aria-posinset` and `aria-expanded` for parents. **Space toggles visibility** (D-50), shown as `aria-checked` on the treeitem (D-89; APG allows checked tree items). Right expands or moves to the first child, Left collapses or moves to the parent, Home/End first/last visible item. Hidden resources keep their place, named "Room A, hidden".

### 7.3 Source list (D-73)

**Decided (D-89):** a group of native checkboxes (`<fieldset>` with a `<legend>`), one per source, because there's no hierarchy. Each checkbox is a Tab stop; the list is short by nature. The source's color swatch is `aria-hidden`; its name is the label.

### 7.4 Delete confirmation and read-only (D-50)

- Delete confirmation is a modal `<dialog>` opened with `showModal()`, `aria-describedby` its message, focus on the safe button (Cancel) first (D-89), and focus returned to the opener when it closes.
- Read-only events show "Show details" and no Delete (D-50), and their names include "Read-only".

### 7.5 Tooltips (D-74, gap addition #4)

Shown on hover **and** on keyboard focus, after a short delay; dismissible with Escape without moving focus; hoverable; persistent until dismissed (WCAG 1.4.13). On touch they never appear; the action toolbar shows details instead. The tooltip text is the event's `aria-description` (section 2.6), so screen readers don't depend on the tooltip appearing.

## 8. Visual requirements

| Requirement                                                                                                                  | WCAG                                | Spec                                                                                                                          |
| ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Focus is always visible: at least a 2px outline with 3:1 contrast against its surroundings, never removed                    | 2.4.7, 1.4.11                       | Styling tokens `--bc-focus-*`                                                                                                 |
| Focus is never hidden under sticky headers or the all-day row                                                                | 2.4.11                              | `scroll-padding` on the scroll container                                                                                      |
| State never uses color alone: selected, pending, invalid, today and outside-month each also change a border, pattern or text | 1.4.1                               | Part manifests list each state's non-color cue                                                                                |
| Event text meets 4.5:1 on its event color, computed in JS (gap addition #13)                                                 | 1.4.3                               |                                                                                                                               |
| Targets are at least 24×24 CSS px (event chips, "+N more", slot cells), and 44px on coarse pointers                          | 2.5.8                               | Chips shorter than 24px use the spacing exception: no other target within 24px of their center (checked by axe `target-size`) |
| **Forced colors:** system colors only; event colors become borders; selection and focus stay visible                         | 1.4.11 (gap #14)                    | `@media (forced-colors: active)` in each part's CSS                                                                           |
| **400% zoom / 320 CSS px reflow**                                                                                            | 1.4.10 (gap #14)                    | Section 8.1                                                                                                                   |
| **Reduced motion:** no animated scrolling, no popover or drag transitions                                                    | 2.3.3 (AAA, but checked by gap #14) | `prefers-reduced-motion`                                                                                                      |
| Text spacing overrides don't clip event titles (ellipsis is allowed; the full name stays in the accessible name and tooltip) | 1.4.12                              |                                                                                                                               |

### 8.1 Reflow

WCAG 1.4.10 exempts content that needs a two-dimensional layout, and a calendar grid qualifies, as data tables do. **Decided (D-89):** we still reflow, through the container-query breakpoints:

- month at narrow widths (below a 40rem container): each day shows one count button ("3", named "3 events, Wednesday, October 28") instead of chips, and it opens the day's event list. The list's items must offer **every action a chip offers** (activation, the context menu, Move), because they are the only way to reach those events (prototype finding 3);
- the time grid at narrow widths: the compact touch views (1 or 3 days, D-26);
- the toolbar wraps, and the view switcher stays reachable.

Nothing requires horizontal scrolling of the page at 320 CSS px, except inside the time grid's own scroll container (finding 6).

## 9. WCAG 2.2 AA coverage

| Criterion                                                | Where                                                                                                     |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| 1.3.1 Info and relationships                             | Sections 2–5 (roles, grid metadata)                                                                       |
| 1.3.2 Meaningful sequence                                | Section 2.3 (Tab order), 3.3 (event order)                                                                |
| 1.4.1 Use of color                                       | Section 8                                                                                                 |
| 1.4.3 Contrast (minimum)                                 | Section 8                                                                                                 |
| 1.4.10 Reflow                                            | Section 8.1                                                                                               |
| 1.4.11 Non-text contrast                                 | Section 8                                                                                                 |
| 1.4.12 Text spacing                                      | Section 8                                                                                                 |
| 1.4.13 Content on hover or focus                         | Section 7.5                                                                                               |
| 2.1.1 Keyboard, 2.1.2 No keyboard trap                   | Sections 3, 4, 6; Escape always leaves popovers and move mode                                             |
| 2.1.4 Character key shortcuts                            | Section 1, principle 6                                                                                    |
| 2.4.3 Focus order                                        | Section 2.3                                                                                               |
| 2.4.6 Headings and labels                                | Section 2.2                                                                                               |
| 2.4.7 Focus visible, 2.4.11 Focus not obscured (minimum) | Section 8                                                                                                 |
| 2.5.3 Label in name                                      | Section 1, principle 4; section 2.6                                                                       |
| 2.5.7 Dragging movements                                 | Section 6.4                                                                                               |
| 2.5.8 Target size (minimum)                              | Section 8                                                                                                 |
| 3.2.1 On focus, 3.2.2 On input                           | Focus never navigates or commits; only Enter, Space, Page Up/Down and moving past the range edge navigate |
| 3.3.1 Error identification                               | Sections 6.1, 6.4 (invalid drafts named and announced)                                                    |
| 4.1.2 Name, role, value                                  | Sections 2–7                                                                                              |
| 4.1.3 Status messages                                    | Section 2.5                                                                                               |

## 10. The interaction machine pattern (O-6)

The prototype builds the **move machine** (section 6.4: idle → menu → moving → dropping or cancelled, with keyboard, pointer and announcements) twice:

- **(a)** a hand-written finite-state machine: pure `transition(state, event) → { state, effects }`, plus a small runtime that performs effects (focus, timers, announcements, DOM reads);
- **(b)** the same machine in XState.

Both emit the same framework-neutral prop-getter descriptors (`{ attrs, on, ref }`, D-72). They're compared on: lines of code, bundle size added, how easily the transitions are unit-tested without a DOM, how effects and timers are expressed, and how a registered feature adds states or transitions. The result picks the pattern (D-90); P5 records the final contract.

**Result (2026-10-28):** both behave identically (same states and effects for a 15-event script, and the same focus and announcements in the browser). The hand-written machine is 81 lines and 0.9 KB gzip; the XState machine is 154 lines, and XState adds 13.0 KB gzip. In XState's pure mode the effects runtime is still needed, timers included. Neither has a built-in way for features to merge transitions. Details: `prototypes/p3-vanilla/o6/RESULTS.md`. **Decided (D-90): (a), hand-written machines** with a written transition and effects contract; P5 records the exact contract.

## 11. Prototype scope

`prototypes/p3-vanilla/`, plain HTML, CSS and JavaScript, no framework and no build step:

- month view: grid, roving focus, event group, selection, "+N more" popover;
- week view: all-day grid, time body with per-slot cells, the focus hop, a DST week (spring forward and fall back fixtures, America/New_York);
- context menu, keyboard move, single-pointer move, an invalid-drop constraint;
- toolbar with the live date label and the view switcher menu;
- fixture data from the time-semantics worked examples.

It exists to test this spec with real screen readers. It is not product code and nothing in it is reused (D-01 spirit).

## 12. Test plan

- **Automated** (Playwright, all three engines): axe with zero violations; keyboard paths scripted against this spec; forced colors (`emulateMedia({ forcedColors: 'active' })`); 320 CSS px viewport; reduced motion.
- **Manual:** the screen-reader script (`docs/checklists/screen-reader-script.md`), rewritten with the expected announcement for each step, run with VoiceOver + Safari in P3 and NVDA + Firefox before S1 starts (D-91). From S1 the same script runs once per slice (D-42).
- Each finding is recorded with the step, what was announced, what was expected, and the change made to this spec.

## 13. Prototype findings

Recorded as they're found. Each says what was seen, the spec change, and how it was verified.

1. **Label in Name (WCAG 2.5.3, level A).** axe failed every month chip on all three engines: the visible "10 AM Dentist" wasn't part of the name "Dentist, 10:00 to 11:00 AM, …". Marking the time `aria-hidden` doesn't help, because sighted speech-input users still see it. **Change:** principle 4 and section 2.6; the composer receives the visible label and starts with it. Verified: zero axe violations.
2. **Event-group order must come from layout order, not DOM order.** On the fall-back day, both 1:30 events start at the same wall-clock time, and DOM order put the EST event first; Down from the EDT event went nowhere. **Change:** none to the spec (section 3.3 already says layout order, D-59); the machine sorts by instant, then duration, then id. Verified by the scripted keyboard run.
3. **Compact month hides chips, so their actions need another home.** At 320 CSS px, month chips shrank to "1…". The count button and day list (section 8.1) fix the visual problem, but the context menu and Move were then unreachable. **Change:** section 8.1 requires the day list to offer every chip action. Verified in the prototype at 320 CSS px: Shift+F10 in the day list opens the event's menu, Move works, and focus follows the event to its new day's button.
4. **Forced colors:** selection, focus and chip borders stay visible, but chips inside a selected day lose contrast against the system Highlight color. **Change (D-89):** in forced colors, selected days show selection with a thick system-color border instead of a Highlight fill.
5. **VoiceOver + Safari (macOS 26.6.2, Safari 26.6.2), 2026-10-28:** the maintainer ran the full script (`prototypes/p3-vanilla/SCREEN-READER-SCRIPT.md`); every step behaved as expected. Lighthouse reported 100 for accessibility.
6. **Automated baseline:** with findings 1 and 2 fixed, axe reports zero violations on Chromium 156, Firefox 157 and WebKit 27.2, in normal and forced-colors modes, at 1280 and 320 CSS px, over the month, week and both DST weeks, including the open popover, menu and move states. Nothing scrolls the page horizontally at 320 CSS px.

## 14. Answers (D-89)

Answered 2026-10-28, after the VoiceOver run:

- Every item previously marked Proposed is approved as written, **except** Shift+Left/Right in the time grid, which extends as one continuous time span rather than the same times on each day (section 4.2).
- Label in Name (finding 1): month chips keep their visible start time, and the name starts with it ("10 AM Dentist, 10:00 to 11:00 AM, …"); the short repeat is accepted.
- Keyboard and single-pointer move (section 6.4): approved as tested, with no extra shortcut.
- Rollback is the only assertive announcement (section 2.5); the secondary action is the context menu's "Open" (section 6.2).
- Fall-back DST names use the zone abbreviations from `Intl` (section 4.4).
- Forced-colors selection uses a thick system-color border instead of a Highlight fill (finding 4).
- Screen readers in P3 are VoiceOver and NVDA only; mobile screen readers are covered by the per-slice real-device checks from S1.
