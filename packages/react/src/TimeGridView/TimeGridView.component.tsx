import { createSlotMetrics } from '@big-calendar/core'
import type { ComponentType } from 'react'
import { useCallback } from 'react'
import { useCalendarContext } from '../CalendarProvider'
import type {
  TimeAllDayEventProps,
  TimeDayHeadingProps,
  TimeEventProps,
  TimeLabelProps,
  TimeShowMoreProps,
} from '../components.type'
import EventButton from '../internal/EventButton.component'
import {
  dayCountStyle,
  eventBoxStyle,
  nowIndicatorStyle,
  segmentStyle,
  selectionStyle,
  slotCountStyle,
  slotGroupStyle,
} from '../internal/geometry.function'
import type { Direction } from '../internal/useRovingSelection'
import { useRovingSelection } from '../internal/useRovingSelection'
import { useEventRoving } from '../internal/useEventRoving'
import { useSignalValue } from '../internal/useSignalValue'
import { useSlotSelection } from '../internal/useSlotSelection'
import DefaultTimeAllDayEvent from './components/DefaultTimeAllDayEvent.component'
import DefaultTimeDayHeading from './components/DefaultTimeDayHeading.component'
import DefaultTimeEvent from './components/DefaultTimeEvent.component'
import DefaultTimeLabel from './components/DefaultTimeLabel.component'
import DefaultTimeShowMore from './components/DefaultTimeShowMore.component'
import { useTimeGrid } from './hooks'

/**
 * The time-grid view (day / week / work-week): a day-column header, an all-day
 * segment row, and a scrollable body of time columns with timed events
 * positioned as fractions of each column. Reads the time-grid model from context
 * and renders nothing when the active view is not a time grid. The now-line
 * shows only on today's column. Every slot (`dayHeading` / `timeLabel` /
 * `event` / `allDayEvent` / `showMore`) is overridable via `components.time`.
 * Must render inside a {@link CalendarProvider}.
 */
