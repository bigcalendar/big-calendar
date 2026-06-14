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
  const { grid, announcement, announcer, root, getRootStyle, header, body } = useTimeGridView<TEvent>()

  if (grid === null) return null

  const {
    components: { DayHeading, AllDayEvent, ShowMore },
    messages: hdrMessages,
    drilldown,
    timeHead,
    timeHeader,
    timeHeaderGutter,
    allDayLabel,
    allDaySlots,
    allDaySegments,
    allDaySelectionWrapper,
    resourceHeaderLabel,
    allDayResourceStack,
    resourceSingleHead,
    allDayRow,
    resourceAllDayRow,
    getHeadingProps,
    getAllDaySlotProps,
    getResourceAllDaySlotProps,
    allDaySelectionBand,
    getAllDaySegmentProps,
    getStackedSegmentProps,
    getDayMajorHeadingCellProps,
    getDayMajorResourceCellProps,
    getDayMajorAllDayResourceProps,
    getResourceGroupTitleProps,
    getResourceDayHeadProps,
    getResourceWeekAllDayProps,
    getResourceWeekAllDaySlotsContainerProps,
    getResourceWeekAllDaySegmentsContainerProps,
    getResourceDayAllDayProps,
  } = header

  const {
    components: { TimeLabel, EventSlot, BgEventSlot },
    body: bodyRoot,
    resourceBody,
    gutter,
    timeSlotsContainer,
    getColumnProps,
    getSlotProps,
    getResourceSlotProps,
    getTimeSelectionDivProps,
    getResourceSelectionDivProps,
    getPreviewDivProps,
    getBgEventProps,
    getEventProps,
    bodyNowIndicatorProps,
  } = body

  // ── day-major resource grid ───────────────────────────────────────────────
  if (grid.dayGroups !== null) {
    const dayGroupsList = grid.dayGroups
    const numResources = dayGroupsList[0]?.cells.length ?? 0
    const leafCount = dayGroupsList.length * numResources

    return (
      <div style={getRootStyle(leafCount)} {...root}>
        <div {...announcer}>{announcement}</div>

        <div {...timeHead}>
          <div {...timeHeader}>
            <div {...timeHeaderGutter} />
            {dayGroupsList.flatMap((dayGroup, di) => [
              <div
                key={`${dayGroup.key}-day`}
                {...getDayMajorHeadingCellProps(di)}
              >
                <DayHeading
                  {...getHeadingProps({ day: dayGroup.date, label: dayGroup.label, isToday: dayGroup.isToday })}
                />
              </div>,
              ...dayGroup.cells.map((cell, ri) => (
                <div key={cell.key} {...getDayMajorResourceCellProps(di, ri)}>
                  <span {...resourceHeaderLabel}>{cell.resourceTitle}</span>
                </div>
              )),
            ])}
          </div>

          <div {...resourceAllDayRow}>
            <div {...allDayLabel}>{hdrMessages.allDay}</div>
            {dayGroupsList.flatMap((dayGroup, di) =>
              dayGroup.cells.map((cell) => (
                <div
                  key={cell.key}
                  {...getDayMajorAllDayResourceProps(dayGroup.isToday, cell.resourceId)}
                >
                  <div {...getResourceAllDaySlotProps(dayGroup.date, di)} />
                  <div {...allDayResourceStack}>
                    {cell.allDay.segments.map((segment) => (
                      <EventButton key={segment.key} {...getStackedSegmentProps(segment)}>
                        <AllDayEvent event={segment.event} title={segment.title} />
                      </EventButton>
                    ))}
                    {cell.allDay.extra !== null && cell.allDay.extra.map((item) => (
                      <ShowMore
                        key={`extra-${item.col}`}
                        count={item.count}
                        label={hdrMessages.showMore(item.count)}
                        events={item.events}
                        EventSlot={AllDayEvent}
                      />
                    ))}
                  </div>
                </div>
              )),
            )}
          </div>
        </div>

        <div {...resourceBody}>
          <div {...gutter}>
            {grid.gutter.map((label) => (
              <TimeLabel key={label.key} time={label.time} label={label.label} />
            ))}
          </div>
          {dayGroupsList.flatMap((dayGroup) =>
            dayGroup.cells.map((cell) => {
              const colProps = getColumnProps(cell.column)
              const selDiv = getResourceSelectionDivProps(cell.resourceId, dayGroup.date)
              const prevDiv = getPreviewDivProps(cell.column)
              return (
                <div
                  key={cell.column.key}
                  {...colProps}
                  data-bc-resource={String(cell.resourceId)}
                >
                  <div {...timeSlotsContainer}>
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
                    <div key={bg.key} {...getBgEventProps(bg)}>
                      <BgEventSlot event={bg.event} title={bg.title} />
                    </div>
                  ))}
                  {cell.column.events.map((event) => (
                    <EventButton key={event.key} {...getEventProps(event)}>
                      <EventSlot event={event.event} title={event.title} time={event.time} />
                    </EventButton>
                  ))}
                  {selDiv && <div {...selDiv} />}
                  {prevDiv && <div {...prevDiv} />}
                </div>
              )
            }),
          )}
          {bodyNowIndicatorProps && <div {...bodyNowIndicatorProps} />}
        </div>
      </div>
    )
  }

  // ── resource-major grid ───────────────────────────────────────────────────
  if (grid.resources !== null) {
    const groups = grid.resources
    const leafCount = groups.reduce((n, g) => n + g.columns.length, 0)
    const isWeek = grid.headings.length > 1

    return (
      <div style={getRootStyle(leafCount)} {...root}>
        <div {...announcer}>{announcement}</div>

        <div {...timeHead}>
          <div {...timeHeader}>
            <div {...timeHeaderGutter} />
            {isWeek
              ? groups.flatMap((group, gi) => [
                  <div key={`${group.key}-title`} {...getResourceGroupTitleProps(gi)}>
                    {group.resourceTitle}
                  </div>,
                  ...group.columns.map((column, di) => (
                    <div key={`${column.key}-head`} {...getResourceDayHeadProps(gi, di)}>
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
                  <div key={group.key} {...resourceSingleHead}>
                    {group.resourceTitle}
                  </div>
                ))}
          </div>

          <div {...resourceAllDayRow}>
            <div {...allDayLabel}>{hdrMessages.allDay}</div>
            {isWeek
              ? groups.map((group, gi) => (
                  <div
                    key={group.key}
                    {...getResourceWeekAllDayProps(gi, group.resourceId)}
                  >
                    <div {...getResourceWeekAllDaySlotsContainerProps()}>
                      {group.columns.map((column, di) => (
                        <div key={column.key} {...getResourceAllDaySlotProps(column.day, di, column.isToday)} />
                      ))}
                    </div>
                    <div {...getResourceWeekAllDaySegmentsContainerProps()}>
                      {group.allDay.segments.map((segment) => (
                        <EventButton key={segment.key} {...getAllDaySegmentProps(segment)}>
                          <AllDayEvent event={segment.event} title={segment.title} />
                        </EventButton>
                      ))}
                      {group.allDay.extra !== null && group.allDay.extra.map((item) => (
                        <div key={`extra-${item.col}`} style={{ gridColumn: item.col, position: 'relative', pointerEvents: 'none' }}>
                          <ShowMore
                            count={item.count}
                            label={hdrMessages.showMore(item.count)}
                            events={item.events}
                            EventSlot={AllDayEvent}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              : groups.map((group) => (
                  <div
                    key={group.key}
                    {...getResourceDayAllDayProps(group.columns[0]?.isToday ?? false, group.resourceId)}
                  >
                    <div
                      {...getResourceAllDaySlotProps(group.columns[0]?.day ?? '', 0)}
                    />
                    <div {...allDayResourceStack}>
                      {group.allDay.segments.map((segment) => (
                        <EventButton key={segment.key} {...getStackedSegmentProps(segment)}>
                          <AllDayEvent event={segment.event} title={segment.title} />
                        </EventButton>
                      ))}
                      {group.allDay.extra !== null && group.allDay.extra.map((item) => (
                        <ShowMore
                          key={`extra-${item.col}`}
                          count={item.count}
                          label={hdrMessages.showMore(item.count)}
                          events={item.events}
                          EventSlot={AllDayEvent}
                        />
                      ))}
                    </div>
                  </div>
                ))}
          </div>
        </div>

        <div {...resourceBody}>
          <div {...gutter}>
            {grid.gutter.map((label) => (
              <TimeLabel key={label.key} time={label.time} label={label.label} />
            ))}
          </div>
          {groups.flatMap((group) =>
            group.columns.map((column) => {
              const colProps = getColumnProps(column)
              const selDiv = getResourceSelectionDivProps(group.resourceId, column.day)
              return (
                <div key={column.key} {...colProps} data-bc-resource={String(group.resourceId)}>
                  <div {...timeSlotsContainer}>
                    {Array.from({ length: grid.slotCount }, (_, slotIndex) => (
                      <div
                        key={slotIndex}
                        {...getResourceSlotProps(column.day, slotIndex, column.slots[slotIndex] ?? '')}
                      />
                    ))}
                  </div>
                  {column.backgroundEvents.map((bg) => (
                    <div key={bg.key} {...getBgEventProps(bg)}>
                      <BgEventSlot event={bg.event} title={bg.title} />
                    </div>
                  ))}
                  {column.events.map((event) => (
                    <EventButton key={event.key} {...getEventProps(event)}>
                      <EventSlot event={event.event} title={event.title} time={event.time} />
                    </EventButton>
                  ))}
                  {selDiv && <div {...selDiv} />}
                </div>
              )
            }),
          )}
          {bodyNowIndicatorProps && <div {...bodyNowIndicatorProps} />}
        </div>
      </div>
    )
  }

  // ── plain grid ────────────────────────────────────────────────────────────
  return (
    <div style={getRootStyle(grid.headings.length)} {...root}>
      <div {...announcer}>{announcement}</div>
      <div {...timeHead}>
        <div {...timeHeader}>
          <div {...timeHeaderGutter} />
          {grid.headings.map((heading) => (
            <DayHeading key={heading.day} {...getHeadingProps(heading)} />
          ))}
        </div>

        <div {...allDayRow}>
          <div {...allDayLabel}>{hdrMessages.allDay}</div>
          <div {...allDaySlots}>
            {grid.columns.map((column, colIndex) => (
              <div key={column.key} {...getAllDaySlotProps(column, colIndex)} />
            ))}
          </div>
          {allDaySelectionBand && (
            <div {...allDaySelectionWrapper}>
              <div {...allDaySelectionBand} />
            </div>
          )}
          <div {...allDaySegments}>
            {grid.allDay.segments.map((segment) => (
              <EventButton key={segment.key} {...getAllDaySegmentProps(segment)}>
                <AllDayEvent event={segment.event} title={segment.title} />
              </EventButton>
            ))}
            {grid.allDay.extra !== null && grid.allDay.extra.map((item) => (
              <div key={`extra-${item.col}`} style={{ gridColumn: item.col, position: 'relative', pointerEvents: 'none' }}>
                <ShowMore
                  count={item.count}
                  label={hdrMessages.showMore(item.count)}
                  events={item.events}
                  EventSlot={AllDayEvent}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div {...bodyRoot}>
        <div {...gutter}>
          {grid.gutter.map((label) => (
            <TimeLabel key={label.key} time={label.time} label={label.label} />
          ))}
        </div>
        {grid.columns.map((column, colIndex) => {
          const colProps = getColumnProps(column)
          const selDiv = getTimeSelectionDivProps(colIndex)
          const prevDiv = getPreviewDivProps(column)
          return (
            <div key={column.key} {...colProps}>
              <div {...timeSlotsContainer}>
                {Array.from({ length: grid.slotCount }, (_, slotIndex) => (
                  <div key={slotIndex} {...getSlotProps(column, colIndex, slotIndex)} />
                ))}
              </div>
              {column.backgroundEvents.map((bg) => (
                <div key={bg.key} {...getBgEventProps(bg)}>
                  <BgEventSlot event={bg.event} title={bg.title} />
                </div>
              ))}
              {column.events.map((event) => (
                <EventButton key={event.key} {...getEventProps(event)}>
                  <EventSlot event={event.event} title={event.title} time={event.time} />
                </EventButton>
              ))}
              {selDiv && <div {...selDiv} />}
              {prevDiv && <div {...prevDiv} />}
            </div>
          )
        })}
        {bodyNowIndicatorProps && <div {...bodyNowIndicatorProps} />}
      </div>
    </div>
  )
}

export default TimeGridView
