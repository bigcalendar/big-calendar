# PROGRESS — ARCHIVE

> Full phase history. Active state → PROGRESS.md.
> Preserved as of 2026-06-25.

---

## Phase 8 — Codemods ✅ (completed 2026-06-24)

Nine codemods covering the full BC API rename surface, plus a CLI runner and migration guide.

- **8-1** — `rename-imports` — rewrites import paths from old package names to new.
- **8-2** — `merge-accessors` — merges deprecated top-level accessor props into the `accessors` object.
- **8-3** — `rename-callbacks` — renames event/slot callback props to match the new API (`onSelect` → `onEventClick`, etc.).
- **8-4** — `rename-props` — renames miscellaneous renamed props.
- **8-5** — `flag-removed-props` — inserts TODO comments for props with no direct equivalent.
- **8-6** — `views-prop` — migrates the old `views` array prop to the new `views`/`viewDefinitions` shape.
- **8-7** — `wrap-provider` — wraps bare `<Calendar>` usage in `<CalendarProvider>`.
- **8-8** — CLI runner (`npx @big-calendar/codemods`) — discovery, transform execution, dry-run flag.
- **8-9** — Migration guide MDX — step-by-step upgrade doc in Storybook.

Test counts entering Phase 9: localizer: 45 · core: 493 · dnd: 36 · react: 357 · codemods: 82 · **total: 1013**

Architecture decisions: none logged — Phase 8 was a mechanical implementation of an already-decided API surface.

---

## Phase 7b — Polish ✅ (completed 2026-06-24)

Focused pass to unify draggable/resizable accessors and add the `type` accessor story.

- **7b-1** — Core: `draggableAccessor`/`resizableAccessor` removed from top-level `CalendarConfig`; `draggable` and `resizable` moved into the `Accessors` object (`accessors.draggable`, `accessors.resizable`). `createCalendarStore` updated; opt-in semantics unchanged (absent = non-draggable/non-resizable). All test files updated. Commit `f4dc383`.
- **7b-2** — Core: `type` and `resourceType` accessors added to `Accessors` type and `DEFAULT_ACCESSORS`. Commit `f4dc383`.
- **7b-3** — React: `EventTypeAccessor.stories.tsx` — new story demonstrating the `type` accessor. `demoEvents.ts` updated with `EVENT_TYPES` const (10 types), `EventType` export, and deterministic `type` stamp per event. Story uses CSS `:has(.bc-event-type-X)` to override `--bc-color-event-bg`/`--bc-color-event-fg` CSS custom properties from custom `TypedMonthEvent` and `TypedTimeEvent` slot components. Two stories: `MonthViewTyped` and `WeekViewTyped`. Commit `a65473c`.

Test counts entering Phase 8: localizer: 45 · core: 493 · dnd: 36 · react: 357 · **total: 931** (7b added test updates only; count unchanged from 7a-8 baseline).

---

## Phase 7a — API surface refactor ✅ (completed 2026-06-24)

Full task list and per-task details were in PROGRESS.md. Summary:

- **7a-0** — DECISIONS.md, PROGRESS.md, DECISIONS-ARCHIVE.md, Upgrade_plan_prompt.md updated for Phase 7 redesign.
- **7a-1** — Core: `config.views` → `config.viewDefinitions`; `config.enabledViews`; `store.enabledViews` signal.
- **7a-2** — React: `CalendarProps.views?: ViewKey[]`; `useToolbarProps` reads `store.enabledViews`; `Calendar` checks `components.views[viewModel.view]` for all views.
- **7a-3** — `packages/storybook-shared/` with locale/TZ constants + `withLocalizerDecorator`; wired into storybook-core and storybook-react.
- **7a-4** — `@big-calendar/styles` MDX doc — all `.bc-*` classes, nesting, CSS custom property overrides.
- **7a-5** — `src/` restructure — internal hooks moved to top-level public folders; `AgendaEventButton` + all `Default*` components promoted to public.
- **7a-6** — Hook extraction — `useMonthView`, `useTimeGridView` (split: `useTimeGridHeader` / `useTimeGridBody`), `useAgendaView`; element-spread pattern per component.
- **7a-7** — Build: multi-entry Vite config + wildcard `package.json` subpath exports.
- **7a-8** — Tests: imports updated throughout; per-file coverage bars verified. localizer: 45 · core: 493 · dnd: 36 · react: 357 · total: **931**.
- **7a-9** — Stories: MDX + interactive stories for each newly-public component/hook; all stories include `withLocalizerDecorator`.

Architecture decisions: DECISIONS-ARCHIVE.md 2026-06-10 "Phase 7 redesign" entries.

---

## Phase 5 tail entries (2026-06-09, continued)

### Phase 5 tail — Task 1c: Day-major week ordering (`resourceLayout:'day'`) ✓ (commit 3a4d118)

Implemented alongside 1b — landed in the same commit but was not marked done at the time. Core `timeGrid.function.ts` already had both `'resource'` and `'day'` modes from commit 08823ac (1a). The React `TimeGridView.component.tsx` renders the day-major layout (one group per visible day, each containing one cell per resource — two-tier header with day name spanning resource columns on row 1, resource names on row 2; per-(day × resource) all-day stacked lane; body columns in day-first order). Tests: 7 assertions in `TimeGridView.component.test.tsx` (`describe('with resources and resourceLayout:"day"')`). Storybook: `WeekWithResourcesDayMajor` story.

---

### Phase 5 tail — DnD gating: `grabEvent` / `grabResize` respect `isDraggable` / `isResizable` ✓ (commit f7ddafe)

`grabEvent` now returns `false` immediately for non-draggable events (`isDraggable(event)` checked before reading start/end bounds), so the keyboard grab cannot start for events that opt out. `grabResize` is a no-op when the currently-grabbed event is not resizable (`isResizable` checked at the top via `findEvent(grab.id)`), so Shift+arrow keys during a keyboard grab cannot resize a non-resizable event. The Pragmatic pointer-DnD path was already gated via `canDrag` in `bindCalendarDnd`. Two new core tests cover both gates. core: 263.

---

### Phase 5 tail — Drag affordances gated on `store.dndEnabled` + `clsx` ✓ (commits 03f86cf, d399a1a)

**Affordance gating (03f86cf):** Added `store.dndEnabled: Signal<boolean>` (default `false`) to `CalendarStore`. `useCalendarDnd` sets it `true` on mount and restores `false` on cleanup. `EventButton` now gates resize-handle DOM elements on `dndEnabled && isResizable(event)` — handles never appear when DnD is not wired. `EventButton` also applies `bc-event-draggable` when `dndEnabled && isDraggable(event)`; `event.css` maps that class to `cursor: grab` / `cursor: grabbing`. Result: no resize-handle grab-bars and no grab cursor when DnD is not installed or the event opts out. Tests: `EventButton` (new `DndEnabler` helper, expanded handle + draggable-class tests), `MonthView` (`renderMonthWithDnd` + "omits handles without dnd" test), `useCalendarDnd` (dndEnabled on/off assertions via separate `DndEnabledDisplay` child), core store (dndEnabled default=false). core: 264 · react: 215.

**clsx (d399a1a):** Added `clsx` as a dep to `@big-calendar/react` and replaced all `.filter(Boolean).join(' ')` className compositions in `EventButton`, `TimeGridView`, `DefaultTimeDayHeading`, `DefaultMonthDate` with `clsx()` calls.

---

## Phase 5 tail entries

