import { batch, computed, effect, signal } from '@preact/signals-core'
import type { ReadonlySignal } from '@preact/signals-core'
import { resolveAccessors, wrapAccessor } from '../accessors/accessors.function'
import { moveEvent } from '../dnd/moveEvent.function'
import type { MoveMode } from '../dnd/moveEvent.function'
import { placeExternalEvent } from '../dnd/placeExternalEvent.function'
import { resizeEvent } from '../dnd/resizeEvent.function'
import type { ResizeEdge } from '../dnd/resizeEvent.function'
import { BUILTIN_VIEWS, Views } from '../constants/views.constant'
import { createSelection } from '../selection/selection.function'
import type { SelectionMode, SelectionRange } from '../selection/selection.type'
import type { EventId, ResourceId, ViewKey } from '../types/calendar.type'
import type { CalendarConfig } from '../types/config.type'
import { buildViewModel } from '../views/viewModel.function'
import { resolveDrilldownView } from './drilldown.function'
import { navigateDate } from './navigateDate.function'
import type { CalendarStore, KeyboardDragState } from './store.type'
import { viewLabel } from './viewLabel.function'
import { viewRange } from './viewRange.function'

/** Default "now" source: the current instant as a UTC RFC 3339 string. */
const defaultGetNow = (): string => new Date().toISOString()

/**
 * Create an isolated calendar store from a {@link CalendarConfig}.
 *
 * The store owns the reactive state (date/view/selected/events/…) and the
 * actions that mutate it. The localizer and resolved accessors are fixed for
 * the store's lifetime. No global state is used, so multiple stores coexist
 * independently on one page.
 */
