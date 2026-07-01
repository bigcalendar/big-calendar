import { createSlotMetrics, wrapAccessor } from '@big-calendar/core'
import type { ResourceId } from '@big-calendar/core'
import { formatEventTime } from '@big-calendar/core/utils'
import { useCalendarContext } from '../CalendarProvider'
import { fromSignal } from '../internal/fromSignal.svelte'

export interface TimeDayHeading {
  day: string
  label: string
  isToday: boolean
}

export interface TimeGutterLabel {
  key: string
  time: string
  label: string
}

export interface TimePositionedEvent<TEvent> {
  key: string
  event: TEvent
  title: string
  time: string
  top: number
  height: number
  left: number
  width: number
  zIndex: number
}

export interface TimeBackgroundEvent<TEvent> {
  key: string
  event: TEvent
  title: string
  top: number
  height: number
  left: number
  width: number
  isStart: boolean
  isEnd: boolean
}

export interface TimeColumn<TEvent> {
  key: string
  day: string
  resourceId: ResourceId | null
  min: string
  max: string
  isToday: boolean
  events: TimePositionedEvent<TEvent>[]
  backgroundEvents: TimeBackgroundEvent<TEvent>[]
  nowTop: number | null
  slots: string[]
}

export interface TimeAllDaySegment<TEvent> {
  key: string
  event: TEvent
  title: string
  left: number
  span: number
  row: number
}

export interface TimeAllDayExtra<TEvent> {
  col: number
  count: number
  events: { key: string; event: TEvent; title: string }[]
}

export interface TimeAllDayRow<TEvent> {
  segments: TimeAllDaySegment<TEvent>[]
  extra: TimeAllDayExtra<TEvent>[] | null
}

export interface TimeResourceGroup<TEvent> {
  key: string
  resourceId: ResourceId
  resourceTitle: string
  resourceType: string | null
  columns: TimeColumn<TEvent>[]
  allDay: TimeAllDayRow<TEvent>
}

export interface TimeDayResourceCell<TEvent> {
  key: string
  resourceId: ResourceId
  resourceTitle: string
  resourceType: string | null
  column: TimeColumn<TEvent>
  allDay: TimeAllDayRow<TEvent>
}

export interface TimeDayGroup<TEvent> {
  key: string
  date: string
  label: string
  isToday: boolean
  cells: TimeDayResourceCell<TEvent>[]
}

export interface TimeGrid<TEvent> {
  headings: TimeDayHeading[]
  gutter: TimeGutterLabel[]
  slotCount: number
  allDay: TimeAllDayRow<TEvent>
  columns: TimeColumn<TEvent>[]
  resources: TimeResourceGroup<TEvent>[] | null
  dayGroups: TimeDayGroup<TEvent>[] | null
}