function TimeGridView<TEvent = unknown>() {
  const { store, components, messages, descriptionIds } = useCalendarContext<TEvent>()
  const grid = useTimeGrid<TEvent>()
  const onSlotPointerDown = useSlotSelection('time', grid?.slotCount)
  const onAllDayPointerDown = useSlotSelection('day')
  const selRange = useSignalValue(store.selection.range)
  const selAnchor = useSignalValue(store.selection.anchor)
  const dragPreview = useSignalValue(store.dragPreview)

  // Keyboard roving over the two slot groups (one tab stop each). Time body:
  // up/down step a slot within the day, left/right step a day column (global
  // index = colIndex*slotCount + slot). All-day row: left/right step a day.
  const slotCountSafe = grid?.slotCount ?? 0
  const dayCountSafe = grid?.columns.length ?? 0
  const timeCount = dayCountSafe * slotCountSafe
  const timeNeighbor = useCallback(
    (index: number, dir: Direction): number | null => {
      if (slotCountSafe <= 0) return null
      const slot = index % slotCountSafe
      switch (dir) {
        case 'up':
          return slot > 0 ? index - 1 : null
        case 'down':
          return slot < slotCountSafe - 1 ? index + 1 : null
        case 'left':
          return index - slotCountSafe >= 0 ? index - slotCountSafe : null
        case 'right':
          return index + slotCountSafe < timeCount ? index + slotCountSafe : null
      }
    },
    [slotCountSafe, timeCount],
  )
  const timeRoving = useRovingSelection({
    mode: 'time',
    count: timeCount,
    slotCount: slotCountSafe,
    neighbor: timeNeighbor,
  })
  const allDayNeighbor = useCallback(
    (index: number, dir: Direction): number | null => {
      if (dir === 'left') return index > 0 ? index - 1 : null
      if (dir === 'right') return index + 1 < dayCountSafe ? index + 1 : null
      return null
    },
    [dayCountSafe],
  )
  const allDayRoving = useRovingSelection({
    mode: 'day',
    count: dayCountSafe,
    neighbor: allDayNeighbor,
  })
  const eventRoving = useEventRoving()

  if (grid === null) return null

  const DayHeading: ComponentType<TimeDayHeadingProps> =
    components.time?.dayHeading ?? DefaultTimeDayHeading
  const TimeLabel: ComponentType<TimeLabelProps> = components.time?.timeLabel ?? DefaultTimeLabel
  const EventSlot: ComponentType<TimeEventProps<TEvent>> =
    components.time?.event ?? DefaultTimeEvent
  const AllDayEvent: ComponentType<TimeAllDayEventProps<TEvent>> =
    components.time?.allDayEvent ?? DefaultTimeAllDayEvent
  const ShowMore: ComponentType<TimeShowMoreProps<TEvent>> =
    components.time?.showMore ?? DefaultTimeShowMore

  // The live selection highlight for one day column (colIndex). Selection runs
  // in global slot space (dayIndex*slotCount + slot), so a drag can span days:
  // the start day fills from its slot to the bottom, whole middle days fill, and
  // the end day fills from the top to its slot (a same-day drag is just a box).
  const slotCount = grid.slotCount
  const timeSelectionBox = (colIndex: number): { top: number; height: number } | null => {
    if (selRange === null || selAnchor?.mode !== 'time' || slotCount <= 0) return null
    const startDay = Math.floor(selRange.start / slotCount)
    const endDay = Math.floor(selRange.end / slotCount)
    if (colIndex < startDay || colIndex > endDay) return null
    const startSlot = selRange.start - startDay * slotCount
    const endSlot = selRange.end - endDay * slotCount
    let top: number
    let bottom: number // exclusive slot bound
    if (startDay === endDay) {
      top = startSlot
      bottom = endSlot + 1
    } else if (colIndex === startDay) {
      top = startSlot
      bottom = slotCount
    } else if (colIndex === endDay) {
      top = 0
      bottom = endSlot + 1
    } else {
      top = 0
      bottom = slotCount
    }
    return { top: top / slotCount, height: (bottom - top) / slotCount }
  }

  // The live resize-preview box for one day column: the proposed event extent,
  // clipped to the column window. `getRange` clamps the bounds into [min,max], so a
  // column the preview doesn't reach yields zero height and renders nothing. This
  // also spans columns for a cross-day resize.
  const previewBox = (column: { min: string; max: string }): { top: number; height: number } | null => {
    if (dragPreview === null) return null
    const metrics = createSlotMetrics({
      localizer: store.localizer,
      min: column.min,
      max: column.max,
      step: store.step,
      timeslots: store.timeslots,
    })
    const range = metrics.getRange({ start: dragPreview.start, end: dragPreview.end })
    return range.height > 0 ? { top: range.top, height: range.height } : null
  }

  // The live all-day (day-mode) selection band: a single-row span across the
  // selected day columns. Day indices map straight into the visible day list
  // (== grid.columns / range.days), so clip the range to the visible columns.
  const dayCount = grid.columns.length
  const allDayActive = selRange !== null && selAnchor?.mode === 'day'
  const adStart = allDayActive ? Math.max(selRange.start, 0) : 0
  const adEnd = allDayActive ? Math.min(selRange.end, dayCount - 1) : -1
  const allDaySelection = allDayActive && adStart <= adEnd

  return (
    <div
      className="bc-time-grid"
      style={{ ...dayCountStyle(grid.headings.length), ...slotGroupStyle(store.timeslots) }}
      ref={eventRoving.containerRef}
      onKeyDown={eventRoving.onKeyDown}
      onFocusCapture={eventRoving.onFocusCapture}
    >
      <div className="bc-time-header">
        {/* Empty cell over the gutter track so day headings align with the body columns. */}
        <div className="bc-time-header-gutter" aria-hidden="true" />
        {grid.headings.map((heading) => (
          <DayHeading
            key={heading.day}
            day={heading.day}
            label={heading.label}
            isToday={heading.isToday}
            onDrillDown={() => store.drilldown({ date: heading.day })}
          />
        ))}
      </div>

      <div
        className="bc-allday-row"
        ref={allDayRoving.containerRef}
        onPointerDown={onAllDayPointerDown}
        onKeyDown={allDayRoving.onKeyDown}
        onFocusCapture={allDayRoving.onFocusCapture}
      >
        <div className="bc-allday-label">{messages.allDay}</div>
        {/* Non-overridable per-day hit targets for all-day (day-mode) selection,
            one per visible day column. The slot index is the linear day index
            (== grid.columns / the store's range.days order); segments + show-more
            paint above and keep their own pointer interaction. */}
        <div className="bc-allday-slots">
          {grid.columns.map((column, colIndex) => (
            <div
              key={column.key}
              className="bc-allday-slot"
              data-date={column.day}
              data-slot-index={colIndex}
              tabIndex={allDayRoving.cellTabIndex(colIndex)}
              aria-describedby={descriptionIds.selection}
            />
          ))}
        </div>
        {allDaySelection && (
          <div className="bc-allday-selection">
            <div
              className="bc-selection bc-selection-allday"
              style={segmentStyle({ left: adStart + 1, span: adEnd - adStart + 1, row: 1 })}
            />
          </div>
        )}
        <div className="bc-allday-segments">
          {grid.allDay.segments.map((segment) => (
            <EventButton
              key={segment.key}
              className="bc-segment"
              style={segmentStyle({ left: segment.left, span: segment.span, row: segment.row })}
              event={segment.event}
              title={segment.title}
            >
              <AllDayEvent event={segment.event} title={segment.title} />
            </EventButton>
          ))}
          {grid.allDay.extra !== null && (
            <ShowMore
              count={grid.allDay.extra.count}
              label={messages.showMore(grid.allDay.extra.count)}
              events={grid.allDay.extra.events}
            />
          )}
        </div>
      </div>

      <div
        className="bc-time-body"
        style={slotCountStyle(grid.slotCount)}
        ref={timeRoving.containerRef}
        onPointerDown={onSlotPointerDown}
        onKeyDown={timeRoving.onKeyDown}
        onFocusCapture={timeRoving.onFocusCapture}
      >
        <div className="bc-time-gutter">
          {grid.gutter.map((label) => (
            <TimeLabel key={label.key} time={label.time} label={label.label} />
          ))}
        </div>
        {grid.columns.map((column, colIndex) => {
          const className = ['bc-day-column', column.isToday && 'bc-today'].filter(Boolean).join(' ')
          return (
            <div key={column.key} className={className}>
              {/* Real per-slot cells: the focusable hit targets for slot
                  selection (pointer + keyboard). Transparent — the column's
                  gradient still paints the slot/hour lines. Events render above
                  and own their own pointer interaction. The slot index is global
                  (colIndex*slotCount + row) so a drag can span day columns. */}
              <div className="bc-time-slots">
                {Array.from({ length: grid.slotCount }, (_, slotIndex) => (
                  <div
                    key={slotIndex}
                    className="bc-time-slot"
                    data-date={column.day}
                    data-slot-index={colIndex * grid.slotCount + slotIndex}
                    data-bc-instant={column.slots[slotIndex]}
                    tabIndex={timeRoving.cellTabIndex(colIndex * grid.slotCount + slotIndex)}
                    aria-describedby={descriptionIds.selection}
                  />
                ))}
              </div>
              {column.backgroundEvents.map((bg) => (
                <div
                  key={bg.key}
                  className="bc-bg-event"
                  style={eventBoxStyle({ top: bg.top, height: bg.height, left: 0, width: 1, zIndex: 0 })}
                />
              ))}
              {column.events.map((event) => (
                <EventButton
                  key={event.key}
                  className="bc-event"
                  style={eventBoxStyle({
                    top: event.top,
                    height: event.height,
                    left: event.left,
                    width: event.width,
                    zIndex: event.zIndex,
                  })}
                  event={event.event}
                  title={event.title}
                  time={event.time}
                  withResizeHandles
                >
                  <EventSlot event={event.event} title={event.title} time={event.time} />
                </EventButton>
              ))}
              {column.nowTop !== null && (
                <div className="bc-now-indicator" style={nowIndicatorStyle(column.nowTop)} />
              )}
              {(() => {
                const box = timeSelectionBox(colIndex)
                return box === null ? null : (
                  <div className="bc-selection" style={selectionStyle(box)} />
                )
              })()}
              {(() => {
                const box = previewBox(column)
                return box === null ? null : (
                  <div className="bc-drag-preview" style={selectionStyle(box)} />
                )
              })()}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default TimeGridView
