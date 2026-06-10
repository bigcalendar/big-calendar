import { selectionStyle } from '../geometryStyles'
import EventButton from '../EventButton'
import { useTimeGridView } from '../useTimeGridView'

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
  const { grid, announcement, root, getRootStyle, header, body } = useTimeGridView<TEvent>()

  if (grid === null) return null

  const {
    components: { DayHeading, AllDayEvent, ShowMore },
    messages: hdrMessages,
    allDayDescribedBy,
    drilldown,
    allDayRow,
    resourceAllDayRow,
    getHeadingProps,
    getAllDaySlotProps,
    getResourceAllDaySlotProps,
    allDaySelectionBand,
    getAllDaySegmentProps,
    getStackedSegmentProps,
  } = header

  const {
    components: { TimeLabel, EventSlot },
    body: bodyRoot,
    resourceBody,
    getColumnProps,
    getSlotProps,
    getResourceSlotProps,
    getTimeSelectionBox,
    getResourceSelectionBox,
    getPreviewBox,
    getBgEventProps,
    getEventProps,
    getNowIndicatorProps,
  } = body

  // ── day-major resource grid ───────────────────────────────────────────────
  if (grid.dayGroups !== null) {
    const dayGroupsList = grid.dayGroups
    const numResources = dayGroupsList[0]?.cells.length ?? 0
    const leafCount = dayGroupsList.length * numResources
    const colStartOfDay = (dayIndex: number): number => 2 + dayIndex * numResources

    return (
      <div
        className="bc-time-grid bc-time-grid-resources bc-time-grid-resources-day-major"
        style={getRootStyle(leafCount)}
        {...root}
      >
        <div className="bc-sr-only" role="status" aria-live="polite">
          {announcement}
        </div>

        <div className="bc-time-head">
          <div className="bc-time-header bc-time-header-tiered">
            <div className="bc-time-header-gutter" aria-hidden="true" style={{ gridRow: '1 / 3' }} />
            {dayGroupsList.flatMap((dayGroup, di) => [
              <div
                key={`${dayGroup.key}-day`}
                className="bc-header bc-day-major-header"
                role="columnheader"
                style={{ gridColumn: `${colStartOfDay(di)} / span ${numResources}`, gridRow: 1 }}
              >
                <DayHeading
                  {...getHeadingProps({ day: dayGroup.date, label: dayGroup.label, isToday: dayGroup.isToday })}
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

          <div className="bc-allday-row" {...resourceAllDayRow}>
            <div className="bc-allday-label">{hdrMessages.allDay}</div>
            {dayGroupsList.flatMap((dayGroup, di) =>
              dayGroup.cells.map((cell) => (
                <div
                  key={cell.key}
                  className={`bc-allday-resource${dayGroup.isToday ? ' bc-today' : ''}`}
                  data-bc-resource={String(cell.resourceId)}
                >
                  <div {...getResourceAllDaySlotProps(dayGroup.date, di)} />
                  <div className="bc-allday-resource-stack">
                    {cell.allDay.segments.map((segment) => (
                      <EventButton key={segment.key} {...getStackedSegmentProps(segment)}>
                        <AllDayEvent event={segment.event} title={segment.title} />
                      </EventButton>
                    ))}
                    {cell.allDay.extra !== null && (
                      <ShowMore
                        count={cell.allDay.extra.count}
                        label={hdrMessages.showMore(cell.allDay.extra.count)}
                        events={cell.allDay.extra.events}
                      />
                    )}
                  </div>
                </div>
              )),
            )}
          </div>
        </div>

        <div {...resourceBody}>
          <div className="bc-time-gutter">
            {grid.gutter.map((label) => (
              <TimeLabel key={label.key} time={label.time} label={label.label} />
            ))}
          </div>
          {dayGroupsList.flatMap((dayGroup) =>
            dayGroup.cells.map((cell) => {
              const colProps = getColumnProps(cell.column)
              const nowProps = getNowIndicatorProps(cell.column)
              const selBox = getResourceSelectionBox(cell.resourceId, dayGroup.date)
              const prevBox = getPreviewBox(cell.column)
              return (
                <div
                  key={cell.column.key}
                  {...colProps}
                  data-bc-resource={String(cell.resourceId)}
                >
                  <div className="bc-time-slots">
                    {Array.from({ length: grid.slotCount }, (_, slotIndex) => (
                      <div
                        key={slotIndex}
                        {...getResourceSlotProps(
                          dayGroup.date,
                          slotIndex,
                          cell.column.slots[slotIndex] ?? '',
                        )}
                      />
                    ))}
                  </div>
                  {cell.column.backgroundEvents.map((bg) => (
                    <div key={bg.key} {...getBgEventProps(bg)} />
                  ))}
                  {cell.column.events.map((event) => (
                    <EventButton key={event.key} {...getEventProps(event)}>
                      <EventSlot event={event.event} title={event.title} time={event.time} />
                    </EventButton>
                  ))}
                  {nowProps && <div {...nowProps} />}
                  {selBox && <div className="bc-selection" style={selectionStyle(selBox)} />}
                  {prevBox && <div className="bc-drag-preview" style={selectionStyle(prevBox)} />}
                </div>
              )
            }),
          )}
        </div>
      </div>
    )
  }

  // ── resource-major grid ───────────────────────────────────────────────────
  if (grid.resources !== null) {
    const groups = grid.resources
    const leafCount = groups.reduce((n, g) => n + g.columns.length, 0)
    const daysPerGroup = grid.headings.length
    const isWeek = daysPerGroup > 1
    const colStartOf = (groupIndex: number): number => 2 + groupIndex * daysPerGroup

    return (
      <div
        className={`bc-time-grid bc-time-grid-resources ${isWeek ? 'bc-time-grid-resources-week' : 'bc-time-grid-resources-day'}`}
        style={getRootStyle(leafCount)}
        {...root}
      >
        <div className="bc-sr-only" role="status" aria-live="polite">
          {announcement}
        </div>

        <div className="bc-time-head">
          <div className={`bc-time-header${isWeek ? ' bc-time-header-tiered' : ''}`}>
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
                    style={{ gridColumn: `${colStartOf(gi)} / span ${daysPerGroup}`, gridRow: 1 }}
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
                        onDrillDown={() => drilldown(column.day)}
                      />
                    </div>
                  )),
                ])
              : groups.map((group) => (
                  <div key={group.key} className="bc-header bc-resource-header" role="columnheader">
                    {group.resourceTitle}
                  </div>
                ))}
          </div>

          <div className="bc-allday-row" {...resourceAllDayRow}>
            <div className="bc-allday-label">{hdrMessages.allDay}</div>
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
                      <div className="bc-allday-resource-slots" style={{ gridTemplateColumns: dayCols }}>
                        {group.columns.map((column, di) => (
                          <div key={column.key} {...getResourceAllDaySlotProps(column.day, di, column.isToday)} />
                        ))}
                      </div>
                      <div className="bc-allday-resource-segments" style={{ gridTemplateColumns: dayCols }}>
                        {group.allDay.segments.map((segment) => (
                          <EventButton key={segment.key} {...getAllDaySegmentProps(segment)}>
                            <AllDayEvent event={segment.event} title={segment.title} />
                          </EventButton>
                        ))}
                        {group.allDay.extra !== null && (
                          <ShowMore
                            count={group.allDay.extra.count}
                            label={hdrMessages.showMore(group.allDay.extra.count)}
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
                    <div
                      className="bc-allday-slot"
                      data-date={group.columns[0]?.day}
                      data-bc-allday={group.columns[0]?.day}
                      data-slot-index={0}
                      aria-describedby={allDayDescribedBy}
                    />
                    <div className="bc-allday-resource-stack">
                      {group.allDay.segments.map((segment) => (
                        <EventButton key={segment.key} {...getStackedSegmentProps(segment)}>
                          <AllDayEvent event={segment.event} title={segment.title} />
                        </EventButton>
                      ))}
                      {group.allDay.extra !== null && (
                        <ShowMore
                          count={group.allDay.extra.count}
                          label={hdrMessages.showMore(group.allDay.extra.count)}
                          events={group.allDay.extra.events}
                        />
                      )}
                    </div>
                  </div>
                ))}
          </div>
        </div>

        <div {...resourceBody}>
          <div className="bc-time-gutter">
            {grid.gutter.map((label) => (
              <TimeLabel key={label.key} time={label.time} label={label.label} />
            ))}
          </div>
          {groups.flatMap((group) =>
            group.columns.map((column) => {
              const colProps = getColumnProps(column)
              const nowProps = getNowIndicatorProps(column)
              const selBox = getResourceSelectionBox(group.resourceId, column.day)
              return (
                <div key={column.key} {...colProps} data-bc-resource={String(group.resourceId)}>
                  <div className="bc-time-slots">
                    {Array.from({ length: grid.slotCount }, (_, slotIndex) => (
                      <div
                        key={slotIndex}
                        {...getResourceSlotProps(column.day, slotIndex, column.slots[slotIndex] ?? '')}
                      />
                    ))}
                  </div>
                  {column.backgroundEvents.map((bg) => (
                    <div key={bg.key} {...getBgEventProps(bg)} />
                  ))}
                  {column.events.map((event) => (
                    <EventButton key={event.key} {...getEventProps(event)}>
                      <EventSlot event={event.event} title={event.title} time={event.time} />
                    </EventButton>
                  ))}
                  {nowProps && <div {...nowProps} />}
                  {selBox && <div className="bc-selection" style={selectionStyle(selBox)} />}
                </div>
              )
            }),
          )}
        </div>
      </div>
    )
  }

  // ── plain grid ────────────────────────────────────────────────────────────
  return (
    <div
      className="bc-time-grid"
      style={getRootStyle(grid.headings.length)}
      {...root}
    >
      <div className="bc-sr-only" role="status" aria-live="polite">
        {announcement}
      </div>
      <div className="bc-time-header">
        <div className="bc-time-header-gutter" aria-hidden="true" />
        {grid.headings.map((heading) => (
          <DayHeading key={heading.day} {...getHeadingProps(heading)} />
        ))}
      </div>

      <div className="bc-allday-row" {...allDayRow}>
        <div className="bc-allday-label">{hdrMessages.allDay}</div>
        <div className="bc-allday-slots">
          {grid.columns.map((column, colIndex) => (
            <div key={column.key} {...getAllDaySlotProps(column, colIndex)} />
          ))}
        </div>
        {allDaySelectionBand && (
          <div className="bc-allday-selection">
            <div {...allDaySelectionBand} />
          </div>
        )}
        <div className="bc-allday-segments">
          {grid.allDay.segments.map((segment) => (
            <EventButton key={segment.key} {...getAllDaySegmentProps(segment)}>
              <AllDayEvent event={segment.event} title={segment.title} />
            </EventButton>
          ))}
          {grid.allDay.extra !== null && (
            <ShowMore
              count={grid.allDay.extra.count}
              label={hdrMessages.showMore(grid.allDay.extra.count)}
              events={grid.allDay.extra.events}
            />
          )}
        </div>
      </div>

      <div {...bodyRoot}>
        <div className="bc-time-gutter">
          {grid.gutter.map((label) => (
            <TimeLabel key={label.key} time={label.time} label={label.label} />
          ))}
        </div>
        {grid.columns.map((column, colIndex) => {
          const colProps = getColumnProps(column)
          const nowProps = getNowIndicatorProps(column)
          const selBox = getTimeSelectionBox(colIndex)
          const prevBox = getPreviewBox(column)
          return (
            <div key={column.key} {...colProps}>
              <div className="bc-time-slots">
                {Array.from({ length: grid.slotCount }, (_, slotIndex) => (
                  <div key={slotIndex} {...getSlotProps(column, colIndex, slotIndex)} />
                ))}
              </div>
              {column.backgroundEvents.map((bg) => (
                <div key={bg.key} {...getBgEventProps(bg)} />
              ))}
              {column.events.map((event) => (
                <EventButton key={event.key} {...getEventProps(event)}>
                  <EventSlot event={event.event} title={event.title} time={event.time} />
                </EventButton>
              ))}
              {nowProps && <div {...nowProps} />}
              {selBox && <div className="bc-selection" style={selectionStyle(selBox)} />}
              {prevBox && <div className="bc-drag-preview" style={selectionStyle(prevBox)} />}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default TimeGridView
