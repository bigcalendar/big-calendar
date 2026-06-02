import { batch, computed, effect, signal } from '@preact/signals-core'
import { resolveAccessors } from '../accessors/accessors.function'
import { BUILTIN_VIEWS, Views } from '../constants/views.constant'
import type { EventId, ViewKey } from '../types/calendar.type'
import type { CalendarConfig } from '../types/config.type'
import { buildViewModel } from '../views/viewModel.function'
import { resolveDrilldownView } from './drilldown.function'
import { navigateDate } from './navigateDate.function'
import type { CalendarStore } from './store.type'
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
        step: config.step,
        timeslots: config.timeslots,
        dayStartMin,
        dayEndMin,
        dayLayoutAlgorithm: config.dayLayoutAlgorithm,
        allDayMaxRows,
        showMultiDayTimes: config.showMultiDayTimes,
      },
    }),
  )

  const disposers: Array<() => void> = []

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

  return {
    date,
    view,
    selected,
    events,
    backgroundEvents,
    resources,
    range,
    viewModel,
    localizer,
    accessors,

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
