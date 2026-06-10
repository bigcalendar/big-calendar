import { createSlotMetrics } from '@big-calendar/core'
import type { ResizeEdge, ResourceId } from '@big-calendar/core'
import clsx from 'clsx'
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
import EventButton from '../EventButton'
import {
  dayCountStyle,
  eventBoxStyle,
  nowIndicatorStyle,
  segmentStyle,
  selectionStyle,
  slotCountStyle,
  slotGroupStyle,
} from '../geometryStyles'
import type { Direction } from '../useRovingSelection'
import { useRovingSelection } from '../useRovingSelection'
import { useEventRoving } from '../useEventRoving'
import { useKeyboardDnd } from '../useKeyboardDnd'
import { useSignalValue } from '../internal/useSignalValue'
import { useSlotSelection } from '../useSlotSelection'
import DefaultTimeAllDayEvent from '../DefaultTimeAllDayEvent'
import DefaultTimeDayHeading from '../DefaultTimeDayHeading'
import DefaultTimeEvent from '../DefaultTimeEvent'
import DefaultTimeLabel from '../DefaultTimeLabel'
import DefaultTimeShowMore from '../DefaultTimeShowMore'
import { useTimeGrid } from '../useTimeGrid'

/** A timed event resizes from both edges (top + bottom); stable identity. */
const TIMED_RESIZE_EDGES: readonly ResizeEdge[] = ['start', 'end']

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
  const { store, components, messages, descriptionIds } =
    useCalendarContext<TEvent>()
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
          return index + slotCountSafe < timeCount
            ? index + slotCountSafe
            : null
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
  const keyboardDnd = useKeyboardDnd<TEvent>({ mode: 'time' })

  if (grid === null) return null

  const DayHeading: ComponentType<TimeDayHeadingProps> =
    components.time?.dayHeading ?? DefaultTimeDayHeading
  const TimeLabel: ComponentType<TimeLabelProps> =
    components.time?.timeLabel ?? DefaultTimeLabel
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
  const timeSelectionBox = (
    colIndex: number,
  ): { top: number; height: number } | null => {
    if (selRange === null || selAnchor?.mode !== 'time' || slotCount <= 0)
      return null
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
  const previewBox = (column: {
    min: string
    max: string
  }): { top: number; height: number } | null => {
    if (dragPreview === null) return null
    const metrics = createSlotMetrics({
      localizer: store.localizer,
      min: column.min,
      max: column.max,
      step: store.step,
      timeslots: store.timeslots,
    })
    const range = metrics.getRange({
      start: dragPreview.start,
      end: dragPreview.end,
    })
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

  // Live selection highlight for a resource time column. Used by both day-major
  // and resource-major layouts: only the column whose resource AND day both match
  // the selection anchor lights up.
  const resourceSelectionBox = (
    resourceId: ResourceId,
    date: string,
  ): { top: number; height: number } | null => {
    if (selRange === null || selAnchor?.mode !== 'time' || grid.slotCount <= 0)
      return null
    if (
      selAnchor.resourceId == null ||
      String(selAnchor.resourceId) !== String(resourceId)
    )
      return null
    if (selAnchor.date !== date) return null
    const top = selRange.start / grid.slotCount
    const height = (selRange.end - selRange.start + 1) / grid.slotCount
    return { top, height }
  }

  // ── day-major resource grid ───────────────────────────────────────────────
  // When resourceLayout:'day', groups are keyed by visible day; each group holds
  // one cell per resource. The two-tier header has day names on row 1 spanning
  // their resource columns, resource names on row 2. The all-day row has one
  // stacked lane per (day × resource) cell. The body columns run day-first.
  if (grid.dayGroups !== null) {
    const dayGroupsList = grid.dayGroups
    const numResources = dayGroupsList[0]?.cells.length ?? 0
    const leafCount = dayGroupsList.length * numResources

    // First grid column of a day group's first resource (1 = gutter).
    const colStartOfDay = (dayIndex: number): number => 2 + dayIndex * numResources

    return (
      <div
        className="bc-time-grid bc-time-grid-resources bc-time-grid-resources-day-major"
        style={{
          ...dayCountStyle(leafCount),
          ...slotGroupStyle(store.timeslots),
        }}
        ref={eventRoving.containerRef}
        onKeyDownCapture={keyboardDnd.onKeyDownCapture}
        onKeyDown={eventRoving.onKeyDown}
        onFocusCapture={eventRoving.onFocusCapture}
      >
        <div className="bc-sr-only" role="status" aria-live="polite">
          {keyboardDnd.announcement}
        </div>

        <div className="bc-time-head">
          {/* Two-tier header: day name (row 1) spanning its resource columns,
              resource names beneath (row 2). */}
          <div className="bc-time-header bc-time-header-tiered">
            <div
              className="bc-time-header-gutter"
              aria-hidden="true"
              style={{ gridRow: '1 / 3' }}
            />
            {dayGroupsList.flatMap((dayGroup, di) => [
              <div
                key={`${dayGroup.key}-day`}
                className="bc-header bc-day-major-header"
                role="columnheader"
                style={{
                  gridColumn: `${colStartOfDay(di)} / span ${numResources}`,
                  gridRow: 1,
                }}
              >
                <DayHeading
                  day={dayGroup.date}
                  label={dayGroup.label}
                  isToday={dayGroup.isToday}
                  onDrillDown={() => store.drilldown({ date: dayGroup.date })}
                />
              </div>,
              ...dayGroup.cells.map((cell, ri) => (
                <div
                  key={cell.key}
                  className="bc-resource-day-head"
                  style={{ gridColumn: colStartOfDay(di) + ri, gridRow: 2 }}
                >
                  <span className="bc-resource-header-label">{cell.resourceTitle}</span>
                </div>
              )),
            ])}
          </div>

          {/* Per-(day × resource) all-day lanes, stacked single-day. */}
          <div className="bc-allday-row" onPointerDown={onAllDayPointerDown}>
            <div className="bc-allday-label">{messages.allDay}</div>
            {dayGroupsList.flatMap((dayGroup, di) =>
              dayGroup.cells.map((cell) => (
                <div
                  key={cell.key}
                  className={`bc-allday-resource${dayGroup.isToday ? ' bc-today' : ''}`}
                  data-bc-resource={String(cell.resourceId)}
                >
                  <div
                    className="bc-allday-slot"
                    data-date={dayGroup.date}
                    data-bc-allday={dayGroup.date}
                    data-slot-index={di}
                    aria-describedby={descriptionIds.selection}
                  />
                  <div className="bc-allday-resource-stack">
                    {cell.allDay.segments.map((segment) => (
                      <EventButton
                        key={segment.key}
                        className="bc-segment bc-segment-stacked"
                        event={segment.event}
                        title={segment.title}
                      >
                        <AllDayEvent event={segment.event} title={segment.title} />
                      </EventButton>
                    ))}
                    {cell.allDay.extra !== null && (
                      <ShowMore
                        count={cell.allDay.extra.count}
                        label={messages.showMore(cell.allDay.extra.count)}
                        events={cell.allDay.extra.events}
                      />
                    )}
                  </div>
                </div>
              )),
            )}
          </div>
        </div>

        <div
          className="bc-time-body"
          style={slotCountStyle(grid.slotCount)}
          onPointerDown={onSlotPointerDown}
        >
          <div className="bc-time-gutter">
            {grid.gutter.map((label) => (
              <TimeLabel key={label.key} time={label.time} label={label.label} />
            ))}
          </div>
          {dayGroupsList.flatMap((dayGroup) =>
            dayGroup.cells.map((cell) => {
              const className = [
                'bc-day-column',
                cell.column.isToday && 'bc-today',
              ]
                .filter(Boolean)
                .join(' ')
              return (
                <div
                  key={cell.column.key}
                  className={className}
                  data-bc-resource={String(cell.resourceId)}
                >
                  <div className="bc-time-slots">
                    {Array.from({ length: grid.slotCount }, (_, slotIndex) => (
                      <div
                        key={slotIndex}
                        className="bc-time-slot"
                        data-date={dayGroup.date}
                        data-slot-index={slotIndex}
                        data-bc-instant={cell.column.slots[slotIndex]}
                        aria-describedby={descriptionIds.selection}
                      />
                    ))}
                  </div>
                  {cell.column.backgroundEvents.map((bg) => (
                    <div
                      key={bg.key}
                      className="bc-bg-event"
                      style={eventBoxStyle({
                        top: bg.top,
                        height: bg.height,
                        left: 0,
                        width: 1,
                        zIndex: 0,
                      })}
                    />
                  ))}
                  {cell.column.events.map((event) => (
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
                      resizeEdges={TIMED_RESIZE_EDGES}
                    >
                      <EventSlot
                        event={event.event}
                        title={event.title}
                        time={event.time}
                      />
                    </EventButton>
                  ))}
                  {cell.column.nowTop !== null && (
                    <div
                      className="bc-now-indicator"
                      style={nowIndicatorStyle(cell.column.nowTop)}
                    />
                  )}
                  {(() => {
                    const box = resourceSelectionBox(cell.resourceId, dayGroup.date)
                    return box === null ? null : (
                      <div className="bc-selection" style={selectionStyle(box)} />
                    )
                  })()}
                  {(() => {
                    const box = previewBox(cell.column)
                    return box === null ? null : (
                      <div className="bc-drag-preview" style={selectionStyle(box)} />
                    )
                  })()}
                </div>
              )
            }),
          )}
        </div>
      </div>
    )
  }

  // ── resource-major grid (day / week) ──────────────────────────────────────
  // When the calendar has resources, the grid splits per resource. The DAY view
  // gives each resource a single-tier title header, a stacked all-day lane, and
  // one time column. A WEEK view (more than one visible day) gives each resource
  // a two-tier header (resource title spanning its day columns, day names beneath)
  // and a multi-day all-day lane, with the resource's day columns laid out in
  // resource-major order. Every column / lane carries `data-bc-resource` so a
  // move/resize/drop reports the landing resource and slot selection scopes to it.
  if (grid.resources !== null) {
    const groups = grid.resources
    const leafCount = groups.reduce((n, g) => n + g.columns.length, 0)
    // Visible days per resource (uniform — every group spans the same day list).
    const daysPerGroup = grid.headings.length
    const isWeek = daysPerGroup > 1
    // First body/header grid column (1 = gutter) of a resource group's first day.
    const colStartOf = (groupIndex: number): number =>
      2 + groupIndex * daysPerGroup

    return (
      <div
        className={`bc-time-grid bc-time-grid-resources ${isWeek ? 'bc-time-grid-resources-week' : 'bc-time-grid-resources-day'}`}
        style={{
          ...dayCountStyle(leafCount),
          ...slotGroupStyle(store.timeslots),
        }}
        ref={eventRoving.containerRef}
        onKeyDownCapture={keyboardDnd.onKeyDownCapture}
        onKeyDown={eventRoving.onKeyDown}
        onFocusCapture={eventRoving.onFocusCapture}
      >
        <div className="bc-sr-only" role="status" aria-live="polite">
          {keyboardDnd.announcement}
        </div>

        {/* Sticky head: the header + all-day rows stay pinned to the top while the
            body scrolls vertically, and ride along with the body on horizontal
            scroll (the whole grid is one 2-D scroll container). */}
        <div className="bc-time-head">
          {/* Resource header. Day: a single tier of one title cell per resource.
            Week: two tiers — each resource title spans its day columns (row 1)
            with the day names beneath (row 2), placed explicitly into the leaf-
            column grid so they stay aligned with the body columns. */}
          <div
            className={`bc-time-header${isWeek ? ' bc-time-header-tiered' : ''}`}
          >
            <div
              className="bc-time-header-gutter"
              aria-hidden="true"
              style={isWeek ? { gridRow: '1 / 3' } : undefined}
            />
            {isWeek
              ? groups.flatMap((group, gi) => [
                  <div
                    key={`${group.key}-title`}
                    className="bc-header bc-resource-header"
                    role="columnheader"
                    style={{
                      gridColumn: `${colStartOf(gi)} / span ${daysPerGroup}`,
                      gridRow: 1,
                    }}
                  >
                    {group.resourceTitle}
                  </div>,
                  ...group.columns.map((column, di) => (
                    <div
                      key={`${column.key}-head`}
                      className="bc-resource-day-head"
                      style={{ gridColumn: colStartOf(gi) + di, gridRow: 2 }}
                    >
                      <DayHeading
                        day={column.day}
                        label={grid.headings[di]?.label ?? ''}
                        isToday={column.isToday}
                        onDrillDown={() =>
                          store.drilldown({ date: column.day })
                        }
                      />
                    </div>
                  )),
                ])
              : groups.map((group) => (
                  <div
                    key={group.key}
                    className="bc-header bc-resource-header"
                    role="columnheader"
                  >
                    {group.resourceTitle}
                  </div>
                ))}
          </div>

          {/* Per-resource all-day lanes. Day: one stacked single-day lane each.
            Week: each lane spans its resource's day columns, with a per-day hit
            target row beneath and the resource's all-day segments placed across
            its days (like the flat all-day row, scoped to one resource). */}
          <div className="bc-allday-row" onPointerDown={onAllDayPointerDown}>
            <div className="bc-allday-label">{messages.allDay}</div>
            {isWeek
              ? groups.map((group, gi) => {
                  const dayCols = `repeat(${daysPerGroup}, minmax(0, 1fr))`
                  return (
                    <div
                      key={group.key}
                      className="bc-allday-resource bc-allday-resource-week"
                      data-bc-resource={String(group.resourceId)}
                      style={{
                        gridColumn: `${colStartOf(gi)} / span ${daysPerGroup}`,
                        gridRow: 1,
                      }}
                    >
                      {/* Per-day hit targets (day-mode selection + drops). The slot
                        index is the day index, which equals the global day index
                        since every resource lists the same visible days in order. */}
                      <div
                        className="bc-allday-resource-slots"
                        style={{ gridTemplateColumns: dayCols }}
                      >
                        {group.columns.map((column, di) => (
                          <div
                            key={column.key}
                            className={column.isToday ? 'bc-allday-slot bc-today' : 'bc-allday-slot'}
                            data-date={column.day}
                            data-bc-allday={column.day}
                            data-slot-index={di}
                            aria-describedby={descriptionIds.selection}
                          />
                        ))}
                      </div>
                      <div
                        className="bc-allday-resource-segments"
                        style={{ gridTemplateColumns: dayCols }}
                      >
                        {group.allDay.segments.map((segment) => (
                          <EventButton
                            key={segment.key}
                            className="bc-segment"
                            style={segmentStyle({
                              left: segment.left,
                              span: segment.span,
                              row: segment.row,
                            })}
                            event={segment.event}
                            title={segment.title}
                          >
                            <AllDayEvent
                              event={segment.event}
                              title={segment.title}
                            />
                          </EventButton>
                        ))}
                        {group.allDay.extra !== null && (
                          <ShowMore
                            count={group.allDay.extra.count}
                            label={messages.showMore(group.allDay.extra.count)}
                            events={group.allDay.extra.events}
                          />
                        )}
                      </div>
                    </div>
                  )
                })
              : groups.map((group) => (
                  <div
                    key={group.key}
                    className={`bc-allday-resource${group.columns[0]?.isToday ? ' bc-today' : ''}`}
                    data-bc-resource={String(group.resourceId)}
                  >
                    {/* Single-day hit target for all-day (day-mode) selection + drops. */}
                    <div
                      className="bc-allday-slot"
                      data-date={group.columns[0]?.day}
                      data-bc-allday={group.columns[0]?.day}
                      data-slot-index={0}
                      aria-describedby={descriptionIds.selection}
                    />
                    <div className="bc-allday-resource-stack">
                      {group.allDay.segments.map((segment) => (
                        <EventButton
                          key={segment.key}
                          className="bc-segment bc-segment-stacked"
                          event={segment.event}
                          title={segment.title}
                        >
                          <AllDayEvent
                            event={segment.event}
                            title={segment.title}
                          />
                        </EventButton>
                      ))}
                      {group.allDay.extra !== null && (
                        <ShowMore
                          count={group.allDay.extra.count}
                          label={messages.showMore(group.allDay.extra.count)}
                          events={group.allDay.extra.events}
                        />
                      )}
                    </div>
                  </div>
                ))}
          </div>
        </div>

        <div
          className="bc-time-body"
          style={slotCountStyle(grid.slotCount)}
          onPointerDown={onSlotPointerDown}
        >
          <div className="bc-time-gutter">
            {grid.gutter.map((label) => (
              <TimeLabel
                key={label.key}
                time={label.time}
                label={label.label}
              />
            ))}
          </div>
          {groups.flatMap((group) =>
            group.columns.map((column) => {
              const className = clsx('bc-day-column', column.isToday && 'bc-today')
              return (
                <div
                  key={column.key}
                  className={className}
                  data-bc-resource={String(group.resourceId)}
                >
                  <div className="bc-time-slots">
                    {Array.from({ length: grid.slotCount }, (_, slotIndex) => (
                      <div
                        key={slotIndex}
                        className="bc-time-slot"
                        data-date={column.day}
                        data-slot-index={slotIndex}
                        data-bc-instant={column.slots[slotIndex]}
                        aria-describedby={descriptionIds.selection}
                      />
                    ))}
                  </div>
                  {column.backgroundEvents.map((bg) => (
                    <div
                      key={bg.key}
                      className="bc-bg-event"
                      style={eventBoxStyle({
                        top: bg.top,
                        height: bg.height,
                        left: 0,
                        width: 1,
                        zIndex: 0,
                      })}
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
                      resizeEdges={TIMED_RESIZE_EDGES}
                    >
                      <EventSlot
                        event={event.event}
                        title={event.title}
                        time={event.time}
                      />
                    </EventButton>
                  ))}
                  {column.nowTop !== null && (
                    <div
                      className="bc-now-indicator"
                      style={nowIndicatorStyle(column.nowTop)}
                    />
                  )}
                  {(() => {
                    const box = resourceSelectionBox(
                      group.resourceId,
                      column.day,
                    )
                    return box === null ? null : (
                      <div
                        className="bc-selection"
                        style={selectionStyle(box)}
                      />
                    )
                  })()}
                </div>
              )
            }),
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      className="bc-time-grid"
      style={{
        ...dayCountStyle(grid.headings.length),
        ...slotGroupStyle(store.timeslots),
      }}
      ref={eventRoving.containerRef}
      onKeyDownCapture={keyboardDnd.onKeyDownCapture}
      onKeyDown={eventRoving.onKeyDown}
      onFocusCapture={eventRoving.onFocusCapture}
    >
      {/* Polite live region: announces each keyboard-grab step (pick up / move /
          resize / drop / cancel) to assistive tech. */}
      <div className="bc-sr-only" role="status" aria-live="polite">
        {keyboardDnd.announcement}
      </div>
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
              className={column.isToday ? 'bc-allday-slot bc-today' : 'bc-allday-slot'}
              data-date={column.day}
              data-bc-allday={column.day}
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
              style={segmentStyle({
                left: adStart + 1,
                span: adEnd - adStart + 1,
                row: 1,
              })}
            />
          </div>
        )}
        <div className="bc-allday-segments">
          {grid.allDay.segments.map((segment) => (
            <EventButton
              key={segment.key}
              className="bc-segment"
              style={segmentStyle({
                left: segment.left,
                span: segment.span,
                row: segment.row,
              })}
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
          const className = ['bc-day-column', column.isToday && 'bc-today']
            .filter(Boolean)
            .join(' ')
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
                    tabIndex={timeRoving.cellTabIndex(
                      colIndex * grid.slotCount + slotIndex,
                    )}
                    aria-describedby={descriptionIds.selection}
                  />
                ))}
              </div>
              {column.backgroundEvents.map((bg) => (
                <div
                  key={bg.key}
                  className="bc-bg-event"
                  style={eventBoxStyle({
                    top: bg.top,
                    height: bg.height,
                    left: 0,
                    width: 1,
                    zIndex: 0,
                  })}
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
                  resizeEdges={TIMED_RESIZE_EDGES}
                >
                  <EventSlot
                    event={event.event}
                    title={event.title}
                    time={event.time}
                  />
                </EventButton>
              ))}
              {column.nowTop !== null && (
                <div
                  className="bc-now-indicator"
                  style={nowIndicatorStyle(column.nowTop)}
                />
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
                  <div
                    className="bc-drag-preview"
                    style={selectionStyle(box)}
                  />
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