### Phase 5 tail — format split: `dayColumnHeader` vs `dayHeader` (Cutter, 2026-06-09) ✓ (commit 6b1072a)

Localizer had conflated RBC's two distinct day formats under one `dayHeader` key. Split to mirror RBC:
- **`dayColumnHeader`** `{ weekday: 'short', day: '2-digit' }` (≈ RBC `dayFormat`, "Sun 14") — the time-grid
  per-day column header. New FormatKey (localizer.type.ts) + default (formats.constant.ts). Consumed by
  useTimeGrid (column headings) and useKeyboardDnd (time-mode announcement, now matches "Tue 16" short form).
- **`dayHeader`** `{ weekday:'long', month:'long', day:'numeric' }` (≈ RBC `dayHeaderFormat`, "Sunday, June 14")
  — unchanged, still titles the Day-view toolbar label (viewLabel.ts).
- Tests updated (TimeGridView column-heading expectations → `dayColumnHeader`). Gates: build/test localizer,
  core, react ✓; typecheck localizer+core+react ✓; lint localizer+react ✓.
- **DEFERRED (Cutter, explicit):** format constants still need a broader refinement pass for better Intl layout
  (RBC's full set — `dateFormat`/`weekdayFormat`/`dayRangeHeaderFormat`/`agendaHeaderFormat`, ordering quirks
  like en-US "Sun 14" vs RBC's "14 Sun"). Revisit when we do the localization polish; no date set.

---

### Phase 5 tail — resource grid SCROLL architecture (sticky head + frozen gutter) (Cutter, 2026-06-09) ✓

Styling follow-ups to 1a/1b turned into a layout-architecture change for the shared resource grid
(`.bc-time-grid-resources`, day + week):
- The grid is now a **single 2-D scroll container** (`overflow: auto`, owns the leaf-column tracks). The header
  + all-day rows are wrapped in a new sticky `.bc-time-head` (`position: sticky; inset-block-start: 0`) so they
  stay pinned on vertical scroll; the **gutter column** (`.bc-time-gutter` + `.bc-time-header-gutter` +
  `.bc-allday-label`) is `position: sticky; inset-inline-start: 0` so it stays fixed on horizontal scroll. The
  body no longer scrolls on its own (a nested scroller trapped the gutter's sticky positioning).
- **`subgrid`**: `.bc-time-head` / `.bc-time-body` (and the header/all-day rows nested in the head) use
  `grid-template-columns: subgrid` to inherit the parent's exact tracks → perfect column alignment at any scroll
  offset (also removes the earlier all-day sub-pixel drift concern). **Browser baseline: subgrid** (Chrome 117+,
  FF 71+, Safari 16+) — acceptable for the modern target; noted here as a new dependency.
- **Day min-width**: `.bc-time-grid-resources-day { --bc-resource-col-min: 14rem }` (week keeps the 8rem default
  via the var) — day resource columns are full per-resource columns and 8rem was too cramped. Variant class added
  in TimeGridView (`-day` / `-week`).
- **Header dividers** now apply to the day single-tier header too (`.bc-time-grid-resources .bc-resource-header`),
  not just the week tiered header.
- **Border layer bug** (fixed this session): the week-lane border-removal had to live in `timegrid.css`
  (`@layer bc.components`) to outrank the shared `.bc-allday-resource` border — an override in `layout.css`
  (`bc.layout`) loses to components regardless of specificity (layer order: reset, tokens, **layout, components**,
  theme, overrides). Root cause of the earlier double-border + 1px shift.
- **story** — `rooms` expanded 4 → 10 so both DayWithResources + WeekWithResources exercise horizontal scroll.
- **Gates:** typecheck/test/lint react ✓ (192); build styles + build-storybook ✓. **No browser run** (jsdom
  can't render sticky/subgrid/scroll) — all of this needs visual verification in Storybook.

---

### Phase 5 tail — Task 1b: RESOURCE columns in the WEEK view (resource-major) (Cutter, 2026-06-09) ✓ (commit 3a4d118)

**React-render only** — core already emits each resource group's columns for all visible days + a multi-day
all-day `SegmentRows`, so 1b needed no core/dnd change. When the time grid has resources **and more than one
visible day**, TimeGridView now renders a **two-tier header** (resource title spanning its day columns on row 1,
day names beneath on row 2 — placed explicitly into the leaf-column grid via `colStartOf(gi)=2+gi*daysPerGroup`)
and a **multi-day all-day lane** per resource (`.bc-allday-resource-week` spanning the resource's days, with a
per-day hit-target sub-grid + a `segmentStyle`-placed segment sub-grid, mirroring the flat all-day row scoped to
one resource). Body columns stay resource-major (`groups.flatMap`); the day view keeps its single-tier header +
stacked lane unchanged (branch on `isWeek = grid.headings.length > 1`).
- **selection** — timed-selection highlight box now scopes to **resourceId AND the column's day**
  (`resourceSelectionBox(resourceId, date)`, matching `selAnchor.date`), so a resource's in-progress highlight no
  longer bleeds across its week days. All-day hit cells carry `data-slot-index = day index` (== global day index,
  since every resource lists the same days), so day-mode selection/drops decode the date + report `resourceId`
  (via the `data-bc-resource` ancestor) as in 1a.
- **styles** (layout.css) — `.bc-time-header-tiered .bc-resource-header` (tier separator),
  `.bc-allday-resource-week` (padding 0), `.bc-allday-resource-slots` (absolute fill grid),
  `.bc-allday-resource-segments` (day-column grid, auto-rows `--bc-segment-height`, pointer-events none).
- **tests/docs** — react **192 (+4)**: new `'with resources (week view)'` describe (two-tier header / 14 day
  headings, resource-major column counts 7×2, per-resource timed routing, all-day lane routing). New
  `WeekWithResources` story. DragAndDrop.mdx resource section + "Not built yet" updated (day + week
  resource-major done; **day-major** week ordering = remaining 1c).
- **Deferred to 1c / later:** the **day-major** week ordering (days outer, resources nested) — will arm the
  `resourceLayout: 'resource' | 'day'` prop (default `'resource'`, the 1b path); **cross-day timed-selection
  drag within a resource** (per-column scoped today); all-day **selection band** highlight in resource lanes
  (hit cells report, but no visible drag band); DnD move/resize live-preview still omitted in resource columns
  (core `dragPreview` has no resourceId).
- **Gates:** lint react ✓; typecheck react ✓; build styles ✓; test react 192 ✓.

---

### Phase 5 tail — Task 1a: time-grid RESOURCE columns (day view) + resourceId everywhere (Cutter, 2026-06-09) ✓ (commits 08823ac, 3a4d118)

First chunk of the post-Phase-5 mini-plan (see DECISIONS.md 2026-06-08 mini-plan entry). Day view splits into
one column per resource when a `resources` array is supplied; cross-resource DnD + selection now report the
**landing** `resourceId`.
- **core** — timeGridViewModel made resource-aware (**additive**: no-resource path untouched). New
  `TimeGridResourceGroup` (resourceId/resourceTitle/columns/allDay); `TimeGridColumn` gained
  `resourceId: ResourceId | null`; `TimeGridViewModel` gained `resources: …[] | null`. With resources: one group
  per resource, events bucketed by the `resource` accessor (unmatched dropped, multi-resource appears in each),
  per-resource all-day lane; top-level `columns`/`allDay` empty. `viewModel.function.ts` forwards `resources`
  (store already fed `resources.value`). `resourceId` threaded into `onEventDrop`/`onEventResize`/
  `onDropFromOutside` payloads + `SlotSelectionDates`, and the `moveEvent`/`resizeEvent`/`dropExternal` +
  selection `start`/`click`/`doubleClick` actions (anchor carries it).
- **dnd** — new `data-bc-resource` (bindCalendarDnd): drop targets read the nearest `[data-bc-resource]`
  ancestor as `bcResourceId` and report it as the landing `resourceId` on move/resize/external (Pragmatic monitor
  **and** native HTML5 path).
- **react** — useTimeGrid extracts `resolveColumn`/`resolveAllDay`, emits `resources: TimeResourceGroup[] | null`.
  TimeGridView renders a resource branch (single-tier title header, per-resource all-day lane, time column with
  `data-bc-resource`, per-resource live selection box). `useSlotSelection` reads `data-bc-resource` and passes
  `resourceId`. Styles: `.bc-time-grid-resources` (min-width cols `--bc-resource-col-min:8rem` + overflow-x),
  `.bc-resource-header`, `.bc-allday-resource(-stack)`, `.bc-segment-stacked` in `layout.css`.
- **tests/docs** — core 250 (+10), dnd 31 (+2), react 188 (+4); `DayWithResources` story (TimeGridView);
  DragAndDrop.mdx gained a "Resource columns and cross-resource drag" section, "Not built yet" trimmed.
- **Gates:** lint core/dnd/react ✓; typecheck/build/test core+dnd+react+styles ✓; build-storybook react ✓.

---

### Phase 5 — Task 5a: event MOVE, end-to-end (Cutter, 2026-06-07) ✓ (commit d1e4890)

- **core** — pure `moveEvent` helper (`mode:'time'` = snap-to-instant + preserve exact duration;
  `mode:'day'` = whole-day shift preserving time-of-day; `allDay` preserved). `CalendarConfig` gained
  `onEventDrop` (ISO payload `{event,start,end,allDay}`, no `Date`) + `draggableAccessor`. Store gained the
  `moveEvent({id,target,mode})` action, `getEvent({id})`, and resolved `isDraggable(event)` (default `() => true`).
  Barrel exports `moveEvent` + `MoveEventArgs`/`MovedEvent`/`MoveMode`.
- **dnd** (`@big-calendar/dnd`, was a scaffold) — `bindCalendarDnd({root,store,mode})`: a framework-neutral
  **MutationObserver binder** on Pragmatic Drag and Drop. Scans `root` for `[data-bc-event]` drag sources
  (gated by `store.isDraggable` via `canDrag`) + `[data-date]` drop targets, registers each, re-syncs on
  mutations; one `monitorForElements` maps a drop → `store.moveEvent`. **No per-component changes** (binds the
  `data-*` nodes the views already render). Narrow `DndStore<TEvent>` interface avoids `TResource` variance.
  Added `jsdom` devDep; vitest env → jsdom. 8 tests.
- **react** — `useCalendarDnd(containerRef)`: binds the controller inside `containerRef` for views that support
  move (month→`'day'`; time-grid→`null`/deferred), rebinds on view change, tears down on unmount.
  `@big-calendar/dnd` added as **optional peerDependency** (+ devDep) per §11. Barrel exports `useCalendarDnd`.
  Tests mock `@big-calendar/dnd` (5 tests). New `React/Drag and drop` stories (`MonthEventMove`,
  `LockedEvent` via `draggableAccessor`).
- **Gates:** all 8 projects typecheck/test/lint/build ✓ (core 184, dnd 8, react 159); build-storybook react + core ✓.

---

### Phase 5 — Task 5a-docs: DnD async data lifecycle = fully controlled (Cutter, 2026-06-08) ✓

Cutter chose **fully controlled** for the move/resize async-save flow (see DECISIONS.md 2026-06-08). Calendar
reports the proposed change; the dev owns persist + optimistic update + **rollback** on their own `events` state.
Docs only — no contract change.
- Enriched the `onEventDrop` JSDoc (config.type.ts): report-not-mutation, why the payload is original event +
  proposed bounds, the optimistic-update+rollback pattern.
- New DragAndDrop.mdx guide (`React/Drag and drop/Guide`, novice tone) + `AsyncSaveWithRollback` story.

---

### Phase 5 — Task 5b: time-grid (`'time'`) event MOVE (2026-06-08) ✓

Extends 5a's move to the time-grid. **No core change** — `moveEvent`'s `'time'` mode already existed from 5a.
- **dnd** — drop-target attribute is now **mode-keyed** (`DROP_ATTR: Record<MoveMode,string>`):
  `'day'`→`data-date` (month + all-day row), `'time'`→`data-bc-instant` (time-slot cells). In `'time'` mode the
  all-day cells are **not** drop targets → timed↔all-day promotion stays deferred. +1 test (9 total).
- **react** — TimeGridView stamps each `.bc-time-slot` with `data-bc-instant={column.slots[slotIndex]}`.
  useTimeGrid resolves a per-column `slots: string[]` (slot-start instants) from one `createSlotMetrics` per
  column. `useCalendarDnd` `moveModeForView` → `'time'` for WEEK/WORK_WEEK/DAY.
- **stories/docs** — `WeekEventMove` story.

---

### Phase 5 — Task 5c: time-grid event RESIZE (Cutter, 2026-06-08) ✓

Drag a timed event's top/bottom edge to resize it (week/day/work-week). Cross-day supported (drop target is an
absolute instant).
- **core** — pure `resizeEvent` helper: `edge:'start'` snaps the start to the slot; `edge:'end'` snaps the end
  to the slot's **end** (`target + step`); result clamped to a one-slot minimum. `CalendarConfig` gained
  `onEventResize` + `resizableAccessor`. Store gained `resizeEvent({id,edge,target})` action and resolved
  `isResizable(event)`. Barrel exports `resizeEvent` + `ResizeEdge`/`ResizeEventArgs`/`ResizedEvent`.
- **dnd** — `[data-bc-resize]` handles bound as draggables; drop monitor branches on
  `source.data.bcResizeEdge`. `DndStore` widened. +4 tests (12 total).
- **react** — `EventButton` gained `withResizeHandles`; renders two `<span data-bc-resize="start|end">`.
  TimeGridView passes `withResizeHandles` on timed events.
- **styles** — `.bc-resize-handle` top/bottom grab strips, `cursor:ns-resize`, `touch-action:none`.
- **stories/docs** — `WeekEventResize` story.
- **Gates:** all 8 projects typecheck/test/lint/build ✓ (core 192, dnd 12, react 164).

---

### Phase 5 — Task 5c-preview: live resize-preview overlay (Cutter, 2026-06-08) ✓

- **core** — new read-only `dragPreview` signal (`{start,end}|null`); `previewResize({id,edge,target})` sets
  it to the bounds a resize *would* produce (via the shared `computeResize` helper); `clearDragPreview()`;
  committing `resizeEvent` clears it.
- **dnd** — `monitorForElements` gained `onDropTargetChange` → `store.previewResize` for resize sources; clears
  the preview on exit / outside-slot drop / teardown. `DndStore` widened.
- **react** — TimeGridView reads `store.dragPreview` and renders a per-column `.bc-drag-preview` box via the
  same `selectionStyle` geometry, computed inline with `createSlotMetrics().getRange`.
- **styles** — `.bc-drag-preview` shares the `.bc-selection` absolute placement with a dashed translucent skin.
- **Gates:** all 8 projects typecheck/test/lint/build ✓ (core 196, dnd 15, react 166).

---

### Phase 5 — Task 5d: drag/drop across the calendar boundary (Cutter, 2026-06-08) ✓ (commit 1678f6a fix)

Both directions (drop-into + drag-out), native HTML5 sources too, payload on the drag source, time-grid first.
- **core (5d-1)** — pure `placeExternalEvent` (`target` instant + `durationMinutes?` → `{start,end,allDay}`;
  missing/≤0 duration ⇒ one slot). `CalendarConfig` gained `onDropFromOutside({start,end,allDay})` +
  `onEventDragStart({event})`. Store gained `dropExternal`, `previewExternal`, `getEventTransfer({id})`,
  `eventDragStart({id})`. Barrel + `EventTransfer` type exported.
- **dnd (5d-2 drop-into)** — two same-page transports:
  - **native** `draggable="true"` palette: **delegated HTML5 `dragover`/`drop`/`dragleave` listeners** on the
    root (find slot via `closest('[data-bc-instant]')`, gate on `EXTERNAL_MIME`, `preventDefault` to accept).
    **Correction (2026-06-08):** first build used Pragmatic's *external adapter* — wrong (Pragmatic
    "external" = outside the browser window; it ignores same-page drags). Replaced with manual HTML5 listeners
    in commit 1678f6a.
  - **Pragmatic** `draggable` palette → `monitorForElements` external branch (carries `bcExternal` payload
    ⇒ true-extent preview).
- **dnd (5d-3 drag-out)** — event `draggable` gained `getInitialDataForExternal` (writes `text/plain` +
  `EVENT_MIME` JSON). Public MIME constants exported (`EXTERNAL_MIME`, `EVENT_MIME`, `EXTERNAL_DATA_KEY`).
- **react (5d-4)** — wired `onDropFromOutside` + `onEventDragStart` through `useCalendar`. New stories:
  `DropFromOutside` + `DragOutToUnschedule`. DragAndDrop.mdx documents both transports + native-vs-Pragmatic
  preview difference.
- **Gates:** all 8 projects typecheck/test/lint/build ✓ (core 212, dnd 26, react 168).

---

### Phase 5 — Task 5e: keyboard-accessible DnD (Cutter, 2026-06-08) ✓ (commit 06cc9ba)

Modal grab (Space pick up, arrows move, Shift+↑↓ resize end, Enter drop, Esc cancel). Time-grid only.
- **core (5e-1)** — keyboard-grab controller in the store: `keyboardDrag` signal (`{id,start,end,allDay}|null`)
  + `grabEvent({id})→boolean` (seeds from event bounds, primes `dragPreview`), `grabMove({days?,minutes?})`
  (shift both ends, preserve duration), `grabResize({minutes?})` (end edge, clamped to one slot), `grabCommit()`
  (fires `onEventDrop` if it moved, else `onEventResize`), `grabCancel()`. `KeyboardDragState` exported.
- **react (5e-2)** — `useKeyboardDnd({mode:'time'})` on the time-grid root via **`onKeyDownCapture`** so it
  claims keys before `EventButton` (Enter=open) and the roving hooks. Space picks up a **timed** event (gated
  to `.bc-time-body`). Polite **live region** announces each step. `EventButton` marks grabbed event
  (`aria-grabbed` + `.bc-event-grabbed` lifted/dimmed style). Proposed extent reuses `.bc-drag-preview` dashed box.
- **stories/docs (5e-3)** — `KeyboardDrag` story; DragAndDrop.mdx gained a key-table section.
- **Gates:** all 8 projects typecheck/test/lint/build ✓ (core 221, dnd 27, react 173).

---

### Phase 5 — Task 5g: month keyboard DnD (Cutter, 2026-06-08) ✓ (commit 8e2afce)

Extends 5e modal grab to the month view: move + resize, ←→ = ±1 day / ↑↓ = ±1 week (Shift = resize end).
- **core** — `grabResize` now takes `{minutes?, days?}`: whole-day end resize clamped to a one-day minimum.
- **react** — `useKeyboardDnd` generalized to `{ mode: MoveMode }`: `'time'` = slot/minute scheme (unchanged),
  `'day'` = day/week steps, Shift+arrow resizes end; mode picks the grabbable container (`.bc-time-body` /
  `.bc-month-grid`) + the announcement wording (time range / date range). MonthView mounts `{mode:'day'}` +
  live region.
- **stories/docs** — `MonthKeyboardDrag` story; keyboard section in DragAndDrop.mdx split into time-grid + month
  key tables.
- **Gates:** all 8 projects typecheck/test/lint/build ✓ (core 240, dnd 29, react 184).

---

### Phase 5 — Task 5f: month drop-from-outside + month resize + pointer move preview (Cutter, 2026-06-08) ✓ (commit 8e2afce)

- **core** — `placeExternalEvent` now **mode-aware** (`mode: MoveMode`, default `'time'`) + optional
  `start`/`end` template. `'day'` drop: no template → whole-day event; template → keep time-of-day, move date,
  preserve duration. `resizeEvent` gained `mode: 'day'`: move the dragged edge by the day delta, clamp to
  one-day minimum. New `previewMove({id,target,mode})` (+ shared `computeMove`); `moveEvent` clears
  `dragPreview` on commit.
- **dnd** — external + native listeners wired in **both** modes; `onDropTargetChange` move branch →
  `store.previewMove`; external payload carries `start`/`end`.
- **react** — `EventButton`: `withResizeHandles: boolean` → **`resizeEdges: ResizeEdge[]`** (selective edges).
  CSS orients handles by parent class. `useMonthWeeks` computes per-segment `resizeStart`/`resizeEnd` (handle
  splits across week rows: leading on first row, trailing on last). MonthView renders `.bc-drag-preview-month`
  **day-cell band** from `store.dragPreview`.
- **stories/docs** — `MonthEventResize` + `MonthDropFromOutside` stories; new "Dropping onto the month grid"
  section in DragAndDrop.mdx.
- **Gates:** all 8 projects typecheck/test/lint/build ✓ (core 238, dnd 29, react 179).

---

### Phase 5 — Timed→all-day promotion (one-way) ✓ (commit a7a2284)

`data-bc-allday` on allday-slot cells; `ALLDAY_TARGET_ATTR` exported from dnd; promotion path in binder
(`canDrop` blocks allday-row sources; `mode:'day'+promote:true` on drop); `moveEvent.targetAllDay`;
`store.moveEvent.promote`. +9 core / +5 dnd tests. Story: `TimedToAllDayPromotion`; DragAndDrop.mdx section.
**One-way only** — an all-day event cannot be dragged down into the time grid (no natural time of day to snap to;
confirmed in DragAndDrop.mdx).

---

### Phase 5 — Dedicated `@big-calendar/react/dnd` subpath entry ✓ (commit 73bf489)

`src/dnd/index.ts` barrel; multi-entry vite config; `"./dnd"` exports map. Both `@big-calendar/react/dnd`
and the main barrel work.

---

### Phase 5 tail — Start-edge keyboard resize (Shift+Alt+arrow) ✓ (commit da76e6b)

Extends the end-edge-only `grabResize` to move the start boundary.
- **core** — `grabResize` gained `edge?: 'start' | 'end'` (default `'end'`). Start-edge path: moves
  `grab.start`, keeps `grab.end` fixed; clamped to never closer than one slot/day to end. In time mode:
  `diff(end, candidate, 'minute') < step → clamp to end - step`. In day mode: `gt(candidate, end, 'day') →
  add start + diff(startOf(end), startOf(start)) days` (moves start to end's same day).
- **react** — `useKeyboardDnd`: chord disambiguation: `e.shiftKey && e.altKey` checked BEFORE `e.shiftKey` to
  prevent end-edge firing on Shift+Alt. `pickupHint` updated for both modes.
  - Time-grid: `Shift+Alt+↑ / ↓` → `grabResize({ minutes: ∓step, edge: 'start' })`
  - Month: `Shift+Alt+←/→/↑/↓` → `grabResize({ days: ±1/±7, edge: 'start' })`
- **DragAndDrop.mdx** — `Shift + Alt + ↑ / ↓` row added (time-grid); `Shift + Alt + ← / →` and
  `Shift + Alt + ↑ / ↓` rows added (month).
- **Tests** — 9 new React tests (useKeyboardDnd.test.tsx) + 2 core tests. core ~252, react ~201.
- **Note:** react tests import from `dist/`; always `pnpm nx build core` after any core source change.

---

## Phase 4 entries

### Phase 4 — Slot/event handler separation + move-to-core (Cutter, 2026-06-07) ✓

- **Renames (breaking public API):**
  - event-selection action `store.select({id})` → **`store.selectEvent({id})`**; notify `onSelect` → `onEventSelect`
  - slot live callback `onSelecting` → **`onSlotSelecting`**
  - committed slot callback `onSelectSlot` (single, with `action`) **split** into **`onSlotClick` /
    `onSlotDoubleClick` / `onSlotSelect`** — the `action` field was **removed** from `SlotSelectionDates`.
- **Event handlers moved INTO core** (`CalendarConfig`): `onEventClick` / `onEventDoubleClick` /
  `onEventRightClick` / `onEventMiddleClick`. `domEvent` is the **global `MouseEvent`** (web standard via the
  DOM lib already in `tsconfig.base`), NOT React's synthetic — the React adapter passes `e.nativeEvent`.
- **New `store.eventHandlers`** (`EventHandlerApi<TEvent>`, exported): `has` / `hasRightClick` /
  `hasMiddleClick` presence flags + `click` / `doubleClick` / `rightClick` / `middleClick` methods.
- **React adapter thinned:** `CalendarProvider` no longer wraps/tracks event handlers; context dropped its
  `onEvent*`/`hasEventHandler` fields. `EventButton`/`AgendaEventButton` read `store.eventHandlers`.
  `CalendarProps` inherits the handler types from `CalendarConfig`.
- Gates: typecheck core+react ✓; tests core 151 + react 151 ✓; per-file coverage all touched files clear.

---

### Phase 4 — Event double-click also selects (Cutter, 2026-06-07) ✓

- `EventButton` factored a shared `select()` step; now called by **both** `primary()` (click · Enter · Space)
  and `secondary()` (double-click · F2). Grid views select on either gesture; `AgendaEventButton` unchanged
  (no selection in agenda).
- **Also reconfirmed:** the previously-flagged `useSlotSelection.test.tsx:282-283` typecheck failure is GONE
  (resolved when the separation refactor edited that file) — `nx typecheck core react` clean.
- Gates: typecheck core+react ✓; core 151 + react 151 ✓; lint ✓; react build-storybook ✓.

---

### Phase 4 — Task 2m: view registry (custom views, §9) — CORE ✓ (Cutter, 2026-06-07)

Implements the locked **Option B** contract (DECISIONS.md 2026-06-05). Custom views are now a first-class
**core** escape hatch; the 5 built-ins stay hardcoded and the registry is consulted **only** in each seam's
`default` branch.
- **`ViewKey` widened** `BuiltinViewKey → BuiltinViewKey | (string & {})` — keeps built-in literal autocomplete
  while admitting custom keys.
- **`CalendarViewModel` gained one additive arm** `{ kind: 'custom'; view: ViewKey; model: unknown }`.
- **New registry types** (viewRegistry.type.ts): `ViewDefinition<TEvent,TResource,TModel>` (4 pure fns
  `range`/`navigate`/`label`/`buildModel`), `ViewRegistry`, `ViewRegistrySeams`; `defineView<TEvent,TResource>()(def)`.
- **Four seams threaded** (each: `registry?` param + `default` branch): `viewRange`, `navigateDate`,
  `viewLabel`, `buildViewModel`.
- **React fallout fixed:** `DefaultToolbar` indexed `messages[option]` with a now-`string` `ViewKey` →
  added `viewButtonLabel(messages, view)`.
- **Tests:** new viewRegistry.function.test.ts — a demo "3-day" custom view exercises all four seam custom
  branches + `defineView` + a store integration. core **163 tests**.
- Gates: typecheck/test/lint/build core ✓; typecheck/test 151/lint/build react ✓.

---

### Phase 4 — Task 2m: view registry — REACT render path (Option A, Cutter 2026-06-07) ✓

- **`CalendarComponents.views?: Record<string, ComponentType<CustomViewProps>>`** + exported
  `CustomViewProps { view: ViewKey; model: unknown }` (components.type.ts).
- **`<Calendar>` dispatch** (Calendar.component.tsx): for `viewModel.kind === 'custom'` looks up
  `components.views?.[viewModel.view]` and renders it inside `.bc-calendar` with `{ view, model }`.
- **Tests:** +2 Calendar (3-day `defineView` + component renders via `components.views`; nothing when
  component is unregistered).
- **Storybook:** new `React/Calendar → CustomView` story.
- Gates: react typecheck/test (153)/lint/build ✓; build-storybook react ✓. **2m fully done** (core + React).

---

### Phase 4 — §7.7 coarse-pointer / touch CSS pass (Cutter, 2026-06-07) ✓

- `--bc-touch-target` token (default `2.75rem`, WCAG 2.5.5 / platform touch floor).
- `components/coarse-pointer.css` (NEW, `@layer bc.components`, imported last in index.css) — a
  `@media (pointer: coarse), (hover: none)` block that grows the **discrete** controls to `--bc-touch-target`:
  `.bc-toolbar button`, the `.bc-date-number` / `.bc-day-heading` drilldowns, `.bc-show-more`,
  `button.bc-agenda-event`. **Geometry-sized event boxes + slot cells deliberately NOT enlarged** (their size
  encodes duration / the slot grid).
- `touch-action: pan-y` added to `.bc-month-grid` + `.bc-allday-row` (matching the existing `.bc-time-body`).
- VOCABULARY.md gained a "Touch & coarse pointer (§7.7)" section.

---

### Phase 4 — Selection Storybook split docs (Cutter, 2026-06-07) ✓

Satisfies the carried Phase-4 obligation — the React Storybook MUST clearly document the core-FSM ↔
adapter-mapping selection split.
- `Selection.mdx` gained a new **"Architecture: core FSM ↔ adapter mapping"** section (3-layer table: 1 core
  `createSelection` FSM in slot-index space · 2 store index→ISO-date translation · 3 React adapter).
- `SelectionContract.mdx` (core) gained a pointer to the React Architecture section.

---

### Phase 4 — Task 4a: React test infra + signals→React bridge ✓ (commit f7929a4)

- Installed `jsdom` + `@testing-library/react` + `@testing-library/dom`.
- `packages/react/vitest.config.ts` → `environment: 'jsdom'`, `globals: true`, `setupFiles: ['./vitest.setup.ts']`
  (afterEach `cleanup()`), includes `.tsx`, coverage over `.{ts,tsx}`. Per-file bar (85% branch / 95% func).
- `useSignalValue.ts` — `useSyncExternalStore` over a `@preact/signals-core` signal; SSR-safe.
- `@preact/signals-core` added as a direct dependency of `@big-calendar/react`.
- Tests: 4. react: 5 tests total.

---

### Phase 4 — Task 4b: useCalendar headless hook ✓ (commit 7dfbaaa)

- **DECISION (Cutter 2026-06-02): React state model = HYBRID** (uncontrolled by default, opt-in controlled
  per prop). See DECISIONS.md.
- `useCalendar(props)` creates the store once (ref), syncs controlled `view`/`date` by writing the signals
  directly (no callback re-fire), always syncs `events`/`backgroundEvents`/`resources`, wraps callbacks to
  read latest props, destroys on unmount.
- `CalendarProps<TEvent,TResource>` = `Omit<CalendarConfig,'view'|'date'>` + `defaultView`/`defaultDate`
  (uncontrolled) + `view`/`date` (controlled).

---

### Phase 4 — Task 4c: CalendarProvider + CalendarContext ✓ (commit 2c36865)

- **DECISION (Cutter 2026-06-02): component/API contract settled.** Shell = HYBRID; **context REQUIRED and
  WRAPS `<Calendar>`** (provider owns the store; `<Calendar>` + siblings consume it).
- `CalendarProvider.component.tsx` runs `useCalendar(props)`, memoizes `{ store }`, publishes via context.
- `useCalendarContext.ts` throws outside a provider → enforces "must be inside a provider".
- `useCalendarStore.ts` convenience = `useCalendarContext().store`.

---

### Phase 4 — Task 4d: geometry bridge + core viewLabel + Toolbar ✓ (commits cbb574b, edbd211, b49ce61)

- **geometry.function.ts** — `eventBoxStyle`/`segmentStyle`/`nowIndicatorStyle`/`selectionStyle` map core
  fractions to `--bc-*` custom properties. `StyleWithVars = CSSProperties & Record<\`--${string}\`, string|number>`.
- **viewLabel** — `viewLabel({localizer,view,date,range})`: month→`monthHeader`, day→`dayHeader`,
  week/work_week/agenda→`monthDay` span. `label: ReadonlySignal<string>` added to the store.
  **DECISION (Cutter 2026-06-02): localized labels computed in CORE** so every adapter renders the identical title.
- **Toolbar** — `CalendarComponents` (override map) + `ToolbarProps` (label/view/views/messages/onNavigate/onView)
  + `DefaultToolbar` (today/prev/next + label + view switcher). Context extended to `{ store, components, messages }`.

---

### Phase 4 — Task 4e: AgendaView ✓ (commits cfa5d2c core, 980168c react)

- **DECISION (Cutter 2026-06-02): event TIME strings formatted adapter-side** via a shared tested
  `formatEventTime` helper. See DECISIONS.md.
- `formatEventTime.function.ts` — all-day label vs "start – end" (null-safe), `agendaTime`/`time` roles.
- `CalendarComponents<TEvent>` now generic; added `agenda` slots (`date`/`event`/`empty`).
- `AgendaView/` — reads agenda model from context, resolves `components.agenda.{date,event,empty}` ?? defaults.
- react: 32 tests, 100% all metrics.

---

### Phase 4 — Task 4f: MonthView ✓

- **DECISION (Cutter 2026-06-03): per-day "now" source = `store.getNow()`** (exposed on the public
  `CalendarStore`). Adapters derive today / now-indicator state themselves; off-range is an adapter-side
  localizer month-compare vs the focus date.
- `store.getNow()` added + `config.weekEventLimit` surfaced + threaded into `viewModel` computed.
- `monthGridStyle(weekCount)` → `--bc-week-count` geometry helper.
- `CalendarComponents.month` (`MonthComponents<TEvent>`): slots `weekday`/`dateCell`/`event`/`showMore`.
- `MonthView/` — `.bc-month` header + grid, resolves 4 month slots ?? defaults, wraps each event in
  `.bc-segment` carrying `segmentStyle`, date cells drill down on click, per-week `.bc-show-more`.
- react 38 tests.

---

### Phase 4 — Task 4g: TimeGridView ✓

- **DECISION (2026-06-03): expose resolved `store.step` / `store.timeslots`** on the public `CalendarStore`.
- `dayCountStyle(n)` → `--bc-day-count` and `slotCountStyle(n)` → `--bc-slot-count` geometry helpers.
- `CalendarComponents.time` (`TimeComponents<TEvent>`): slots `dayHeading`/`timeLabel`/`event`/`allDayEvent`/`showMore`.
- `TimeGridView/` — `.bc-time-grid` → `.bc-time-header` + `.bc-allday-row` + `.bc-time-body`/`.bc-time-gutter`/
  `.bc-day-column`; timed boxes `.bc-event`, all-day `.bc-segment`, bg events `.bc-bg-event`,
  now-line `.bc-now-indicator`.
- react 45 tests.

---

### Phase 4 — Task 4h: `<Calendar>` + Toolbar/reset CSS fix + light Storybook ✓

- **CSS fix (styles):** `reset.css` — re-scoped `.bc-calendar` → `:is(.bc-calendar, .bc-toolbar)` so a
  standalone Toolbar gets the reset. `layout.css` — toolbar moved outside; `1fr` (Toolbar is a sibling
  OUTSIDE `.bc-calendar`; no shell wrapper).
- **Light Storybook:** per-package `.storybook/` config; all stories + `.mdx` docs in `packages/<pkg>/stories/`.
  Stack: `storybook` + `@storybook/react-vite` + `@storybook/addon-docs` `^10.4.2` (SB10 supports Vite 8 + React 18/19).
  `pnpm-workspace.yaml` `allowBuilds: esbuild: true`. `nx.json` production inputs gained `!{projectRoot}/stories/**/*`.
- **`<Calendar>` component:** generic `<TEvent,TResource>`, sole prop `toolbar?: boolean | undefined`
  (default `true`). Renders fragment `<>{toolbar ? <Toolbar/> : null}<div className="bc-calendar">{view by viewModel.kind}</div></>`.
  View dispatched by `viewModel.kind`.
- Gates: react **53 tests** (7 new Calendar), full-suite coverage 100% stmt/fn/line, 97.65% branch.
  Both Storybooks build.

---

### Phase 4 — Task 4i: Top-layer UI (§7.5) — Popover / Tooltip / Dialog + show-more popovers ✓

- `floatingPosition.ts` — lazily `import('@floating-ui/core')` (cached promise), minimal viewport DOM
  platform, `strategy:'fixed'`, middleware `[offset, flip, shift, size]`.
- `useFloatingAnchor.ts` — shared hook keeping a floating element positioned against an anchor while open.
- `Popover/` — anchored top-layer popover. Declarative `popovertarget` (browser owns open/close + light-dismiss
  + Esc); React tracks open via panel's `toggle` event (`onToggle` prop, no imperative effect).
  `popover="auto"`, `aria-haspopup/expanded/controls`, `trigger` render-prop. Content mounts only while open.
- `Tooltip/` — `popover="manual"` top-layer tooltip; opens on hover **and** focus, **toggles on tap**
  (coarse-pointer reachable, §7.7). `role="tooltip"` + `aria-describedby`.
- `Dialog/` — thin native `<dialog>` modal wrapper. `showModal()` → focus-trap + Esc + `::backdrop`;
  **restores focus** to prior element on close.
- **Threaded overflow events:** `MonthShowMoreProps`/`TimeShowMoreProps` generic `<TEvent>` + `events`.
  `DefaultMonthShowMore`/`DefaultTimeShowMore` now render a Popover.
- styles: `components/popover.css` gained `.bc-popover-events`/`.bc-popover-event` + `.bc-dialog` + `::backdrop`.
- Storybook: stories + `.mdx` for `React/Top layer/{Popover,Tooltip,Dialog}` + `React/Calendar → ShowMorePopover`.
- react **76 tests** (23 new).

---

### Phase 4 — Task 4i follow-ups: month "+N more" per-day (Cutter, 2026-06-03) ✓

Fixed: month overflow indicator rendered at the week start (Sunday col), not the day that overflowed.
- `useMonthWeeks` — overflow moved off `MonthWeekCell` onto each `MonthDayCell<TEvent>`: per day column `c`
  (1-based), `extra = week.extra.filter(seg => seg.left <= c <= seg.right)` → `{count, events}` or null.
- `MonthView` — renders one `<ShowMore>` per overflowing day cell, wrapped in `.bc-show-more-cell` placed
  via `segmentStyle({left: col, span:1, row: moreRow})`.
- styles — added `.bc-show-more-cell` to `month.css`.
- Tests: new MonthView test asserts indicator lands in correct column.

---

### Phase 4 — Task 4i-fix2: `--bc-day-count` on container (Cutter, 2026-06-04) ✓

Root cause: time gutter spanned the full width with no day columns. Set `--bc-day-count` **once on
`.bc-time-grid`** so all children inherit it (custom props inherit). Removed redundant inline `dayCountStyle`
from `.bc-time-header` and `.bc-allday-segments`.

---

### Phase 4 — Task 4i-fix3: time-grid header alignment + gutter group spanning (Cutter, 2026-06-04) ✓

1. **Day headings one column left of the body.** Fix: render an empty `.bc-time-header-gutter` spacer as
   the header's first child so headings land in tracks 2–8, aligned with the body day columns.
2. **Gutter didn't start at 12 AM / labels didn't cover their hour blocks.** Fix: `--bc-slots-per-group`
   (= `store.timeslots`, default 2) drives `grid-auto-rows: calc(var(--bc-slot-height) * var(--bc-slots-per-group, 1))`
   in layout.css; new `slotGroupStyle(slotsPerGroup)` geometry helper.

---

### Phase 4 — Task 4i-fix4: time-grid border/spacing pass (Cutter, 2026-06-04) ✓

- Story height 640 → 800 in `harness.tsx`.
- `.bc-time-label` gains `border-block-start: var(--bc-border)` so each labelled hour group shows a top line.
- Closing bottom border on `.bc-time-grid` (`border-block-end: var(--bc-border)`) + `margin-block-end: 2px`.

---

### Phase 4 — Task 4i-fix5: hour vs half-hour slot line colors (Cutter, 2026-06-04) ✓

Two layered gradients on `.bc-day-column`: hour lines (one per group of `--bc-slots-per-group` slots) in
`--bc-color-border`; lighter half-hour lines beneath in new `--bc-color-slot-border` token (`CanvasText 10%`).
`--bc-slots-per-group` moved to `.bc-time-grid` container so BOTH gutter and columns inherit it.

---

### Phase 4 — Task 4i-fix6: agenda — periwinkle scoping + grouped table layout (Cutter, 2026-06-04) ✓

**A — periwinkle scoping:** moved temporary periwinkle to `--bc-color-event-bg` token; switched default
agenda event off `.bc-event` → `.bc-agenda-event` so the agenda list isn't filled.

**B — agenda layout:** `.bc-agenda` is now the `auto auto 1fr` (date|time|event) grid; `.bc-agenda-header`
and `.bc-agenda-body` are `grid-template-columns: subgrid`. Each `.bc-agenda-day` also a column-subgrid with
`grid-template-rows: repeat(var(--bc-agenda-rows), auto)`. New `agendaRowsStyle(count)` helper. AgendaView
now renders a Date/Time/Event header. Default agenda event dropped the `.bc-event-title` wrapper.

---

### Phase 4 — Task 4j: selection wiring — all steps ✓ (commits d790ca4..b5b5914)

#### Step 1 — FSM → store (commit c6d3d15)
- FSM: added `doubleClick({slot})` action + `'doubleClick'` to `SelectAction`.
- `SelectionApi`: wraps one `createSelection` controller — `{ state, range }` signals + actions.
  `start/click/doubleClick` take `{ slot, date, mode }`; store captures `{mode,date}` and **translates
  index→ISO-date on commit** (decision: translation in core/store, reused by all adapters).
- Config callbacks: `onSlotSelecting({start,end})=>bool|void` (veto), `onSelectSlot({start,end,slots,action})`.
- Reset effect cancels any in-progress drag on view OR date change.

#### Steps 2-3 (commits ecf0711, 58a25c7)
- Step 2: transparent `.bc-time-slots` grid of `.bc-time-slot` (`data-date` + `data-slot-index`) per day column.
- Step 3: internal `<button>` wrapper (`data-bc-event`), wired into Month + TimeGrid. click→select+`onEventClick`;
  dblclick→`onEventDoubleClick` (250ms). Enter/Space=primary, F2=secondary; pointerdown stopPropagation.
  New `onEventClick`/`onEventDoubleClick` props.

#### Step 5a — time-grid pointer (commit 39e4688)
- `useSlotSelection(mode)`: pointer drag/click/dblclick from `[data-slot-index]` hit cells → `store.selection`;
  4px drag threshold, 250ms tap-debounce, defers over `[data-bc-event]`. window-tracked move/up + unmount cleanup.
  TimeGridView wires it to `.bc-time-body` + renders `.bc-selection` in the anchored column during a drag.

#### Step 5b — month day selection + all-day row (commits 85de055, 0fb17d1)
- MonthView: non-overridable `.bc-month-slots` hit layer; `useSlotSelection('day')` on `.bc-month-grid`;
  per-week `.bc-selection.bc-selection-month` band, range clipped to each week row.
- Cross-day time → all-day: hit cells use global slot index (`dayIndex*slotCount + slot`); store decodes
  same-day → timed selection, cross-day → whole-day span. `SlotSelectionDates` + `onSlotSelecting` gain
  `allDay: boolean`.
- All-day row day selection: second `useSlotSelection('day')` on `.bc-allday-row`; `.bc-allday-slots` hit layer.

#### Steps 5c-1/5c-2 — keyboard roving
- `useRovingSelection.ts`: keyboard roving-tabindex + selection for one slot surface. Arrow moves focus via a
  view-supplied `neighbor(index,dir)` map. Shift+Arrow extends selection. Enter/Space commit. Esc cancels.
  Wired into all three slot surfaces.
- `useEventRoving.ts`: event buttons become one tab stop, Arrow moves focus among them (Enter/Space/F2 stay
  on the button). Attaches at the view root, manages `tabIndex` imperatively.

#### Focus ring + Selection.mdx
- Slot cells got `position: relative` + `:focus-visible::after` ring (`z-index:5`, inset outline-offset).
- `stories/Selection.mdx` (`React/Selection`): full selection doc — `selectable` values, `onSelecting`/
  `onSelectSlot` contract, pointer + keyboard (two roving tab stops, key tables), touch, `data-*` DOM model.

#### Step 6 — `aria-describedby` instructions
- Core messages: added `selectionInstructions` and `eventInstructions` to `Messages` interface +
  `DEFAULT_MESSAGES`.
- `CalendarProvider` renders two visually-hidden `<p class="bc-sr-only">` instruction elements (ids from
  `useId()`); exposes `descriptionIds: { selection, event }` on the context.
- `aria-describedby={descriptionIds.selection}` on every focusable slot cell; `aria-describedby={descriptionIds.event}`
  on each `EventButton`.

#### Remaining 4j follow-ups
- **Selection gutter:** `--bc-event-gutter: 0.625rem` token; `.bc-event, .bc-bg-event` squeeze fractional
  layout to `100% - var(--bc-event-gutter)`, leaving a permanent selectable strip on the trailing edge.
  CSS-only, no core/geometry/JS change.
- **Touch long-press + scroll suppression:** `longPressThreshold` config (default 500ms). On touch, a press
  arms a long-press timer; selection begins only after the hold. Movement before firing = scroll → gesture
  abandoned. `pointercancel` aborts the in-progress range. `touch-action: pan-y` on `.bc-time-body`.
- **Agenda event interaction + right/middle click:** `AgendaEventButton` bespoke element (link-styled, wires
  click/dblclick/F2, natural tab order — each title its own tab stop, no roving hook). New public handlers
  `onEventRightClick` / `onEventMiddleClick` added to `CalendarProps` and wired on **both** `EventButton` and
  the agenda element.

Final state entering Phase 5: core 147 tests, react 124 tests. Full Phase 4 pushed.

---

## Earlier phases (Phases 0–3)

### Phase 3 — Styles ✓ (commits 0f1a20f, ca0f567, 5d3bac6)

- **`tokens.css`** — full `--bc-*` set (surfaces, event/now/selection colors via `color-mix` over system
  colors for auto light/dark, spacing/typography/border scales, focus ring, density sizing, popover elevation),
  self-wrapped in `@layer bc.tokens` on `:where(.bc-calendar)`.
- **`reset.css`** — opt-in modern reset scoped under `.bc-calendar` (`@layer bc.reset`): box-sizing,
  margin/list/form/button/table normalization, token-driven `:focus-visible`, reduced-motion.
- **`layout.css`** (`@layer bc.layout`) — structural grids + the **geometry contract** (documented in the
  file header + VOCABULARY.md): month grid as nested **subgrid** (week rows re-expose 7 cols so date cells +
  multi-day segments align via two overlapping full-width subgrids), time grid (gutter + day columns, scrollable
  slot body, all-day segment row), agenda rows, toolbar/header flex, now-indicator + selection overlays.
  Event boxes from `--bc-top/height/left/width` fractions; **logical properties** throughout;
  **container queries** (`@container bc`) for responsive collapse.
- **`components/*.css`** (`@layer bc.components`) — visual skin only, all via tokens: toolbar, month
  (date cells/today/off-range/show-more), timegrid (headings, gutter labels, slot-line gradient, now-knob),
  event (timed/segment/bg/selected/title/time), agenda, popover (native `[popover]` + `:popover-open`,
  `::backdrop`), selection.
- **`index.css`** — declares the `bc.reset,tokens,layout,components,theme,overrides` layer order then
  plain-imports every self-layered file. `package.json` exports add `./components/*.css`.
- **`VOCABULARY.md`** — the class-name + geometry-custom-prop contract the React layer will consume.
- **`spike/index.html`** — static visual spike rendering month / time-grid / agenda from representative
  core geometry.

---

### Phase 2 — Core engine sub-tasks 2a–2l (all committed and pushed)

Core logic complete: constants/accessors, store factory, navigation/drilldown/range, layout algorithms,
all 5 view models (month / time-grid / agenda), resource grouping, selection FSM, messages, derived `viewModel`
store signal + parity config, background events.

Key commits:
- 2a: `8096d7a` — `Views`/`Navigate`/`ViewKey`/`EventId`/`ResourceId` + `Accessors`
- 2b: `19a912f` — store factory: `CalendarConfig` (Phase-2b subset), `CalendarStore`, `navigateDate`, `createCalendarStore`
- 2c: `cd579c9` — `viewRange`, `resolveDrilldownView`, `range` computed signal, `onRangeChange` effect
- 2d: `63acdbc` — `overlap`/`no-overlap` layout algorithms (fraction-based)
- 2e: `fa78b10` — `monthViewModel`, `MonthSegment`/`MonthWeek`/`MonthViewModel`
- 2f: `b881720` — `createSlotMetrics`, `timeGridViewModel`, shared segments module
- 2g: `42b497c` — `agendaViewModel`, `groupEventsByResource`
- 2h: `b68fde8` — slot-selection FSM: `createSelection` → `SelectionController` over slot indices
- 2i: `1b4ad37` — `Messages` interface, `DEFAULT_MESSAGES`, `resolveMessages`
- 2j: `e3909c4` — `buildViewModel`, `viewModel: ReadonlySignal<CalendarViewModel>`; `dayLayoutAlgorithm`/`step`/
  `timeslots`/`min`/`max` config options; `viewModel` computed in store
- 2l: `a651ee7` — `backgroundEvents` in time-grid columns

Final state: 168 Vitest cases, every file ≥85% branch / ≥95% func.

**Localizer test retrofit** (commits `b692032` + `ce8f640`): replaced temporary fake localizers in non-localizer
tests with the real `TemporalLocalizer`. **Found and fixed two production `diff()` sign bugs** (slotMetrics
`positionFromDate` and `segments.function.ts` `slots`/`span` calculation — the fakes' inverted `diff = b − a`
had exactly cancelled both bugs).

---

### Phase 1 — Localizer ✓

- **1a** — `@big-calendar/localizer` base: `LocalizerContract`, `Localizer<T>` abstract class, ponyfills
  (`getWeekInfo`, `formatDuration`), `DEFAULT_FORMATS`. 44 test cases via UTC `TestLocalizer` fixture.
- **1b** — `@big-calendar/localizer-temporal`: `TemporalLocalizer extends Localizer<Temporal.ZonedDateTime>`,
  async `createTemporalLocalizer`, lazy `loadTemporal()`. 17 tests incl. real DST.
- **1c** — CSS layout/top-layer support spike: `memory/spikes/phase1-css-layout.md`. Decision: adopt subgrid +
  Popover + `:dir()` (Baseline); **use `@floating-ui/core` as the default positioning engine** (native CSS
  anchor positioning deferred until Baseline-stable).

---

### Phase 0 — Foundations ✓

Repo + workspace config, Nx (Cloud OFF) + Nx Release, TS base, ESLint flat config with
`@nx/enforce-module-boundaries` scope graph, commitlint + Husky, Vitest workspace, 4 CI workflows,
8 package scaffolds. All gates green; module-boundary enforcement verified.

---

## Deferred items (explicit)

- **CSS Anchor Positioning** — use `@floating-ui/core` for all tethered positioning. Adopt native CSS anchor
  positioning (`anchor-name`/`position-anchor`/`anchor()`/`position-try`) as a feature-detected progressive
  enhancement **only once it is stable across engines** (Chromium-only as of Jan-2026 cutoff; Safari/Firefox
  not yet shipped). Trigger to revisit: confirm Safari + Firefox stable support via caniuse/MDN.
  See `memory/spikes/phase1-css-layout.md` + DECISIONS.md (2026-06-02).

## Notes

- Toolchain pinned to latest stable at scaffold time: nx 22, TS 6, Vite 8, Vitest 4, ESLint 10,
  typescript-eslint 8.60.
- `subgrid` is now a dependency of the resource grid scroll architecture (Chrome 117+, FF 71+, Safari 16+).
