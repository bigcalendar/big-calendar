import { batch, computed, effect, signal } from '@preact/signals-core'
import type { ReadonlySignal } from '@preact/signals-core'
import type { LocalizerContract } from '@big-calendar/localizer'
import { resolveAccessors, wrapAccessor } from '../accessors/accessors.function'
import { moveEvent } from '../dnd/moveEvent.function'
import type { MoveMode } from '../dnd/moveEvent.function'
import { placeExternalEvent } from '../dnd/placeExternalEvent.function'
import { resizeEvent } from '../dnd/resizeEvent.function'
import type { ResizeEdge } from '../dnd/resizeEvent.function'
import { BUILTIN_VIEWS, Views } from '../constants/views.constant'
import { createSelection } from '../selection/selection.function'
import type { SelectionMode, SelectionRange, SlotSelectionDates } from '../selection/selection.type'
import type { EventId, ResourceId, ViewKey } from '../types/calendar.type'
import type { DayLayoutAlgorithm, DayLayoutAlgorithmKey } from '../layout/layout.type'
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
  if (config.localizer == null) {
    throw new Error('createCalendarStore: a `localizer` is required.')
  }
  // Mutable signal so a new localizer can be swapped in after construction
  // (e.g., when the user switches locale or localizer type at runtime). All
  // computed signals read `localizerSignal.value` so they re-derive automatically.
  const localizerSignal = signal<LocalizerContract>(config.localizer)

  const getNow = config.getNow ?? defaultGetNow
  const accessors = resolveAccessors<TEvent, TResource>(config.accessors)
  // Resolved time-grid slot params (defaults mirror the view builders). Exposed
  // on the store so adapters can rebuild slot metrics for the now-indicator.
  const step = config.step ?? 30
  const timeslots = config.timeslots ?? 2
  const selectable = config.selectable ?? false
  const longPressThreshold = config.longPressThreshold ?? 500
  // Resolved drag predicate: event must have a truthy draggable field (or a function
  // returning true). Absent field resolves to null → false (opt-in, not opt-out).
  const getDraggable = wrapAccessor(accessors.draggable)
  const isDraggable = (event: TEvent): boolean => !!getDraggable(event)
  // Resolved resize predicate: same opt-in pattern as draggable.
  const getResizable = wrapAccessor(accessors.resizable)
  const isResizable = (event: TEvent): boolean => !!getResizable(event)
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
  const getEventResource = wrapAccessor(accessors.resource)
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
      localizer: localizerSignal.value,
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
      localizer: localizerSignal.value,
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
  // False by default; set to true by the framework DnD hook when its bindings
  // are active so UI components can suppress drag affordances when DnD isn't wired.
  const dndEnabled = signal(false)
  // Written by the React layer's useMonthRowMeasure when no static weekEventLimit
  // is configured. Defaults to Infinity so an unmeasured grid shows all events.
  const measuredWeekLimit = signal<number>(Infinity)

  const { drilldownView = Views.DAY, viewDefinitions: registry } = config

  // Derived list of active view keys: explicit `enabledViews` config wins; otherwise
  // all built-in keys + any custom keys registered in `viewDefinitions`.
  const enabledViews = computed<ViewKey[]>(() => {
    if (config.enabledViews != null) return config.enabledViews
    const customKeys = registry != null ? (Object.keys(registry) as ViewKey[]) : []
    return [...BUILTIN_VIEWS, ...customKeys]
  })
  const range = computed(() =>
    viewRange({ localizer: localizerSignal.value, date: date.value, view: view.value, length: config.length, registry }),
  )

  // Localized toolbar title for the active view + focus date. Computed here so
  // every framework adapter renders the identical label.
  const label = computed(() =>
    viewLabel({ localizer: localizerSignal.value, view: view.value, date: date.value, range: range.value, registry }),
  )

  // Resolve the time-grid window once (config is stable). An omitted or
  // midnight `max` (hour:0, minute:0) means end-of-day → full 1440-min window.
  const dayStartMin = config.min == null ? 0 : config.min.hour * 60 + (config.min.minute ?? 0)
  const dayEndMin =
    config.max == null ? 1440 : (config.max.hour * 60 + (config.max.minute ?? 0)) || 1440
  const allDayMaxRows = config.showAllEvents ? Infinity : 2
  const dayLayoutAlgorithm = signal<DayLayoutAlgorithmKey | DayLayoutAlgorithm | undefined>(config.dayLayoutAlgorithm)

  const viewModel = computed(() =>
    buildViewModel({
      localizer: localizerSignal.value,
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
        dayLayoutAlgorithm: dayLayoutAlgorithm.value,
        allDayMaxRows,
        showMultiDayTimes: config.showMultiDayTimes,
        weekEventLimit: config.weekEventLimit ?? measuredWeekLimit.value,
        resourceLayout: config.resourceLayout,
      },
    }),
  )

  // ── slot selection ──────────────────────────────────────────────────────
  // The FSM works in slot-index space; the store captures the anchor day + mode
  // Returns background events whose time range overlaps [start, end], pre-filtered
  // to the given resourceId when present. Events with no resource assignment are
  // treated as global and always included. Returns an empty array when none match.
  const bgIntersecting = (start: string, end: string, resourceId: ResourceId | undefined): TEvent[] =>
    backgroundEvents.value.filter((ev) => {
      const s = getEventStart(ev)
      const e = getEventEnd(ev)
      if (s == null || e == null) return false
      if (!localizerSignal.value.inEventRange({ event: { start: s, end: e }, range: { start, end } })) return false
      if (resourceId != null) {
        const r = getEventResource(ev)
        if (r != null) {
          const ids = Array.isArray(r) ? r : [r]
          if (!ids.includes(resourceId)) return false
        }
      }
      return true
    })

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
    return { start, end: localizerSignal.value.endOf({ value: last, unit: 'day' }), slots, allDay: true }
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
        return localizerSignal.value.getSlotDate({ date: day, minutesFromMidnight: dayStartMin + (index - dayIdx * slotCount) * step })
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
          ? localizerSignal.value.endOf({ value: endDayStr, unit: 'day' })
          : localizerSignal.value.getSlotDate({ date: endDayStr, minutesFromMidnight: endMinutes })
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
          const resourceId = selectionAnchor.value?.resourceId
          const bg = bgIntersecting(start, end, resourceId)
          const args: {
            start: string
            end: string
            allDay: boolean
            resourceId?: ResourceId
            backgroundEvents?: TEvent[]
          } = { start, end, allDay }
          if (resourceId != null) args.resourceId = resourceId
          if (bg.length > 0) args.backgroundEvents = bg
          return config.onSlotSelecting!(args)
        }
      : undefined,
    // Route the committed slot selection to the per-gesture callback. The
    // internal FSM keeps an `action` to disambiguate; the public payload doesn't.
    onSelect: (selection) => {
      const { start, end, slots, allDay } = translate(selection)
      const resourceId = selectionAnchor.value?.resourceId
      const bg = bgIntersecting(start, end, resourceId)
      const payload: SlotSelectionDates<TEvent> = { start, end, slots, allDay }
      if (resourceId != null) payload.resourceId = resourceId
      if (bg.length > 0) payload.backgroundEvents = bg
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
    click(event: TEvent, domEvent: MouseEvent | KeyboardEvent) {
      config.onEventClick?.(event, domEvent)
    },
    doubleClick(event: TEvent, domEvent: MouseEvent | KeyboardEvent) {
      config.onEventDoubleClick?.(event, domEvent)
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
        onRangeChange({
          range: {
            start: localizerSignal.value.startOf({ value: current.firstVisibleDay, unit: 'day' }),
            end: localizerSignal.value.endOf({ value: current.lastVisibleDay, unit: 'day' }),
          },
          view: view.value,
        })
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
    dndEnabled,
    measuredWeekLimit,
    dayLayoutAlgorithm,
    enabledViews,
    get localizer() { return localizerSignal.value },
    accessors,
    getNow,
    step,
    timeslots,
    scrollToTime: config.scrollToTime,
    selectable,
    longPressThreshold,
    isDraggable,
    isResizable,

    navigate({ direction, date: target }) {
      const next = navigateDate({
        localizer: localizerSignal.value,
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
      const bg = bgIntersecting(moved.start, moved.end, resourceId)
      const args: {
        event: TEvent; start: string; end: string; allDay: boolean
        resourceId?: ResourceId; backgroundEvents?: TEvent[]
      } = { event: moved.event, start: moved.start, end: moved.end, allDay: moved.allDay }
      if (resourceId != null) args.resourceId = resourceId
      if (bg.length > 0) args.backgroundEvents = bg
      drop(args)
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
      const bg = bgIntersecting(resized.start, resized.end, resourceId)
      const args: {
        event: TEvent; start: string; end: string; allDay: boolean
        resourceId?: ResourceId; backgroundEvents?: TEvent[]
      } = { event: resized.event, start: resized.start, end: resized.end, allDay: resized.allDay }
      if (resourceId != null) args.resourceId = resourceId
      if (bg.length > 0) args.backgroundEvents = bg
      report(args)
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
      const placed = placeExternalEvent({ localizer: localizerSignal.value, target, mode, durationMinutes, allDay, start, end, step })
      const bg = bgIntersecting(placed.start, placed.end, resourceId)
      const args: {
        start: string; end: string; allDay: boolean
        resourceId?: ResourceId; backgroundEvents?: TEvent[]
      } = { ...placed }
      if (resourceId != null) args.resourceId = resourceId
      if (bg.length > 0) args.backgroundEvents = bg
      report(args)
    },

    previewExternal({ target, mode = 'time', durationMinutes, start, end }) {
      // No event lookup: the outside item isn't in `events` yet. A missing
      // duration/template (native drag) previews a single slot (time) or the
      // dropped day (day) via the placement default.
      const placed = placeExternalEvent({ localizer: localizerSignal.value, target, mode, durationMinutes, start, end, step })
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
        localizerSignal.value.add({
          value: localizerSignal.value.add({ value, amount: days, unit: 'day' }),
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
        const candidate = localizerSignal.value.add({
          value: localizerSignal.value.add({ value: grab.start, amount: days, unit: 'day' }),
          amount: minutes,
          unit: 'minute',
        })
        let start: string
        if (days !== 0) {
          // Whole-day resize (month): start can't go forward past end's day.
          start = localizerSignal.value.gt({ a: candidate, b: grab.end, unit: 'day' })
            ? localizerSignal.value.add({
                value: grab.start,
                amount: localizerSignal.value.diff({
                  a: localizerSignal.value.startOf({ value: grab.end, unit: 'day' }),
                  b: localizerSignal.value.startOf({ value: grab.start, unit: 'day' }),
                  unit: 'day',
                }),
                unit: 'day',
              })
            : candidate
        } else {
          // Slot resize (time grid): start can't cross within one slot of the end.
          start =
            localizerSignal.value.diff({ a: grab.end, b: candidate, unit: 'minute' }) < step
              ? localizerSignal.value.add({ value: grab.end, amount: -step, unit: 'minute' })
              : candidate
        }
        keyboardDrag.value = { ...grab, start }
        dragPreview.value = { start, end: grab.end }
        return
      }

      const candidate = localizerSignal.value.add({
        value: localizerSignal.value.add({ value: grab.end, amount: days, unit: 'day' }),
        amount: minutes,
        unit: 'minute',
      })
      let end: string
      if (days !== 0) {
        // Whole-day resize (month): keep the event at least one day long — clamp the
        // end back to the start's day (keeping its time-of-day) if it would go below.
        end = localizerSignal.value.lt({ a: candidate, b: grab.start, unit: 'day' })
          ? localizerSignal.value.add({
              value: grab.end,
              amount: localizerSignal.value.diff({
                a: localizerSignal.value.startOf({ value: grab.start, unit: 'day' }),
                b: localizerSignal.value.startOf({ value: grab.end, unit: 'day' }),
                unit: 'day',
              }),
              unit: 'day',
            })
          : candidate
      } else {
        // Slot resize (time grid): never let the end cross within one slot of the start.
        end =
          localizerSignal.value.diff({ a: candidate, b: grab.start, unit: 'minute' }) < step
            ? localizerSignal.value.add({ value: grab.start, amount: step, unit: 'minute' })
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
      const bg = bgIntersecting(grab.start, grab.end, undefined)
      // A move carries both ends (so a move-then-resize is fully expressed by
      // onEventDrop); a pure resize reports through onEventResize.
      const payload: { event: TEvent; start: string; end: string; allDay: boolean; backgroundEvents?: TEvent[] } = {
        event,
        start: grab.start,
        end: grab.end,
        allDay: grab.allDay,
      }
      if (bg.length > 0) payload.backgroundEvents = bg
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

    setLocalizer({ localizer: nextLocalizer }) {
      localizerSignal.value = nextLocalizer
    },

    destroy() {
      for (const dispose of disposers) dispose()
      disposers.length = 0
    },
  }
}
