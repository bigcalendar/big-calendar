import type { ComponentType } from 'react'
import { useCallback } from 'react'
import { useCalendarContext } from '../CalendarProvider'
import type {
  MonthDateProps,
  MonthEventProps,
  MonthShowMoreProps,
  MonthWeekdayProps,
} from '../components.type'
import EventButton from '../internal/EventButton.component'
import { monthGridStyle, segmentStyle } from '../internal/geometry.function'
import type { Direction } from '../internal/useRovingSelection'
import { useRovingSelection } from '../internal/useRovingSelection'
import { useSignalValue } from '../internal/useSignalValue'
import { useSlotSelection } from '../internal/useSlotSelection'
import DefaultMonthDate from './components/DefaultMonthDate.component'
import DefaultMonthEvent from './components/DefaultMonthEvent.component'
import DefaultMonthShowMore from './components/DefaultMonthShowMore.component'
import DefaultMonthWeekday from './components/DefaultMonthWeekday.component'
import { useMonthWeeks } from './hooks'

/**
 * The month view: a padded day grid split into week rows, with overlapping
 * events laid out as day-column segments. Reads the month model from context and
 * renders nothing when the active view is not the month. Day-cell state
 * (today / off-range) and overflow come from the model; every slot
 * (`weekday` / `dateCell` / `event` / `showMore`) is overridable via
 * `components.month`. Must render inside a {@link CalendarProvider}.
 */
function MonthView<TEvent = unknown>() {
  const { store, components, messages } = useCalendarContext<TEvent>()
  const grid = useMonthWeeks<TEvent>()
  const onSlotPointerDown = useSlotSelection('day')
  const selRange = useSignalValue(store.selection.range)
  const selAnchor = useSignalValue(store.selection.anchor)

  // Keyboard roving over the day cells (one tab stop): left/right step a day,
  // up/down step a week, across the linear day grid (== range.days order).
  const cellCount = grid ? grid.weeks.length * 7 : 0
  const neighbor = useCallback(
    (index: number, dir: Direction): number | null => {
      switch (dir) {
        case 'left':
          return index > 0 ? index - 1 : null
        case 'right':
          return index + 1 < cellCount ? index + 1 : null
        case 'up':
          return index - 7 >= 0 ? index - 7 : null
        case 'down':
          return index + 7 < cellCount ? index + 7 : null
      }
    },
    [cellCount],
  )
  const roving = useRovingSelection({ mode: 'day', count: cellCount, neighbor })

  if (grid === null) return null

  const Weekday: ComponentType<MonthWeekdayProps> = components.month?.weekday ?? DefaultMonthWeekday
  const DateCell: ComponentType<MonthDateProps> = components.month?.dateCell ?? DefaultMonthDate
  const EventSlot: ComponentType<MonthEventProps<TEvent>> =
    components.month?.event ?? DefaultMonthEvent
  const ShowMore: ComponentType<MonthShowMoreProps<TEvent>> =
    components.month?.showMore ?? DefaultMonthShowMore

  return (
    <div className="bc-month">
      <div className="bc-month-header">
        {grid.weekdays.map((weekday) => (
          <Weekday key={weekday.day} day={weekday.day} long={weekday.long} short={weekday.short} />
        ))}
      </div>
      <div
        className="bc-month-grid"
        style={monthGridStyle(grid.weeks.length)}
        ref={roving.containerRef}
        onPointerDown={onSlotPointerDown}
        onKeyDown={roving.onKeyDown}
        onFocusCapture={roving.onFocusCapture}
      >
        {grid.weeks.map((week, weekIndex) => {
          // Day selection works in linear day-index space (matching the store's
          // `range.days`): week `w`, column `d` → index `w*7 + d`. Clip the live
          // selection range to this week so a multi-week drag paints one band per row.
          const base = weekIndex * 7
          const active = selRange !== null && selAnchor?.mode === 'day'
          const segStart = active ? Math.max(selRange.start, base) : 0
          const segEnd = active ? Math.min(selRange.end, base + 6) : -1
          const hasSelection = active && segStart <= segEnd
          return (
            <div key={week.key} className="bc-month-week">
              {/* Non-overridable per-day hit targets for slot selection. */}
              <div className="bc-month-slots">
                {week.days.map((cell, dayIndex) => (
                  <div
                    key={cell.day}
                    className="bc-month-slot"
                    data-date={cell.day}
                    data-slot-index={base + dayIndex}
                    tabIndex={roving.cellTabIndex(base + dayIndex)}
                  />
                ))}
              </div>
              <div className="bc-week-backgrounds">
              {week.days.map((cell) => (
                <DateCell
                  key={cell.day}
                  day={cell.day}
                  label={cell.label}
                  isToday={cell.isToday}
                  isOffRange={cell.isOffRange}
                  onDrillDown={() => store.drilldown({ date: cell.day })}
                />
              ))}
            </div>
            {hasSelection && (
              <div
                className="bc-selection bc-selection-month"
                style={segmentStyle({
                  left: segStart - base + 1,
                  span: segEnd - segStart + 1,
                  row: 1,
                })}
              />
            )}
            <div className="bc-week-events">
              {week.segments.map((segment) => (
                <EventButton
                  key={segment.key}
                  className="bc-segment"
                  style={segmentStyle({ left: segment.left, span: segment.span, row: segment.row })}
                  event={segment.event}
                  title={segment.title}
                >
                  <EventSlot event={segment.event} title={segment.title} />
                </EventButton>
              ))}
              {week.days.map((cell, dayIndex) =>
                cell.extra !== null ? (
                  <div
                    key={`more-${cell.day}`}
                    className="bc-show-more-cell"
                    style={segmentStyle({ left: dayIndex + 1, span: 1, row: week.moreRow })}
                  >
                    <ShowMore
                      count={cell.extra.count}
                      label={messages.showMore(cell.extra.count)}
                      day={cell.day}
                      events={cell.extra.events}
                    />
                  </div>
                ) : null,
              )}
            </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default MonthView
