# DECISIONS — Active (Phase 5 onward)

> Phase 0–4 decisions archived to `DECISIONS-ARCHIVE.md` (with topic index).
> Add new entries here; archive when a phase is fully closed.

---

## 2026-06-07 — Phase 5 (DnD) opened: architecture + first slice (Cutter)

Two AskUserQuestion calls settled how Phase 5 (`@big-calendar/dnd` + React integration; roadmap §14 row 5) starts.

- **Decision 1 — core owns the move/resize date-math (mirror selection).** `@big-calendar/core` gains the `onEventDrop`/`onEventResize` config callbacks (ISO-string payloads, no `Date`), the pure `moveEvent`/`resizeEvent` helpers, and the `draggable`/`resizable` accessors. `@big-calendar/dnd` is the **framework-neutral pointer layer** (Pragmatic Drag and Drop) that decodes a DOM drop into a target slot/day and calls `store.moveEvent`. **Why:** identical computation across every adapter (React today, Vue/Angular/Lit later), same split that worked for selection (pure logic in core, DOM in the adapter). Rejected putting the math in the dnd package (would duplicate date logic outside core and break the "logic in core" principle).
- **Decision 2 — thin vertical slice, event MOVE first.** Build move end-to-end (core math + dnd controller + React wiring + a Storybook story), gate it, then layer resize → outside-drop → keyboard DnD as follow-up tasks. Rejected core-first horizontal (bigger PRs, nothing demoable until late).
- **Slice scope (5a) = month (day-mode) move only.** Month drops decode purely from the cell's `data-date` (a whole-day shift, time-of-day preserved). **Time-grid (`'time'`) move is deferred to the next slice** because a time-grid slot cell's `data-date` is only the *day* — the exact slot instant needs `step`/`dayStartMin`/slot decode the cell doesn't yet expose. `moveModeForView` returns `'day'` for month, `null` (no DnD) otherwise, for now.
- **`onEventDrop` payload** = `{ event, start, end, allDay }` (ISO strings; duration preserved). `resourceId` is intentionally **not** included yet (no resource columns); it joins when resource-aware DnD lands. The store **does not mutate `events`** — the callback reports the new bounds; the app applies them (matches v1).
- **`allDay` is preserved** by `moveEvent` (a same-surface move). Cross-surface timed↔all-day promotion (drop a timed event on the all-day row, etc.) is a separate later concern.
- **dnd controller = MutationObserver binder.** `bindCalendarDnd({ root, store, mode })` scans `root` for `[data-bc-event]` drag sources (gated by `store.isDraggable`) and `[data-date]` drop targets, registers each via Pragmatic DnD, and re-syncs on DOM mutations; a single `monitorForElements` maps a drop → `store.moveEvent`. **No per-component changes** — it binds the `data-*` nodes the views already render. Tested by mocking the Pragmatic adapter (jsdom can't dispatch native drag events) and invoking the captured closures.
- **`DndStore<TEvent>` narrow interface** (getEvent/isDraggable/moveEvent) instead of the full `CalendarStore`, so the controller accepts any `CalendarStore<TEvent, TResource>` without `TResource` variance and keeps dnd's coupling to core minimal. New `store.getEvent({ id })` added to core (reused by the `moveEvent` action and the controller).
- **React glue home + optionality.** `useCalendarDnd(ref)` lives in `@big-calendar/react`; `@big-calendar/dnd` is an **optional `peerDependency`** of react (+ a devDep for react's own typecheck/test/storybook) — honours §11 (dnd is not a hard react dep) while letting the hook import it. Exported from the main barrel for the slice; a dedicated `@big-calendar/react/dnd` subpath entry for guaranteed tree-shaking is a packaging follow-up.
- **Gates:** core 184 + dnd 8 + react 159 tests; typecheck/test/lint/build green for all 8 projects; build-storybook react + core green. New `React/Drag and drop` stories (`MonthEventMove`, `LockedEvent`).

## 2026-06-08 — DnD async data lifecycle = fully controlled (docs only) (Cutter)

How move/resize interact with async persistence + rollback. Cutter chose **fully controlled** (AskUserQuestion) over an async-aware "committing" flag, and explicitly over calendar-managed auto-revert.

- **Decision:** the calendar stays a **controlled render of dev-owned `events`** and does **not** participate in the async save. `onEventDrop` (and the future `onEventResize`) *report* the proposed change; the developer owns the whole lifecycle — optimistic update, async persist, and **rollback on failure** — operating on their own `events` state.
- **No contract change needed.** The handler may be `async`; the calendar never awaits it (no type-checked promise lint is on, so an `async` handler already assigns to the `=> void` callback — no signature widening required). Enriched the `onEventDrop` JSDoc to state this.
- **Why the payload is already right:** the calendar reports **normalized values + the original event** (`{ event, start, end, allDay }`), not a pre-merged "updated event" — because **accessors are read-only**, core can't write new values back into an arbitrary event shape. The dev merges. The original `event` is included so rollback is trivial (restore previous `events`).
- **Rejected — calendar-managed optimistic state + auto-revert:** would force the calendar to hold a shadow copy of event data, breaking the segmentation (core owns calendar *logic/geometry/interaction state*; the developer owns *event data + persistence*) kept everywhere else.
- **Deliverable (docs only):** new `React/Drag and drop/Guide` MDX documenting the controlled async pattern (optimistic update + rollback, novice tone) + a runnable `AsyncSaveWithRollback` story (a checkbox forces the next save to fail → the event reverts). The same pattern will cover `onEventResize` when resize lands.
- **Gates:** core + react typecheck/test/lint/build ✓; build-storybook react ✓.

## 2026-06-08 — Phase 5 task 5b: time-grid (`'time'`) move = slot-instant DOM attr

How the deferred-from-5a time-grid move was wired, keeping the segmentation 5a established.

- **Decision — the view exposes the slot instant; the DnD layer reads it; core math is unchanged.** Each time-grid slot cell already rendered `data-date` (its day) for selection; for `'time'` move it now also carries **`data-bc-instant`** (the slot's start instant). `moveEvent`'s `'time'` mode (snap start to target + preserve duration) already existed from 5a — **no core change**. The DnD binder's drop attribute is **mode-keyed**: `'day'`→`data-date`, `'time'`→`data-bc-instant`. **Why:** the slot instant is **geometry the view already computes** (gutter labels are slot times; `createSlotMetrics().slots`), so the view emits it and core stays the single source of slot-time math — no slot-decode logic duplicated into the dnd package or threaded as `slotCount` like selection.
- **Rejected — pass `{slot,date,slotCount}` to a store decode (selection-style).** Would couple the framework-neutral binder to slot-index semantics and re-implement the slot→instant decode that `createSlotMetrics` already owns. The flat `data-bc-instant` string keeps the binder a dumb DOM→target mapper.
- **`bcDropDate`→`bcDropTarget`** (the drop's Pragmatic data key) — it now carries a day *or* an instant.
- **All-day row in `'time'` mode is not a drop target** (it has only `data-date`), so timed↔all-day promotion stays deferred (5d) — falls out naturally from the mode-keyed attribute.
- **`moveModeForView`** → `'time'` for WEEK/WORK_WEEK/DAY (was month-only); agenda still `null`.
- **Perf note (follow-up):** every slot cell becomes a Pragmatic drop target (~slotCount×dayCount, e.g. 48×7). Acceptable for now; a column-level drop target + pointer-Y decode is a later optimization if needed.
- **Gates:** dnd 9 + react 161 tests; typecheck/test/lint/build ✓ for dnd+react; build-storybook react ✓. New `WeekEventMove` story. **No browser run here** (jsdom can't fire native drag) — verify the time-grid drag visually in Storybook.

## 2026-06-08 — Phase 5 task 5c: time-grid event RESIZE = edge handles + inclusive-end snap (Cutter)

Cutter scoped resize via AskUserQuestion: **time-grid only this slice, month multi-day resize deferred**, and resize **must support cross-day boundaries like selection**.

- **Decision — mirror move's split; the only new math is the edge snap.** `core` gets the pure `resizeEvent` helper, the `onEventResize` callback (same `{event,start,end,allDay}` payload as `onEventDrop`), a `resizableAccessor`, `store.resizeEvent({id,edge,target})`, and resolved `isResizable`. `@big-calendar/dnd` binds `[data-bc-resize]` edge handles and routes their drop to `store.resizeEvent`; `@big-calendar/react` renders the handles. Same "core owns the math, dnd owns the pointer, view owns geometry, dev owns the data" division as 5a/5b.
- **Edge semantics:** `edge:'start'` sets start = the dropped slot's start instant; `edge:'end'` sets end = the slot's **end** (`target + step`) — the same inclusive-end convention as a slot selection (a one-slot selection at 9:00 spans 9:00–9:30). The opposite edge is left untouched. Result clamped to a one-slot (`step`) minimum so a resize can never invert or collapse the event. **Why end = target+step:** consistency with selection (Cutter's explicit ask) and intuitive "cover the slot you drag over".
- **Cross-day = free.** Because the drop target carries `data-bc-instant` (an **absolute** instant, day+time), dragging an edge into another day column resizes across midnight with no extra logic — the same property that made 5b's cross-day move free.
- **Handles live inside the event element** (`<span data-bc-resize="start|end">` inside the `[data-bc-event]` button); the binder reads the edge from the handle and the id from the nearest `[data-bc-event]` ancestor. Pragmatic DnD's nested-draggable handling means a pointerdown on a handle starts the **resize**, not the parent **move**. Handles render only when `withResizeHandles` is passed (time-grid only) **and** `store.isResizable(event)` — non-resizable events show none.
- **`touch-action: none` on `.bc-resize-handle`** (the §7.7 deferred bit) so a touch edge-drag resizes instead of scrolling the slot body.
- **Rejected — folding resize into the move source** (one draggable, infer intent from grab position): brittle hit-testing; explicit edge handles are clearer, accessible to gate per-edge, and let `touch-action` be scoped to just the handle.
- **Deferred:** month multi-day resize (segment-edge handles + day-mode resize math), drag/drop-from-outside, keyboard resize.
- **Gates:** core 192 + dnd 12 + react 164 tests; typecheck/test/lint/build ✓ for all 8 projects; build-storybook react ✓. New `WeekEventResize` story. **No browser run here** (jsdom can't fire native drag) — verify the edge-drag visually in Storybook.

## 2026-06-08 — Phase 5 task 5c-preview: live resize feedback = extent preview signal (Cutter)

Cutter asked to see where a resize will land during the drag, not just from pointer position. Chosen via AskUserQuestion: **live extent preview** (over a single target-slot highlight) and **resize only** (move preview deferred).

- **Decision — core holds a live `dragPreview` bounds signal; the view renders the proposed extent.** `previewResize({id,edge,target})` runs the *same* `resizeEvent` math as the commit (shared `computeResize` helper) but sets `dragPreview` instead of firing `onEventResize`; `clearDragPreview()` and committing both clear it. The DnD layer drives it from Pragmatic's `monitorForElements.onDropTargetChange` (per-slot during the drag). The time grid renders a `.bc-drag-preview` box from `dragPreview` using the **same `selectionStyle` + `createSlotMetrics().getRange`** path events/selection use, so cross-day previews span columns for free. **Why:** mirrors the existing selection-overlay pattern (interaction state in core, geometry in the view), and the preview is guaranteed identical to what will commit because it shares the math.
- **Rejected — single target-slot highlight (pure dnd + CSS class):** lighter, but shows only the snap point, not the resulting size; weak feedback for "where am I". Rejected per Cutter's choice.
- **Rejected — preview during move too (this slice):** Cutter scoped it resize-only; `onDropTargetChange` early-returns for move sources (no edge). Move preview is a trivial later add on the same signal.
- **Lifecycle:** preview cleared on commit, on drop outside any slot, when the edge leaves every slot, and on binder teardown — no lingering overlay.
- **Gates:** core 196 + dnd 15 + react 166 tests; typecheck/test/lint/build ✓ all 8 projects; build-storybook react ✓. **No browser run here** (jsdom can't fire native drag) — verify visually in Storybook (`WeekEventResize`).

## 2026-06-08 — Phase 5 task 5d: drag/drop across the calendar boundary (Cutter)

Cutter scoped 5d via AskUserQuestion: **both directions** (drop-into + drag-out), **native HTML5 sources too** (not only Pragmatic draggables), **payload carried on the drag source**, **time-grid first** (month deferred). Authorized all four sub-slices in one push. Two flagged calls confirmed in-session: **single-slot preview for native sources** and **drag-out to native targets** (yes).

- **Decision — keep the 5a–5c split; the outside item describes itself with a payload, and a drop is a CREATE.** Drop-into reports through a new `onDropFromOutside({start,end,allDay})` (not `onEventDrop` — there is no existing event); core's pure `placeExternalEvent({target,durationMinutes?})` turns the dropped slot + payload duration into bounds. The dev adds the event to their own `events` (same controlled/report-not-mutate model as move/resize). Drag-out reports `onEventDragStart({event})` and exposes the event on the native `dataTransfer`; the dev's own dropzone handles the removal.
- **Two transports, one payload shape (`{durationMinutes?, allDay?}`).** A **Pragmatic** `draggable` carries it as element data under `EXTERNAL_DATA_KEY` (`bcExternal`) — readable throughout the drag → true-extent live preview. A **native** `draggable="true"` element carries it as JSON on the `EXTERNAL_MIME` data type — and per the HTML5 spec the value is in **protected mode during the drag** (only the media *types* are visible), so the live preview can show only a **single landing slot** until the drop reveals the duration. This native-vs-Pragmatic preview difference is inherent, not a bug; documented, and the drop itself is always exact.
- **Why not fake the native duration mid-drag:** would require a type-name convention (encoding the duration into the MIME key) — hacky. Rejected per Cutter; single-slot preview is the honest behaviour.
- **Drag-out to native targets:** the event `draggable` sets `getInitialDataForExternal` (Pragmatic element-adapter hook) → writes `text/plain` + `EVENT_MIME` JSON, so a plain HTML5 dropzone reads it on drop with no calendar code on the receiving side. Drag-out works in **every** view (it's just the event becoming a native drag source); drop-into is **time-grid only** this slice (`mode==='time'` gates the external adapter wiring; month is a later slice).
- **Binder stays a dumb DOM↔target mapper.** Slots get a second `dropTargetForExternal` (composed cleanup under the one element key); a `monitorForExternal` handles native sources; `monitorForElements` gained a Pragmatic-palette branch. Core still owns all date-math.
- **Public API:** exported `EXTERNAL_MIME`, `EVENT_MIME`, `EXTERNAL_DATA_KEY` (so apps can wire native sources/targets), `ExternalDragPayload` (dnd), `placeExternalEvent`/`PlacedEvent`/`PlaceExternalEventArgs` + `EventTransfer` (core). Wired `onDropFromOutside`/`onEventDragStart` through `useCalendar` with the latest-ref wrapper (ERRORS.md rule: a drop-from-outside handler closes over the app's current `events`).
- **Deferred:** month drop-from-outside, keyboard DnD (5e), cross-surface timed↔all-day promotion, resource-aware drop.
- **Gates:** core 212 + dnd 26 + react 168 tests; typecheck/test/lint/build ✓ all 8 projects; build-storybook react ✓. **No browser run here** (jsdom can't fire native drag) — verify visually in Storybook (`DropFromOutside`, `DragOutToUnschedule`).

## 2026-06-08 — Phase 5 task 5d CORRECTION: native drop-from-outside ≠ Pragmatic "external" adapter (Cutter)

Cutter tested `DropFromOutside` in Storybook: dragging a native palette chip onto the grid just snapped back (drop never accepted). Root cause found in the installed Pragmatic source.

- **Pragmatic's "external" adapter means "from outside the browser *window*"** (OS files, text/links from another app or tab), **not** "from outside the calendar." Confirmed in `external-adapter.js`: it bails if `didDragStartLocally` is true (any `dragstart` inside the document disqualifies the drag) and only starts when `isEnteringWindow(...)` (the drag must cross the window boundary from outside). A same-page `draggable="true"` chip is neither a registered Pragmatic `draggable` (element adapter ignores it) nor window-crossing (external adapter ignores it) → no drop target accepts it → browser snap-back.
- **Cutter's scope (clarified):** "not expecting items from another window, not taking files from externals — just outside the grid itself." So OS/cross-window support is explicitly **not** wanted; the source is a same-page palette outside the grid.
- **Fix (chosen via AskUserQuestion — "Manual HTML5 listeners"):** removed the Pragmatic external-adapter wiring entirely (`dropTargetForExternal`/`monitorForExternal`) and replaced it with **plain delegated HTML5 `dragover`/`drop`/`dragleave` listeners on the calendar root**: resolve the hovered slot via `closest('[data-bc-instant]')`, gate on the `EXTERNAL_MIME` type, `preventDefault` to accept, `previewExternal({target})` for a **single-slot hover highlight** (Cutter also asked to see where the drop will land), and read the duration via `getData` on drop. The Pragmatic-`draggable` palette path (`monitorForElements` `bcExternal` branch, true-extent preview) is unchanged and still valid.
- **Drag-out unaffected:** it rides the element adapter's `getInitialDataForExternal` (populates native `dataTransfer`), independent of the external adapter.
- **Why this is the right tool:** Pragmatic by design will not track same-page native drags; manual HTML5 listeners are the only mechanism that catches them. Matches "simplest solution that's correct."
- **Gates:** core 212 + dnd 27 + react 168; all 8 projects typecheck/test/lint/build ✓; build-storybook react ✓. Native drag tested via synthetic `DragEvent`s in jsdom (stub `dataTransfer`). **Still needs Cutter's visual confirm in Storybook** (`DropFromOutside`) — jsdom can't drive a real native drag.

## 2026-06-08 — Phase 5 task 5e: keyboard-accessible DnD = modal grab (Cutter)

Cutter scoped 5e via AskUserQuestion: **modal grab** (pick up → arrow-step → drop), **move + resize**, **time-grid first**.

- **Decision — a core "grab" controller + a React capture-phase key layer; reuse the existing callbacks.** Core owns a `keyboardDrag` signal and `grabEvent`/`grabMove`/`grabResize`/`grabCommit`/`grabCancel`. The grab tracks running bounds and steps them by **deltas** (±step minutes for ↑↓, ±1 day for ←→, end-edge ±step for Shift+↑↓) — simpler than threading a target-instant like the pointer path, and the bounds math/clamp stay in core. Commit fires the **same** `onEventDrop`/`onEventResize` a pointer drag does, so a keyboard reposition is reported identically (a dev's one `apply` handler covers both). A move-then-resize commits **once** via `onEventDrop` (its payload already carries both ends).
- **Pickup key = Space; Enter stays "open".** A focused event already used Enter/Space for `onEventClick`. Rather than break click, Space now **picks up** (intercepted) and Enter keeps opening. Implemented via `onKeyDownCapture` on the time-grid root so the grab layer claims the key *before* `EventButton` and the roving hooks (capture runs ancestor→target; `stopPropagation` then suppresses the button's own handler). Flagged to Cutter; no objection.
- **Why core holds the grab (not just React):** it's interaction state + date math, same as the selection FSM and `dragPreview`. The view renders the proposed extent from the existing `.bc-drag-preview` box (the grab actions set `dragPreview`), so keyboard and pointer share one preview. The grabbed event is marked with `aria-grabbed` + a lifted/dimmed `.bc-event-grabbed` style.
- **a11y:** a polite live region in `TimeGridView` announces each step ("<title>, <day> <from> to <to>"); the shared `eventInstructions` message now documents Space-to-pick-up. Only **timed** events are grabbable this slice (gated to `.bc-time-body`); the all-day row and month/agenda are inert.
- **Rejected — direct nudge (Alt+Arrow commits each press):** fewer keystrokes but less discoverable and fires a callback per nudge (optimistic-save churn). Cutter chose modal.
- **id normalization fix:** `grabEvent` stores the event's **canonical accessor id**, not the raw (DOM-string) id passed in, so `EventButton`'s `aria-grabbed` match (accessor id, often numeric) works; `EventButton` also String-compares defensively.
- **Deferred:** month keyboard DnD, start-edge keyboard resize (only end-edge this slice), pointer move live-preview (the core `dragPreview` path now exists; wiring the pointer side is a small follow-up).
- **Gates:** core 221 + dnd 27 + react 173; all 8 projects typecheck/test/lint/build ✓; build-storybook react ✓. Keyboard tested in jsdom via real key events — **Cutter to confirm feel + SR announcements in Storybook** (`KeyboardDrag`).

## 2026-06-08 — Phase 5 follow-ups: month drop-from-outside + month resize + pointer move preview (Cutter)

Cutter: "let's do month drop-from-outside and month multi-day resize, plus pointer move now." Scoped via AskUserQuestion + a clarification.

- **Month drop-from-outside payload rule (Cutter's clarification):** a month day cell has no time of its own, so the **payload** decides. With **no** `start`/`end` template → a **whole-day** event on the dropped day (`durationMinutes` ignored — there's no slot). With a `start`/`end` template → keep its **time-of-day**, move the **date** to the dropped day, **preserve the duration** (a "9–10am" task dropped on the 14th → 9–10am on the 14th). This added optional `start`/`end` to `ExternalDragPayload` + `placeExternalEvent` (and `dropExternal`/`previewExternal`), and made `placeExternalEvent` **mode-aware** (`mode: MoveMode`, default `'time'`). Time mode also now derives its duration from a `start`/`end` template when no `durationMinutes` is given.
- **Pointer move live-preview = time-grid + month** (AskUserQuestion). New core `previewMove({id,target,mode})` (mirrors `previewResize`; reuses a shared `computeMove`); the dnd monitor's `onDropTargetChange` move branch (no edge) now calls it. Time-grid renders the existing dashed `.bc-drag-preview` box; **month** renders a new `.bc-drag-preview-month` **day-cell band** (same grid placement as the selection band). `moveEvent` now clears `dragPreview` on commit (it sets it during preview). The "move preview is a later slice" note is now obsolete.
- **Month resize = both edges, whole-day, min 1 day, week-wrap-aware** (AskUserQuestion). `resizeEvent` gained `mode: 'day'`: move the dragged edge by the **day delta** to the dropped day, preserve time-of-day, clamp the delta so the event keeps a one-day minimum (`min(rawDelta, endDay−startDay)` / `max(rawDelta, startDay−endDay)`). Cross-week works for free (the drop target is an absolute `data-date`).
- **Month resize handles split across week rows.** `useMonthWeeks` computes per-segment `resizeStart`/`resizeEnd`: the leading handle renders only on the row holding the event's real start (`startOf(start) ≥ weekFirst`), the trailing handle only on the row holding its real end (`ceil(end)−1day ≤ weekLast`). A multi-week event shows neither on its middle rows.
- **EventButton: `withResizeHandles: boolean` → `resizeEdges: ResizeEdge[]`.** One concept covers "both" (time-grid `['start','end']`) and "selective" (month per-row). **CSS keys off the parent class** for orientation — `.bc-event .bc-resize-handle` = vertical (ns-resize), `.bc-segment .bc-resize-handle` = horizontal (ew-resize) — so the component needs no orientation prop. `.bc-segment` gained `position: relative` to anchor the handles.
- **dnd binder: external + native listeners now wired in BOTH modes** (removed the `externalEnabled = mode === 'time'` gate). In `'day'` mode the native delegated listeners read `data-date` (month cells); a non-day target is ignored.
- **Rejected (Q1 option):** "always all-day on a month drop, ignore the payload" — Cutter wanted templates re-dated so a timed task keeps its time. **Rejected (Q3 option):** end-edge-only month resize — Cutter chose both edges.
- **Deferred (Phase 5 tail):** `resourceId` on the drop payload, timed↔all-day promotion, dedicated `@big-calendar/react/dnd` entry, month keyboard DnD.
- **Gates:** core 238 + dnd 29 + react 179; all 8 projects typecheck/test/lint/build ✓; build-storybook react ✓. **No browser run here** (jsdom can't fire native drag) — verify month resize, month drop-from-outside, and the move preview visually in Storybook (`MonthEventResize`, `MonthDropFromOutside`, `MonthEventMove`/`WeekEventMove`).

## 2026-06-08 — Phase 5 task 5g: month keyboard DnD = same modal grab, day-granular (Cutter)

Cutter: "you can do DnD path of keyboard resizing events in month view." Scoped via AskUserQuestion: **move + resize** (full parity, not resize-only), arrows **←→ = ±1 day / ↑↓ = ±1 week** (Shift = resize the end by the same amount).

- **Decision — generalize the 5e hook, not duplicate it.** `useKeyboardDnd` now takes `{ mode: MoveMode }`: `'time'` keeps the slot/minute scheme (↑↓ = slot, ←→ = day, Shift+↑↓ = resize end a slot); `'day'` uses ←→ = ±1 day, ↑↓ = ±1 week, Shift+arrow = resize end by that amount. The mode also picks the grabbable container (`.bc-time-body` vs `.bc-month-grid`) and the announcement (a time range vs a date range). Drop/cancel (Enter/Space/Escape) are shared. `TimeGridView` passes `{mode:'time'}`, `MonthView` `{mode:'day'}`.
- **Core — `grabResize` gained `days`** (`{minutes?, days?}`): whole-day end resize clamped to a one-day minimum (clamp the end back to the start's day, keeping its time-of-day), parallel to the existing minute/one-slot clamp. `grabMove` already supported `days`, so move needed no core change; week steps are just `grabMove({days:±7})`. `grabCommit` unchanged (still fires `onEventDrop` if moved, else `onEventResize`).
- **Reuse — preview + grabbed styling are automatic.** The grab actions set `dragPreview`, which `MonthView` already renders as the `.bc-drag-preview-month` day-cell band (from 5f); `EventButton`'s `aria-grabbed`/`.bc-event-grabbed` already keys off `keyboardDrag`. So month picked both up with no new view plumbing beyond mounting the hook + a polite live region on `.bc-month`.
- **Shared a11y message broadened.** `eventInstructions` dropped "On a **timed** event" / "hold Shift with **Up or Down**" → "To reposition an event… hold Shift while pressing an arrow key to resize" (accurate for both views; still contains `F2` for the message test).
- **Rejected:** resize-only month grab (Cutter chose move+resize); ←→-only mapping (chose ←→ day / ↑↓ week).
- **Deferred:** start-edge keyboard resize (end-edge only, both views); month keyboard pickup still ungated by `isDraggable`/`isResizable` (matches time-grid 5e).
- **Gates:** core 240 + dnd 29 + react 184; all 8 projects typecheck/test/lint/build ✓; build-storybook react ✓. **Confirm feel + SR announcements in Storybook** (`MonthKeyboardDrag`).

## 2026-06-08 — Phase 5 tail mini-plan + Step 1 (time-grid resources) scoping (Cutter)

Cutter ordered the remaining Phase-5 tail as a mini-plan: **(1) time-grid resource columns**, (2) timed→all-day promotion (one-way), (3) dedicated `@big-calendar/react/dnd` entry, (4) start-edge keyboard resize (**Shift+Alt+arrow**), (5) month keyboard pickup gating by `isDraggable`/`isResizable`, (6) Luxon localizer arm, (7) comprehensive "wiring it all together" docs.

Reviewed RBC's resource model (the port target): no new public view names — `Day`/`Week` render resource columns automatically when a `resources` array is supplied. **Two column orderings** via a boolean (`resourceGroupingLayout`, default OFF): OFF = **resource-major** (outer=resource, inner=days, `TimeGridHeader`), ON = **day-major** (outer=day, inner=resources, `TimeGridHeaderResources`). **Both** week orderings render a **two-tier header** and a **per-resource all-day lane**; Day view = single-tier resource columns, per-resource all-day lane. Cross-resource DnD is **report-only**: the landing column's resource id flows out as `resourceId` in `onEventDrop`/`onEventResize`/`onDropFromOutside`/`onSelectSlot` (RBC `EventContainerWrapper`); RBC never mutates the event.

Decisions for Step 1 (via AskUserQuestion):
- **Prop name = `resourceLayout: 'resource' | 'day'`** (default `'resource'`), not RBC's `resourceGroupingLayout` boolean — clearer/extensible for a fresh API. `'resource'` = resource-major, `'day'` = day-major.
- **Cross-resource DnD wired in chunk 1a** (Day) so it's testable on the simplest layout; threads the landing `resourceId` through the drop payload.
- **Selection reports `resourceId`** too (e.g. `onSelectSlot`) — full parity, included this step.
- **Column sizing = min-width per leaf column + horizontal scroll** when columns overflow (matches the RBC week screenshots), not equal-flex.
- **Step 1 broken into chunks (Cutter):** **1a** Day layout + core view-model resource support + cross-resource DnD + selection resourceId; **1b** ungrouped week (resource-major, two-tier header); **1c** grouped week (day-major, two-tier header).

Already in place (no work needed): the `resources` input prop already syncs into the store (`useCalendar.ts`); the `resource`/`resourceId`/`resourceTitle` accessors exist with defaults. Missing: `timeGridViewModel` consuming `resources`, the React resource layouts, and the DnD/selection resourceId threading.

- **Start-edge keyboard resize chord = Shift+Alt+arrow** (Alt is the same physical key on Mac/Win; relies on preventDefault while grabbed). Rejected Shift+Cmd/Ctrl (Cmd+arrow = browser nav/line-nav on Mac).
- **Rejected:** grouped-only resource layout (Cutter's screenshots showed both orderings → support both); RBC's `resourceGroupingLayout` prop name.
- **1a delivered (2026-06-09):** Day view resource columns + resourceId end-to-end (core/dnd/react), all gates green (core 250 / dnd 31 / react 188). Core model is **additive** — `TimeGridViewModel` gained `resources: TimeGridResourceGroup[] | null` and `TimeGridColumn.resourceId`; the no-resource path is byte-for-byte unchanged. **Deferred to 1b/1c:** week orderings (the `resourceLayout` prop isn't consumed yet — Day ignores it). **Deferred (noted):** DnD live-preview isn't scoped per-resource (core `dragPreview` lacks a resourceId → would show in every column, so it's omitted in the resource branch — revisit by adding `resourceId` to `dragPreview`); empty-slot keyboard roving not wired in resource columns (event keyboard DnD still works); multi-day-per-resource all-day lane (Day = single cell).
- **1b delivered (2026-06-09):** Week view resource-major two-tier header + multi-day all-day lanes (commits 08823ac + 3a4d118). Deferred: day-major ordering (1c), DnD live-preview in resource columns, cross-day timed-selection within a resource, all-day selection band highlight.

## 2026-06-09 — Timed↔all-day cross-surface promotion: one-way only (Cutter)

**Decision:** timed events **can** be dragged from the time grid **into** the all-day row (timed → all-day promotion). All-day events **cannot** be dragged down into the time grid (no all-day → timed demotion). One-way only.

- **Why:** promoting a timed event to all-day is a common, intuitive gesture; demoting an all-day event to a timed slot requires the user to know what time to assign — there is no sensible default, and guessing (e.g. "drop at the hovered slot time") produces surprising results. RBC supported both but the demotion path confused users. Keeping it one-way is simpler to implement, document, and reason about.
- **How to apply:** in `bindCalendarDnd` (and the keyboard grab) the all-day row accepts drops from timed-event draggables; the time body does NOT accept drops from all-day-event draggables. The `allDay` flag in `onEventDrop` reports `true` when a timed event lands in the all-day row.
- **Rejected:** two-way promotion (the demotion direction; dropped for UX reasons above); ignoring the gesture entirely (one-way promotion is a meaningful, useful interaction worth supporting).

---

## 2026-06-10 — Phase 7 redesign: headless API surface, public exports, Storybook architecture (Cutter)

Strategic design session. All decisions confirmed by Cutter before this entry was written.

### Phase 7 split into 7a (API surface) + 7b (Polish & release)

- **7a = API surface refactor:** hook extraction, public exports restructure, `views` prop + `viewDefinitions` rename, `components.views` unified dispatch, Storybook globals + shared constants, styles MDX docs, build/subpath exports. Full task list in PROGRESS.md.
- **7b = Polish & 2.0.0 beta:** docs pass, perf benchmarks vs v1, bundle-size audit, release. Not started until 7a is complete.
- **Why:** the Phase 7 work was too large for one slice; splitting gives a clear shipping boundary between "API is right" and "release is ready." The codemods package (`@big-calendar/codemods`) is **deferred until after 7a** — the react package API must be finalized before migration tooling can be written.

### Hook extraction: Appendix A.5 enforcement (element-spread pattern)

- **Decision — every replaceable view component calls one composed `use<ComponentName>Props` hook; the component itself becomes near-pure render.**  All logic currently inlined in view components (signal subscriptions, selection state reads, drag preview computation, roving setup, keyboard DnD wiring, component resolution from `components.*`) moves into the hook.
- **Hook return shape = element-spread groups.** The hook returns an object of sub-objects, each named for a DOM element role: `{ root, header, body, daySlot, eventButton, … }`. Each sub-object is spread directly onto its target element. Sub-objects include *all* attributes required by the consuming element: `className`, `data-*` attrs, event handlers, refs, aria attrs — everything the element needs in one spread. **Why:** consumers (default components or developer overrides) get a predictable, complete set of props per target; nothing leaks into the render function.
- **Prop-getter pattern for iterative elements.** Items rendered in a loop use getter functions instead of pre-computed per-item data: `getWeekProps(week)`, `getDaySlotProps(cell, weekIndex, dayIndex)`. The hook returns the getter; the component calls it per-iteration. **Why:** avoids pre-computing potentially large arrays when the component might override or skip rendering them.
- **`useTimeGridView` splits into `useTimeGridHeader(grid)` + `useTimeGridBody(grid)`.** Shared grid data (`grid = useTimeGrid()`) is called once in the composed `useTimeGridView` hook and passed into both. No logic duplication; components can consume at either granularity. Matches the two-roving-instance / two-selection-instance structure of `TimeGridView`.

### Public subpath exports — every public export gets its own src/ folder

- **Decision — all public exports live at `src/<Name>/index.ts`** (component entry) or `src/<Name>.<type>.ts` (hook entry). This matches the `packages/react/src/` root so the Vite multi-entry build and `package.json` wildcard export can map them with a single pattern.
- **`package.json` wildcard:** `"./*": { "import": "./dist/*.js", "types": "./dist/*.d.ts" }` — covers all subpaths automatically. The existing named `"."` and `"./dnd"` entries remain explicit; the wildcard fills in everything else.
- **Import alias examples (confirmed):** `@big-calendar/react/AgendaEventButton`, `@big-calendar/react/useMonthWeeks`, `@big-calendar/react/useTimeGridHeader`, `@big-calendar/react/MonthView`, etc. — direct path, no barrel barrel-of-barrels.
- **Why:** tree-shaking requires distinct entry points (bundlers can dead-code-eliminate at entry-point granularity). A `views=['month','agenda']` build should pull zero time-grid code.

### Previously-internal hooks and components promoted to public

The following are now first-class public exports (previously internal only, or not exported at all):
- **Hooks:** `useMonthWeeks`, `useTimeGridHeader`, `useTimeGridBody`, `useTimeGridView`, `useAgendaView`, `useMonthView`, `useSlotSelection`, `useRovingSelection`, `useEventRoving`, `useKeyboardDnd`, `useCalendarDnd`, and all `use<View>Props` composed hooks as they are created.
- **Components:** `EventButton`, `AgendaEventButton`, `DefaultToolbar`, `DefaultMonthEvent`, `DefaultTimeGridEvent`, `DefaultAgendaEvent`, all `Default*` sub-components (header cells, gutter slots, show-more trigger, etc.).
- **Why:** these are the building blocks for headless usage. A developer replacing one view component needs the hook for its logic; a developer building a full custom layout needs the atomic components.

### `views` prop and `viewDefinitions` rename

- **`config.views` (ViewRegistry) renamed to `config.viewDefinitions`.** The current `config.views` field holds custom view class/component registrations — the `ViewRegistry`. This is renamed to `config.viewDefinitions` to free the name `views` for the new prop.
- **New `config.enabledViews?: ViewKey[]`** — the list of enabled view keys. Surfaced as `store.enabledViews` signal.
- **`CalendarProps.views?: ViewKey[]`** — controls which Toolbar buttons appear and which views the Calendar renders. `views=['month', 'agenda']` means the Toolbar shows only Month and Agenda, and the Calendar only renders those two. If omitted, defaults to all built-in views (+ any custom view keys registered in `viewDefinitions`).
- **`CalendarProps.defaultView?: ViewKey`** — determines which view is shown on first mount. Unchanged semantics, kept as-is.
- **Custom views:** `views=['month', 'horizontalweek', 'agenda']` where `horizontalweek` is a custom view registered via `components.views['horizontalweek']` (see unified dispatch below). MDX docs will explain the full custom view registration pattern.
- **Why:** the number-one requested feature in RBC upgrade requests was a proper `views` prop that limits what's rendered (not just what the Toolbar shows). Freeing the name from the registry was necessary; `viewDefinitions` is accurate and unambiguous.

### `components.views` unified dispatch for built-in + custom views

- **Decision — `Calendar` checks `components.views[viewModel.view]` first for ALL views** (built-in and custom alike). If a component is registered there, it is used; otherwise, for built-in kinds it falls through to the default view component. Custom views with `viewModel.kind === 'custom'` that have no `components.views` entry are a dev error (no fallback exists for an unknown custom view).
- **What this enables:** a developer can override just `MonthView` with a custom layout while keeping `TimeGridView` and `AgendaView` as defaults — no fork of the whole `Calendar` component required.
- **Rejected:** keeping `viewComponents` as a separate prop from `components` (confusing API surface; everything overridable should live under one `components` map).

### Tree-shaking: two paths, one tradeoff documented

- **Path A — batteries-included `<Calendar />`:** imports all built-in views; bundle always contains month + time-grid + agenda. Easiest to use.
- **Path B — composed:** `<CalendarProvider>` + individual view imports (`<MonthView>`, `<AgendaView>`). Bundle contains only the imported views. Requires slightly more setup.
- **Both paths are fully supported.** The tradeoff (Path A = bigger bundle, Path B = smaller bundle + more wiring) is documented in MDX. **No tree-shaking magic** is attempted inside Path A — the split is at component-import granularity.
- **`useCalendarDnd` is always a separate import** (`@big-calendar/react/useCalendarDnd`). It is only included in a bundle if the developer's code imports it. The `@big-calendar/dnd` peer dep is optional; without it the import is never reached in production code.

### Storybook globals: localizer, locale, timezone selectors

- **Decision — every story exposes three globals:** a **localizer switcher** (temporal / luxon), a **locale select** (empty option = `undefined`), and a **timezone select** (empty option = `undefined`). Applied via a `withLocalizerDecorator` that reads the globals and wraps the story's `CalendarProvider` with the resolved localizer.
- **`packages/storybook-shared/`** — a new shared workspace package containing `localeList.constant.ts` (comprehensive locale list, not just the five common ones) and `timeZoneList.constant.ts` (IANA timezone list). Used by all Storybook instances (storybook-core and storybook-react today; storybook-vue etc. later).
- **Globals live in `.storybook/preview.ts`** of each Storybook instance; `withLocalizerDecorator` is shared from `storybook-shared/`.
- **Every existing and new story must include the localizer switcher.** This is enforced by always applying `withLocalizerDecorator` as a global decorator (not per-story).
- **Why:** every story should be testable against both localizers without code changes; locale and timezone coverage tests common user configurations; the comprehensive lists prevent "works on my machine" locale bugs.

### Storybook story design guidelines (confirmed)

- **Separate stories for every single thing is not required.** MDX documentation pages can explain options and how they are wired; controls (`argTypes`) cover toggle-able configuration variations in one story.
- **Navigation should be simple** — stories grouped by feature/component area, not one story per prop.
- **Every story must include** the localizer globals (via `withLocalizerDecorator`), and locale/timezone selects (via globals).
- **Styles MDX doc** — a dedicated `@big-calendar/styles` MDX page documenting every `.bc-*` class, nesting relationships, available CSS custom property overrides, and examples. This is a 7a deliverable; classes are stable enough to document now.

---

## 2026-06-10 — Utility functions to core/utils subpath; view hooks + useFloatingAnchor to public

### Context
During Phase 7a reassessment, all view-internal hooks and utility functions were identified as valid public API surface for custom component construction, and for future non-React framework implementations.

### Utilities → `@big-calendar/core/utils` subpath

- **Decision — `floatingPosition`, `formatEventTime`, and all geometry functions move from `@big-calendar/react`'s internal directory to a new `packages/core/src/utils/` directory, exported via a `@big-calendar/core/utils` subpath.**
- **`@floating-ui/core` moves from `@big-calendar/react` dependencies to `@big-calendar/core` dependencies.** Every framework implementation will need it (transitively through core); the react package no longer owns it.
- **Geometry return type:** `CSSVars = Readonly<Record<`--${string}`, string | number>>` (no React import in core). React provides a thin `geometryStyles.ts` wrapper that re-exports all geometry functions typed as `CSSProperties` for use in JSX `style={}` props.
- **Storybook alias:** each `.storybook/main.ts` that aliased `@big-calendar/core` to source must also alias `@big-calendar/core/utils` to `core/src/utils/index.ts` explicitly (Vite exact-alias does not cover subpaths automatically).
- **Why:** framework-agnostic utilities belong in core; future Vue/Angular packages get them via the same subpath without duplicating code.
- **Rejected:** keeping geometry in react (would require every future framework package to re-implement the CSS bridge). Keeping floating-ui in react (same argument).

### View-internal hooks → public in `@big-calendar/react`

- **Decision — `useAgendaRows`, `useTimeGrid`, `useToolbarProps`, and `useFloatingAnchor` are promoted from view-internal `hooks/` directories to top-level `src/` files and exported from the public barrel.**
- All exported types from these hooks (`AgendaRow`, `AgendaRowEvent`, `TimeGrid`, `TimeColumn`, `TimeAllDayRow`, etc.) are also exported publicly.
- **Why:** custom view builders need access to the same resolved model data the built-in views use; without these hooks they'd have to duplicate significant logic.
- **Rejected:** leaving them internal (would block any meaningful custom view implementation).
