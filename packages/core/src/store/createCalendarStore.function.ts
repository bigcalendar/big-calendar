import { batch, computed, effect, signal } from '@preact/signals-core'
import { resolveAccessors } from '../accessors/accessors.function'
import { BUILTIN_VIEWS, Views } from '../constants/views.constant'
import { createSelection } from '../selection/selection.function'
import type { SelectionMode, SelectionRange } from '../selection/selection.type'
import type { EventId, ViewKey } from '../types/calendar.type'
import type { CalendarConfig } from '../types/config.type'
import { buildViewModel } from '../views/viewModel.function'
import { resolveDrilldownView } from './drilldown.function'
import { navigateDate } from './navigateDate.function'
import type { CalendarStore } from './store.type'
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

  const date = signal<string>(config.date ?? getNow())
  const view = signal<ViewKey>(config.view ?? Views.MONTH)
  const selected = signal<EventId | null>(null)
  const events = signal<TEvent[]>(config.events ?? [])
  const backgroundEvents = signal<TEvent[]>(config.backgroundEvents ?? [])
  const resources = signal<TResource[] | undefined>(config.resources)

  const { drilldownView = Views.DAY } = config
  const range = computed(() =>
    viewRange({ localizer, date: date.value, view: view.value, length: config.length }),
  )

  // Localized toolbar title for the active view + focus date. Computed here so
  // every framework adapter renders the identical label.
  const label = computed(() =>
    viewLabel({ localizer, view: view.value, date: date.value, range: range.value }),
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
      options: {
        step,
        timeslots,
        dayStartMin,
        dayEndMin,
        dayLayoutAlgorithm: config.dayLayoutAlgorithm,
        allDayMaxRows,
        showMultiDayTimes: config.showMultiDayTimes,
        weekEventLimit: config.weekEventLimit,
      },
    }),
  )

  // ── slot selection ──────────────────────────────────────────────────────
  // The FSM works in slot-index space; the store captures the anchor day + mode
  // (set when a drag/click starts) and translates committed indices back to ISO
  // dates for the public callbacks. `'time'` indices are vertical slots within
  // the anchor day; `'day'` indices map straight into the visible day list.
  let anchorContext: { mode: SelectionMode; date: string } | null = null

  const translate = (slotRange: SelectionRange): { start: string; end: string; slots: string[] } => {
    const ctx = anchorContext
    if (ctx == null) {
      // Defensive: an action ran without an anchor; emit a degenerate range.
      return { start: date.value, end: date.value, slots: [date.value] }
    }
    if (ctx.mode === 'time') {
      const slots: string[] = []
      for (let i = slotRange.start; i <= slotRange.end; i++) {
        slots.push(localizer.getSlotDate({ date: ctx.date, minutesFromMidnight: dayStartMin + i * step }))
      }
      // Exclusive end: the start of the slot just past the last selected one.
      const end = localizer.getSlotDate({ date: ctx.date, minutesFromMidnight: dayStartMin + (slotRange.end + 1) * step })
      return { start: slots[0]!, end, slots }
    }
    // 'day' mode: linear day index into the visible grid.
    const days = range.value.days
    const slots = days.slice(slotRange.start, slotRange.end + 1)
    const start = slots[0] ?? date.value
    const last = slots[slots.length - 1] ?? start
    return { start, end: localizer.endOf({ value: last, unit: 'day' }), slots }
  }

  const selectionController = createSelection({
    selectable: config.selectable ?? false,
    onSelecting: config.onSelecting
      ? (slotRange) => {
          const { start, end } = translate(slotRange)
          return config.onSelecting!({ start, end })
        }
      : undefined,
    onSelect: (selection) => {
      const { start, end, slots } = translate(selection)
      config.onSelectSlot?.({ start, end, slots, action: selection.action })
    },
  })

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
    start({ slot, date: anchorDate, mode }: { slot: number; date: string; mode: SelectionMode }) {
      anchorContext = { mode, date: anchorDate }
      selectionController.start({ slot })
    },
    to({ slot }: { slot: number }) {
      selectionController.to({ slot })
    },
    complete() {
      selectionController.complete()
    },
    click({ slot, date: anchorDate, mode }: { slot: number; date: string; mode: SelectionMode }) {
      anchorContext = { mode, date: anchorDate }
      selectionController.click({ slot })
    },
    doubleClick({ slot, date: anchorDate, mode }: { slot: number; date: string; mode: SelectionMode }) {
      anchorContext = { mode, date: anchorDate }
      selectionController.doubleClick({ slot })
    },
    cancel() {
      selectionController.cancel()
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
    localizer,
    accessors,
    getNow,
    step,
    timeslots,

    navigate({ direction, date: target }) {
      const next = navigateDate({
        localizer,
        date: date.value,
        direction,
        view: view.value,
        getNow,
        target,
        length: config.length,
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

    select({ id }) {
      selected.value = id
      config.onSelect?.({ id })
    },

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