export function useTimeGrid<TEvent = unknown>(): { readonly current: TimeGrid<TEvent> | null } {
  const { store, messages } = useCalendarContext<TEvent>()
  const viewModel = fromSignal(store.viewModel)

  const grid = $derived.by((): TimeGrid<TEvent> | null => {
    const vm = viewModel.current
    if (vm.kind !== 'time') return null

    const { localizer, accessors, getNow, step, timeslots } = store
    const now = getNow()
    const id = wrapAccessor(accessors.id)
    const title = wrapAccessor(accessors.title)
    const start = wrapAccessor(accessors.start)
    const { days, columns, allDay, resources, dayGroups } = vm.timeGrid

    const headings: TimeDayHeading[] = days.map((day) => ({
      day,
      label: localizer.format({ value: day, format: 'dayColumnHeader' }),
      isToday: localizer.isSameDate({ a: day, b: now }),
    }))

    const firstColumn =
      columns[0] ?? resources?.[0]?.columns[0] ?? dayGroups?.[0]?.cells[0]?.column
    const gutter: TimeGutterLabel[] = []
    let slotCount = 0
    if (firstColumn) {
      const metrics = createSlotMetrics({
        localizer,
        min: firstColumn.min,
        max: firstColumn.max,
        step,
        timeslots,
      })
      slotCount = metrics.numSlots
      for (let group = 0; group * timeslots < metrics.numSlots; group++) {
        const time = metrics.slots[group * timeslots] ?? ''
        gutter.push({
          key: String(group),
          time,
          label: localizer.format({ value: time, format: 'timeGutter' }),
        })
      }
    }

    const resolveColumn = (
      column: (typeof columns)[number],
      keyBase: string,
    ): TimeColumn<TEvent> => {
      const isToday = localizer.isSameDate({ a: column.date, b: now })
      const events: TimePositionedEvent<TEvent>[] = column.events.map((placed, i) => ({
        key: `${keyBase}-${i}-${String(id(placed.event) ?? '')}`,
        event: placed.event,
        title: title(placed.event) ?? '',
        time: formatEventTime({
          localizer,
          allDayLabel: messages.allDay,
          start: start(placed.event),
          end: null,
          allDay: false,
          format: 'time',
        }),
        top: placed.top,
        height: placed.height,
        left: placed.left,
        width: placed.width,
        zIndex: placed.zIndex,
      }))
      const backgroundEvents: TimeBackgroundEvent<TEvent>[] = column.backgroundEvents.map(
        (placed, i) => ({
          key: `${keyBase}-bg-${i}-${String(id(placed.event) ?? '')}`,
          event: placed.event,
          title: title(placed.event) ?? '',
          top: placed.top,
          height: placed.height,
          left: placed.left,
          width: placed.width,
          isStart: placed.isStart,
          isEnd: placed.isEnd,
        }),
      )
      const metrics = createSlotMetrics({
        localizer,
        min: column.min,
        max: column.max,
        step,
        timeslots,
      })
      const slots = metrics.slots.slice(0, metrics.numSlots)
      let nowTop: number | null = null
      if (isToday) {
        const top = metrics.getCurrentTimePosition(now)
        if (top >= 0 && top <= 1) nowTop = top
      }
      return {
        key: keyBase,
        day: column.date,
        resourceId: column.resourceId,
        min: column.min,
        max: column.max,
        isToday,
        events,
        backgroundEvents,
        nowTop,
        slots,
      }
    }

    const resolveAllDay = (
      rows: typeof allDay,
      keyBase: string,
    ): TimeAllDayRow<TEvent> => {
      const segments: TimeAllDaySegment<TEvent>[] = rows.levels.flatMap((level, rowIndex) =>
        level.map((segment, segIndex) => ({
          key: `${keyBase}-${rowIndex}-${segIndex}-${String(id(segment.event) ?? '')}`,
          event: segment.event,
          title: title(segment.event) ?? '',
          left: segment.left,
          span: segment.span,
          row: rowIndex + 1,
        })),
      )
      const extraByCol = new Map<number, { key: string; event: TEvent; title: string }[]>()
      rows.extra.forEach((segment, extraIndex) => {
        const entry = extraByCol.get(segment.left) ?? []
        entry.push({
          key: `${keyBase}-extra-${extraIndex}-${String(id(segment.event) ?? '')}`,
          event: segment.event,
          title: title(segment.event) ?? '',
        })
        extraByCol.set(segment.left, entry)
      })
      const extra: TimeAllDayExtra<TEvent>[] | null =
        extraByCol.size > 0
          ? [...extraByCol.entries()].map(([col, events]) => ({
              col,
              count: events.length,
              events,
            }))
          : null
      return { segments, extra }
    }

    if (resources !== null) {
      const groups: TimeResourceGroup<TEvent>[] = resources.map((group) => {
        const base = `r${String(group.resourceId)}`
        return {
          key: base,
          resourceId: group.resourceId,
          resourceTitle: group.resourceTitle,
          resourceType: group.resourceType,
          columns: group.columns.map((col, i) => resolveColumn(col, `${base}-${i}`)),
          allDay: resolveAllDay(group.allDay, base),
        }
      })
      return {
        headings,
        gutter,
        slotCount,
        allDay: { segments: [], extra: null },
        columns: [],
        resources: groups,
        dayGroups: null,
      }
    }

    if (dayGroups !== null) {
      const resolvedDayGroups: TimeDayGroup<TEvent>[] = dayGroups.map((group, dayIndex) => ({
        key: `d${dayIndex}`,
        date: group.date,
        label: localizer.format({ value: group.date, format: 'dayColumnHeader' }),
        isToday: localizer.isSameDate({ a: group.date, b: now }),
        cells: group.cells.map((cell, cellIndex) => {
          const base = `d${dayIndex}-r${String(cell.resourceId)}-${cellIndex}`
          return {
            key: base,
            resourceId: cell.resourceId,
            resourceTitle: cell.resourceTitle,
            resourceType: cell.resourceType,
            column: resolveColumn(cell.column, base),
            allDay: resolveAllDay(cell.allDay, base),
          }
        }),
      }))
      return {
        headings,
        gutter,
        slotCount,
        allDay: { segments: [], extra: null },
        columns: [],
        resources: null,
        dayGroups: resolvedDayGroups,
      }
    }

    return {
      headings,
      gutter,
      slotCount,
      allDay: resolveAllDay(allDay, 'a'),
      columns: columns.map((col, i) => resolveColumn(col, String(i))),
      resources: null,
      dayGroups: null,
    }
  })

  return { get current() { return grid } }
}