export function createCalendarStore<TEvent = unknown, TResource = unknown>(
  config: CalendarConfig<TEvent, TResource>,
): CalendarStore<TEvent, TResource> {
  const { localizer } = config
  if (localizer == null) {
    throw new Error('createCalendarStore: a `localizer` is required.')
  }

  const getNow = config.getNow ?? defaultGetNow
  const accessors = resolveAccessors<TEvent, TResource>(config.accessors)
  // Resolved time-grid slot params (defaults mirror the view builders). Exposed
  // on the store so adapters can rebuild slot metrics for the now-indicator.
  const step = config.step ?? 30
  const timeslots = config.timeslots ?? 2
  const selectable = config.selectable ?? false
  const longPressThreshold = config.longPressThreshold ?? 500
  // Resolved drag predicate: every event is draggable unless an accessor opts out.
  const getDraggable = config.draggableAccessor ? wrapAccessor(config.draggableAccessor) : null
  const isDraggable = (event: TEvent): boolean =>
    getDraggable ? (getDraggable(event) ?? true) : true
  // Resolved resize predicate: every event is resizable unless an accessor opts out.
  const getResizable = config.resizableAccessor ? wrapAccessor(config.resizableAccessor) : null
  const isResizable = (event: TEvent): boolean =>
    getResizable ? (getResizable(event) ?? true) : true
  const getEventId = wrapAccessor(accessors.id)
  const findEvent = (id: EventId): TEvent | undefined =>
    events.value.find((candidate) => {
      const candidateId = getEventId(candidate)
      return candidateId != null && String(candidateId) === String(id)
    })

  // Bound-accessor wrappers reused by the resize math (look-up + compute).
  const getEventStart = wrapAccessor(accessors.start)
  const getEventEnd = wrapAccessor(accessors.end)
  const getEventAllDay = wrapAccessor(accessors.allDay)
  const getEventTitle = wrapAccessor(accessors.title)
  /**
   * Resolve an event by id and run the resize math, or `null` when the id matches
   * no event or the event lacks bounds. Shared by `resizeEvent` (commit) and
   * `previewResize` (live overlay) so both compute identical bounds.
   */
  const computeResize = (
    id: EventId,
    edge: ResizeEdge,
    target: string,
    mode: MoveMode,
  ): { event: TEvent; start: string; end: string; allDay: boolean } | null => {
    const event = findEvent(id)
    if (event == null) return null
    const start = getEventStart(event)
    const end = getEventEnd(event)
    if (start == null || end == null) return null
    const resized = resizeEvent({
      localizer,
      start,
      end,
      allDay: getEventAllDay(event) ?? false,
      edge,
      target,
      mode,
      step,
    })
    return { event, ...resized }
  }

  /**
   * Resolve an event by id and run the move math, or `null` when the id matches no
   * event or the event lacks bounds. Shared by the `moveEvent` action (commit) and
   * `previewMove` (live overlay) so both compute identical bounds.
   */
  const computeMove = (
    id: EventId,
    target: string,
    mode: MoveMode,
    targetAllDay?: boolean,
  ): { event: TEvent; start: string; end: string; allDay: boolean } | null => {
    const event = findEvent(id)
    if (event == null) return null
    const start = getEventStart(event)
    const end = getEventEnd(event)
    if (start == null || end == null) return null
    const moved = moveEvent({
      localizer,
      start,
      end,
      allDay: getEventAllDay(event) ?? false,
      target,
      mode,
      targetAllDay,
    })
    return { event, ...moved }
  }

  const date = signal<string>(config.date ?? getNow())
  const view = signal<ViewKey>(config.view ?? Views.MONTH)
  const selected = signal<EventId | null>(null)
  const events = signal<TEvent[]>(config.events ?? [])
  const backgroundEvents = signal<TEvent[]>(config.backgroundEvents ?? [])
  const resources = signal<TResource[] | undefined>(config.resources)
  // Live drag-preview bounds: the proposed start/end shown while a resize drag is
  // in flight (set by `previewResize`, cleared on drop/commit). Purely visual —
  // no callback fires — so the view can render the resulting extent before commit.
  const dragPreview = signal<{ start: string; end: string } | null>(null)
  // Live keyboard-drag ("grab") state: the grabbed event + its proposed bounds as
  // the user steps it with the arrow keys, or `null` when idle. The view marks the
  // grabbed event and the adapter announces each step; the proposed-extent box is
  // rendered from `dragPreview`, which these actions set in lockstep. `moved` /
  // `resized` (internal) decide which callback `grabCommit` fires.
  const keyboardDrag = signal<KeyboardDragState | null>(null)
  let grabMoved = false
  let grabResized = false

  const { drilldownView = Views.DAY, views: registry } = config
  const range = computed(() =>
    viewRange({ localizer, date: date.value, view: view.value, length: config.length, registry }),
  )

  // Localized toolbar title for the active view + focus date. Computed here so
  // every framework adapter renders the identical label.
  const label = computed(() =>
    viewLabel({ localizer, view: view.value, date: date.value, range: range.value, registry }),
  )

  // Resolve the time-grid window once (config is stable). A midnight `max`
  // (00:00) means end-of-day → the full 1440-minute window.
  const dayStartMin = config.min == null ? 0 : localizer.getMinutesFromMidnight(config.min)
  const dayEndMin =
    config.max == null ? 1440 : localizer.getMinutesFromMidnight(config.max) || 1440
  const allDayMaxRows = config.showAllEvents ? Infinity : (config.allDayMaxRows ?? Infinity)

  const viewModel = computed(() =>
    buildViewModel({
      localizer,
      accessors,
      view: view.value,
      days: range.value.days,
      events: events.value,
      backgroundEvents: backgroundEvents.value,
      date: date.value,
      resources: resources.value,
      registry,
      options: {
        step,
        timeslots,
        dayStartMin,
        dayEndMin,
        dayLayoutAlgorithm: config.dayLayoutAlgorithm,
        allDayMaxRows,
        showMultiDayTimes: config.showMultiDayTimes,
        weekEventLimit: config.weekEventLimit,
        resourceLayout: config.resourceLayout,
      },
    }),
  )

  // ── slot selection ──────────────────────────────────────────────────────
  // The FSM works in slot-index space; the store captures the anchor day + mode
  // (set when a drag/click starts) and translates committed indices back to ISO
  // dates for the public callbacks. `'day'` indices map straight into the visible
  // day list. `'time'` indices are **global** (`dayIndex*slotCount + slot`) so a
  // drag can span day columns: same-day → a timed selection; cross-day → a
  // promoted whole-day (all-day) span. The anchor is a signal so the adapter can
  // place the highlight overlay in the right column(s)/row while a drag is live.
  const selectionAnchor = signal<{
    mode: SelectionMode
    date: string
    slotCount?: number | undefined
    resourceId?: ResourceId | undefined
  } | null>(null)

  // Shape returned to the public callbacks: ISO dates + the whole-day flag.
  type Translated = { start: string; end: string; slots: string[]; allDay: boolean }

  // A whole-day span over the visible days `[from..to]` (inclusive day indices).
  const daySpan = (from: number, to: number): Translated => {
    const days = range.value.days
    const slots = days.slice(from, to + 1)
    const start = slots[0] ?? date.value
    const last = slots[slots.length - 1] ?? start
    return { start, end: localizer.endOf({ value: last, unit: 'day' }), slots, allDay: true }
  }

  const translate = (slotRange: SelectionRange): Translated => {
    const ctx = selectionAnchor.value
    if (ctx == null) {
      // Defensive: an action ran without an anchor; emit a degenerate range.
      return { start: date.value, end: date.value, slots: [date.value], allDay: false }
    }
    if (ctx.mode === 'time') {
      // Decode each global index into day + in-day slot. Without a slotCount the
      // selection can't cross days, so treat it all as the anchor day (slot 0+).
      const hasCount = ctx.slotCount != null && ctx.slotCount > 0
      const slotCount = hasCount ? ctx.slotCount! : 0
      const days = range.value.days
      const dayOf = (index: number): number => (hasCount ? Math.floor(index / slotCount) : 0)
      const slotDate = (index: number): string => {
        const dayIdx = dayOf(index)
        const day = days[dayIdx] ?? ctx.date
        return localizer.getSlotDate({ date: day, minutesFromMidnight: dayStartMin + (index - dayIdx * slotCount) * step })
      }
      const startDay = dayOf(slotRange.start)
      const endDay = dayOf(slotRange.end)
      const startInDay = slotRange.start - startDay * slotCount
      const endInDay = slotRange.end - endDay * slotCount

      // A same-day drag that covers the whole midnight→end-of-day window is itself
      // an all-day selection (midnight → 23:59:59), like clicking the day in month.
      const fullDayWindow = dayStartMin === 0 && dayEndMin === 1440
      if (startDay === endDay && fullDayWindow && startInDay === 0 && endInDay === slotCount - 1) {
        return daySpan(startDay, startDay)
      }

      const slots: string[] = []
      for (let i = slotRange.start; i <= slotRange.end; i++) slots.push(slotDate(i))
      // Exclusive end on the end day. The final slot of a full day ends at
      // end-of-day (23:59:59…) — its next instant is the next day — not at
      // next-day midnight; a partial window (e.g. 9–5) ends at its window edge.
      const endDayStr = days[endDay] ?? ctx.date
      const endMinutes = dayStartMin + (endInDay + 1) * step
      const end =
        endMinutes >= 1440
          ? localizer.endOf({ value: endDayStr, unit: 'day' })
          : localizer.getSlotDate({ date: endDayStr, minutesFromMidnight: endMinutes })
      // A drag that crosses day columns is an all-day span — but, unlike a
      // month/day selection, it keeps its instant start/end times.
      return { start: slots[0]!, end, slots, allDay: startDay !== endDay }
    }
    // 'day' mode: linear day index into the visible grid (always whole days).
    return daySpan(slotRange.start, slotRange.end)
  }

  const selectionController = createSelection({
    selectable,
    onSelecting: config.onSlotSelecting
      ? (slotRange) => {
          const { start, end, allDay } = translate(slotRange)
          return config.onSlotSelecting!({ start, end, allDay })
        }
      : undefined,
    // Route the committed slot selection to the per-gesture callback. The
    // internal FSM keeps an `action` to disambiguate; the public payload doesn't.
    onSelect: (selection) => {
      const { start, end, slots, allDay } = translate(selection)
      const payload = { start, end, slots, allDay, resourceId: selectionAnchor.value?.resourceId }
      if (selection.action === 'click') config.onSlotClick?.(payload)
      else if (selection.action === 'doubleClick') config.onSlotDoubleClick?.(payload)
      else config.onSlotSelect?.(payload)
    },
  })

  // ── event interaction ───────────────────────────────────────────────────
  // Core owns the behaviour so every adapter behaves identically: each callback
  // fires only when defined (core never fabricates a noop). Selection is a
  // separate action (`selectEvent`) the grid views compose with `click`; the
  // agenda — which has no selection — calls `click` alone. Adapters stay dumb
  // translators that route DOM events here. Presence is resolved once.
  const selectEventById = (id: EventId | null): void => {
    selected.value = id
    config.onEventSelect?.({ id })
  }
  const hasRightClick = config.onEventRightClick != null
  const hasMiddleClick = config.onEventMiddleClick != null
  const eventHandlers = {
    has:
      config.onEventClick != null ||
      config.onEventDoubleClick != null ||
      hasRightClick ||
      hasMiddleClick,
    hasRightClick,
    hasMiddleClick,
    click(event: TEvent) {
      config.onEventClick?.(event)
    },
    doubleClick(event: TEvent) {
      config.onEventDoubleClick?.(event)
    },
    rightClick(event: TEvent, domEvent: MouseEvent) {
      config.onEventRightClick?.(event, domEvent)
    },
    middleClick(event: TEvent, domEvent: MouseEvent) {
      config.onEventMiddleClick?.(event, domEvent)
    },
  }

  const disposers: Array<() => void> = []

  // Cancel any in-progress drag when the view or focus date changes (navigate,
  // setDate, drilldown, or a controlled view/date sync) — selection never
  // straddles a range change. Skips the initial run.
  let selectionResetInit = false
  disposers.push(
    effect(() => {
      void view.value
      void date.value
      if (!selectionResetInit) {
        selectionResetInit = true
        return
      }
      selectionController.cancel()
    }),
  )

  // Emit onRangeChange whenever the visible range changes — but not on init,
  // matching v1 (which only fires on navigate / view change).
  const { onRangeChange } = config
  if (onRangeChange) {
    let initialized = false
    disposers.push(
      effect(() => {
        const current = range.value
        if (!initialized) {
          initialized = true
          return
        }
        onRangeChange({ range: current, view: view.value })
      }),
    )
  }

  const selection = {
    state: selectionController.state,
    range: selectionController.range,
    anchor: selectionAnchor as ReadonlySignal<{
      mode: SelectionMode
      date: string
      slotCount?: number | undefined
      resourceId?: ResourceId | undefined
    } | null>,
    start({ slot, date: anchorDate, mode, slotCount, resourceId }: {
      slot: number
      date: string
      mode: SelectionMode
      slotCount?: number | undefined
      resourceId?: ResourceId | undefined
    }) {
      selectionAnchor.value = { mode, date: anchorDate, slotCount, resourceId }
      selectionController.start({ slot })
    },
    to({ slot }: { slot: number }) {
      selectionController.to({ slot })
    },
    complete() {
      selectionController.complete()
      selectionAnchor.value = null
    },
    click({ slot, date: anchorDate, mode, slotCount, resourceId }: {
      slot: number
      date: string
      mode: SelectionMode
      slotCount?: number | undefined
      resourceId?: ResourceId | undefined
    }) {
      selectionAnchor.value = { mode, date: anchorDate, slotCount, resourceId }
      selectionController.click({ slot })
    },
    doubleClick({ slot, date: anchorDate, mode, slotCount, resourceId }: {
      slot: number
      date: string
      mode: SelectionMode
      slotCount?: number | undefined
      resourceId?: ResourceId | undefined
    }) {
      selectionAnchor.value = { mode, date: anchorDate, slotCount, resourceId }
      selectionController.doubleClick({ slot })
    },
    cancel() {
      selectionController.cancel()
      selectionAnchor.value = null
    },
  }

  return {
    date,
    view,
    selected,
    selection,
    events,
    backgroundEvents,
    resources,
    range,
    label,
    viewModel,
    dragPreview: dragPreview as ReadonlySignal<{ start: string; end: string } | null>,
    keyboardDrag: keyboardDrag as ReadonlySignal<KeyboardDragState | null>,
    localizer,
    accessors,
    getNow,
    step,
    timeslots,
    selectable,
    longPressThreshold,
    isDraggable,
    isResizable,

    navigate({ direction, date: target }) {
      const next = navigateDate({
        localizer,
        date: date.value,
        direction,
        view: view.value,
        getNow,
        target,
        length: config.length,
        registry,
      })
      date.value = next
      config.onNavigate?.({ date: next, view: view.value })
    },

    setView({ view: nextView }) {
      view.value = nextView
      config.onView?.({ view: nextView })
    },

    setDate({ date: nextDate }) {
      date.value = nextDate
    },

    selectEvent({ id }) {
      selectEventById(id)
    },

    getEvent({ id }) {
      return findEvent(id)
    },

    moveEvent({ id, target, mode, resourceId, promote }) {
      // The drag is over: clear the live preview regardless of the outcome.
      dragPreview.value = null
      const drop = config.onEventDrop
      if (drop == null) return
      const moved = computeMove(id, target, mode, promote ? true : undefined)
      if (moved == null) return
      drop({ event: moved.event, start: moved.start, end: moved.end, allDay: moved.allDay, resourceId })
    },

    previewMove({ id, target, mode }) {
      const moved = computeMove(id, target, mode)
      dragPreview.value = moved == null ? null : { start: moved.start, end: moved.end }
    },

    resizeEvent({ id, edge, target, mode = 'time', resourceId }) {
      // The drag is over: clear the live preview regardless of the outcome.
      dragPreview.value = null
      const report = config.onEventResize
      if (report == null) return
      const resized = computeResize(id, edge, target, mode)
      if (resized == null) return
      report({ event: resized.event, start: resized.start, end: resized.end, allDay: resized.allDay, resourceId })
    },

    previewResize({ id, edge, target, mode = 'time' }) {
      const resized = computeResize(id, edge, target, mode)
      dragPreview.value = resized == null ? null : { start: resized.start, end: resized.end }
    },

    clearDragPreview() {
      dragPreview.value = null
    },

    dropExternal({ target, mode = 'time', durationMinutes, allDay, start, end, resourceId }) {
      // The drag is over: clear the live preview regardless of the outcome.
      dragPreview.value = null
      const report = config.onDropFromOutside
      if (report == null) return
      const placed = placeExternalEvent({ localizer, target, mode, durationMinutes, allDay, start, end, step })
      report({ ...placed, resourceId })
    },

    previewExternal({ target, mode = 'time', durationMinutes, start, end }) {
      // No event lookup: the outside item isn't in `events` yet. A missing
      // duration/template (native drag) previews a single slot (time) or the
      // dropped day (day) via the placement default.
      const placed = placeExternalEvent({ localizer, target, mode, durationMinutes, start, end, step })
      dragPreview.value = { start: placed.start, end: placed.end }
    },

    getEventTransfer({ id }) {
      const event = findEvent(id)
      if (event == null) return null
      return {
        id: String(id),
        title: getEventTitle(event) ?? '',
        start: getEventStart(event) ?? '',
        end: getEventEnd(event) ?? '',
        allDay: getEventAllDay(event) ?? false,
      }
    },

    eventDragStart({ id }) {
      const report = config.onEventDragStart
      if (report == null) return
      const event = findEvent(id)
      if (event == null) return
      report({ event })
    },

    grabEvent({ id }) {
      const event = findEvent(id)
      if (event == null) return false
      if (!isDraggable(event)) return false
      const start = getEventStart(event)
      const end = getEventEnd(event)
      if (start == null || end == null) return false
      grabMoved = false
      grabResized = false
      const allDay = getEventAllDay(event) ?? false
      // Store the event's canonical accessor id (not the raw id passed in, which
      // an adapter may read as a string from the DOM) so consumers comparing it to
      // the event's own id — e.g. the grabbed-event marking — match.
      keyboardDrag.value = { id: getEventId(event) ?? id, start, end, allDay }
      dragPreview.value = { start, end }
      return true
    },

    grabMove({ days = 0, minutes = 0 }) {
      const grab = keyboardDrag.value
      if (grab == null) return
      const shift = (value: string): string =>
        localizer.add({
          value: localizer.add({ value, amount: days, unit: 'day' }),
          amount: minutes,
          unit: 'minute',
        })
      grabMoved = true
      const start = shift(grab.start)
      const end = shift(grab.end)
      keyboardDrag.value = { ...grab, start, end }
      dragPreview.value = { start, end }
    },

    grabResize({ minutes = 0, days = 0, edge = 'end' }) {
      const grab = keyboardDrag.value
      if (grab == null) return
      const grabbedEvent = findEvent(grab.id)
      if (grabbedEvent != null && !isResizable(grabbedEvent)) return
      grabResized = true

      if (edge === 'start') {
        const candidate = localizer.add({
          value: localizer.add({ value: grab.start, amount: days, unit: 'day' }),
          amount: minutes,
          unit: 'minute',
        })
        let start: string
        if (days !== 0) {
          // Whole-day resize (month): start can't go forward past end's day.
          start = localizer.gt({ a: candidate, b: grab.end, unit: 'day' })
            ? localizer.add({
                value: grab.start,
                amount: localizer.diff({
                  a: localizer.startOf({ value: grab.end, unit: 'day' }),
                  b: localizer.startOf({ value: grab.start, unit: 'day' }),
                  unit: 'day',
                }),
                unit: 'day',
              })
            : candidate
        } else {
          // Slot resize (time grid): start can't cross within one slot of the end.
          start =
            localizer.diff({ a: grab.end, b: candidate, unit: 'minute' }) < step
              ? localizer.add({ value: grab.end, amount: -step, unit: 'minute' })
              : candidate
        }
        keyboardDrag.value = { ...grab, start }
        dragPreview.value = { start, end: grab.end }
        return
      }

      const candidate = localizer.add({
        value: localizer.add({ value: grab.end, amount: days, unit: 'day' }),
        amount: minutes,
        unit: 'minute',
      })
      let end: string
      if (days !== 0) {
        // Whole-day resize (month): keep the event at least one day long — clamp the
        // end back to the start's day (keeping its time-of-day) if it would go below.
        end = localizer.lt({ a: candidate, b: grab.start, unit: 'day' })
          ? localizer.add({
              value: grab.end,
              amount: localizer.diff({
                a: localizer.startOf({ value: grab.start, unit: 'day' }),
                b: localizer.startOf({ value: grab.end, unit: 'day' }),
                unit: 'day',
              }),
              unit: 'day',
            })
          : candidate
      } else {
        // Slot resize (time grid): never let the end cross within one slot of the start.
        end =
          localizer.diff({ a: candidate, b: grab.start, unit: 'minute' }) < step
            ? localizer.add({ value: grab.start, amount: step, unit: 'minute' })
            : candidate
      }
      keyboardDrag.value = { ...grab, end }
      dragPreview.value = { start: grab.start, end }
    },

    grabCommit() {
      const grab = keyboardDrag.value
      keyboardDrag.value = null
      dragPreview.value = null
      if (grab == null) return
      const event = findEvent(grab.id)
      if (event == null) return
      const payload = { event, start: grab.start, end: grab.end, allDay: grab.allDay }
      // A move carries both ends (so a move-then-resize is fully expressed by
      // onEventDrop); a pure resize reports through onEventResize.
      if (grabMoved) config.onEventDrop?.(payload)
      else if (grabResized) config.onEventResize?.(payload)
    },

    grabCancel() {
      keyboardDrag.value = null
      dragPreview.value = null
    },

    eventHandlers,

    drilldown({ date: target }) {
      const resolved = resolveDrilldownView({
        date: target,
        view: view.value,
        views: BUILTIN_VIEWS,
        drilldownView,
        getDrilldownView: config.getDrilldownView,
      })
      if (resolved == null) return

      if (config.onDrillDown) {
        config.onDrillDown({ date: target, view: resolved })
        return
      }

      // Switch view (if needed) and focus date together so the range effect
      // fires exactly once.
      batch(() => {
        if (resolved !== view.value) {
          view.value = resolved
          config.onView?.({ view: resolved })
        }
        date.value = target
        config.onNavigate?.({ date: target, view: resolved })
      })
    },

    setEvents({ events: nextEvents }) {
      events.value = nextEvents
    },

    setBackgroundEvents({ events: nextEvents }) {
      backgroundEvents.value = nextEvents
    },

    setResources({ resources: nextResources }) {
      resources.value = nextResources
    },

    destroy() {
      for (const dispose of disposers) dispose()
      disposers.length = 0
    },
  }
}
