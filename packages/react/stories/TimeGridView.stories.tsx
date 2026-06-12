import { Views } from '@big-calendar/core'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useRef, useState } from 'react'
import { CalendarProvider, TimeGridView, Toolbar, useCalendarDnd } from '../src'
import { CalendarStage, FOCUS, localizer, NOW, SelectionDemo } from './harness'
import type { DemoEvent } from './demoEvents'
import { demoEvents } from './demoEvents'

const meta: Meta<typeof TimeGridView> = {
  title: 'React/Views/TimeGridView',
  component: TimeGridView,
  parameters: {
    docs: {
      description: {
        component:
          'Time grid shared by the day / week / work-week views: a scrollable slot body with positioned event boxes, an all-day row, and a now-indicator. Renders under any `time`-kind view.',
      },
    },
  },
}
export default meta

type Story = StoryObj<typeof TimeGridView>

const TIME_VIEWS = [Views.WEEK, Views.WORK_WEEK, Views.DAY]

const render = (defaultView: (typeof Views)[keyof typeof Views]) => () => (
  <CalendarStage defaultView={defaultView} views={TIME_VIEWS}>
    <Toolbar />
    <div className="bc-calendar">
      <TimeGridView />
    </div>
  </CalendarStage>
)

export const Week: Story = { render: render(Views.WEEK) }
export const WorkWeek: Story = { render: render(Views.WORK_WEEK) }
export const Day: Story = { render: render(Views.DAY) }

/** A resource. */
interface Room {
  id: string
  title: string
}

// A wide roster on purpose, so the day view (one column per resource) and the
// week view (resource × day) both overflow and exercise horizontal scrolling.
const rooms: Room[] = [
  { id: 'board', title: 'Board room' },
  { id: 'training', title: 'Training room' },
  { id: 'mtg1', title: 'Meeting room 1' },
  { id: 'mtg2', title: 'Meeting room 2' },
  { id: 'mtg3', title: 'Meeting room 3' },
  { id: 'mtg4', title: 'Meeting room 4' },
  { id: 'exec', title: 'Executive suite' },
  { id: 'lab', title: 'Innovation lab' },
  { id: 'studio', title: 'Recording studio' },
  { id: 'annex', title: 'Annex hall' },
]

/**
 * Day view split into one column per **resource** (rooms here). Supplying a
 * `resources` array automatically swaps the day view to its resource layout: a
 * single-tier title header, a per-resource all-day lane, and one time column per
 * resource. Each event lands in its resource's column via the `resource`
 * accessor (here `resourceId`). Columns get a min width and the grid scrolls
 * horizontally when they overflow.
 */
export const DayWithResources: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateRows: 'auto 1fr', blockSize: 800, inlineSize: '100%' }}>
      <CalendarProvider<DemoEvent>
        localizer={localizer}
        getNow={() => NOW}
        events={demoEvents}
        resources={rooms}
        defaultDate={FOCUS}
        defaultView={Views.DAY}
        views={TIME_VIEWS}
      >
        <Toolbar />
        <div className="bc-calendar">
          <TimeGridView />
        </div>
      </CalendarProvider>
    </div>
  ),
}

/**
 * Week view with resources. Each resource gets a **two-tier** header — its title
 * spanning that resource's seven day columns, with the day names beneath — and a
 * multi-day all-day lane scoped to its own days. The day columns are laid out in
 * **resource-major** order (all of one resource's days, then the next resource).
 * Events route to their resource via the `resource` accessor (here `resourceId`),
 * and the grid scrolls horizontally as the resource count grows.
 */
export const WeekWithResources: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateRows: 'auto 1fr', blockSize: 800, inlineSize: '100%' }}>
      <CalendarProvider<DemoEvent>
        localizer={localizer}
        getNow={() => NOW}
        events={demoEvents}
        resources={rooms}
        defaultDate={FOCUS}
        defaultView={Views.WEEK}
        views={TIME_VIEWS}
      >
        <Toolbar />
        <div className="bc-calendar">
          <TimeGridView />
        </div>
      </CalendarProvider>
    </div>
  ),
}

/**
 * Week view with resources in **day-major** order (`resourceLayout="day"`).
 * The header has two tiers: **day names on row 1**, each spanning its resource
 * columns, and **resource names beneath on row 2**. The body columns are laid
 * out day-first — all resources for Monday, then all resources for Tuesday,
 * and so on — which lets you compare every room's availability within a single
 * day at a glance. Each all-day lane is scoped to its own (day × resource)
 * cell. Switch to the `WeekWithResources` story to compare resource-major order.
 */
export const WeekWithResourcesDayMajor: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateRows: 'auto 1fr', blockSize: 800, inlineSize: '100%' }}>
      <CalendarProvider<DemoEvent>
        localizer={localizer}
        getNow={() => NOW}
        events={demoEvents}
        resources={rooms}
        resourceLayout="day"
        defaultDate={FOCUS}
        defaultView={Views.WEEK}
        views={TIME_VIEWS}
      >
        <Toolbar />
        <div className="bc-calendar">
          <TimeGridView />
        </div>
      </CalendarProvider>
    </div>
  ),
}

/**
 * `selectable` on. Drag down a column to select a time range, click or
 * double-click a slot, or click a timed/all-day event. Each gesture's payload
 * (ISO `start`/`end`/`slots` + `action`) shows in the read-out below the grid.
 */
export const Selectable: Story = {
  render: () => (
    <SelectionDemo defaultView={Views.WEEK} views={TIME_VIEWS}>
      <Toolbar />
      <div className="bc-calendar">
        <TimeGridView />
      </div>
    </SelectionDemo>
  ),
}

function PromotionGrid() {
  const ref = useRef<HTMLDivElement>(null)
  useCalendarDnd(ref)
  return (
    <div ref={ref} style={{ display: 'contents' }}>
      <Toolbar />
      <div className="bc-calendar">
        <TimeGridView />
      </div>
    </div>
  )
}

function PromotionDemo() {
  const [events, setEvents] = useState<DemoEvent[]>(demoEvents)
  return (
    <CalendarStage>
      <CalendarProvider<DemoEvent>
        localizer={localizer}
        getNow={() => NOW}
        events={events}
        defaultDate={FOCUS}
        defaultView={Views.WEEK}
        views={TIME_VIEWS}
        onEventDrop={({ event, start, end, allDay }) => {
          setEvents((prev) =>
            prev.map((e) => (e.id === event.id ? { ...e, start, end, allDay } : e)),
          )
        }}
      >
        <PromotionGrid />
      </CalendarProvider>
    </CalendarStage>
  )
}

/**
 * Drag any **timed** event from the time grid and drop it onto the **all-day row**
 * (the row above the time slots). The event becomes a whole-day event on that day:
 * `onEventDrop` fires with `allDay: true`. All-day events cannot be dragged down
 * into the time grid (one-way promotion only).
 */
export const TimedToAllDayPromotion: Story = {
  render: () => <PromotionDemo />,
}

/**
 * Background events appear **behind** timed events in the time grid. They use no
 * click or drag handlers — pointer events pass straight through to the slots and
 * events underneath, so slot selection still works anywhere on their surface.
 *
 * Key behaviours to observe here:
 * - A single-day background event has **both** top and bottom corners rounded
 *   (`bc-bg-event--start` + `bc-bg-event--end`).
 * - A multi-day background event is **clipped at midnight** on each column
 *   boundary: the start column has top corners rounded only (`--start`), the
 *   end column has bottom corners rounded only (`--end`), and middle columns
 *   have no rounding.
 * - Regular events (blue boxes) are always drawn **on top** of background events.
 * - Slot selection passes through — try clicking or dragging across any of the
 *   coloured background regions.
 */
export const BackgroundEvents: Story = {
  render: () => (
    <CalendarStage
      defaultView={Views.WEEK}
      views={TIME_VIEWS}
      backgroundEvents={[
        // Single-day: Mon Jun 15, top & bottom rounded.
        { id: 1001, title: 'Deep work', start: '2026-06-15T09:00:00.000Z', end: '2026-06-15T12:00:00.000Z' },
        // Multi-day: Tue Jun 16 → Thu Jun 18. Start column (Tue) gets top rounding,
        // end column (Thu) gets bottom rounding, Wed column has none.
        { id: 1002, title: 'Sprint focus', start: '2026-06-16T09:00:00.000Z', end: '2026-06-18T17:00:00.000Z' },
        // Single-day: Fri Jun 19 afternoon, both corners rounded.
        { id: 1003, title: 'Review window', start: '2026-06-19T13:00:00.000Z', end: '2026-06-19T17:00:00.000Z' },
      ] as DemoEvent[]}
    >
      <Toolbar />
      <div className="bc-calendar">
        <TimeGridView />
      </div>
    </CalendarStage>
  ),
}

/**
 * Two background events that **overlap** on the same day are placed side by side
 * using the same layout algorithm as regular timed events — each gets a fraction
 * of the column width. Switch to the **Day** view and navigate to Monday Jun 15
 * to see them clearly side by side. The foreground event (blue) still renders
 * on top of both.
 */
export const OverlappingBackgroundEvents: Story = {
  render: () => (
    <CalendarStage
      defaultView={Views.DAY}
      views={TIME_VIEWS}
      backgroundEvents={[
        // These two blocks overlap 11:00–13:00 on Mon Jun 15, forcing side-by-side layout.
        { id: 1004, title: 'Focus block A', start: '2026-06-15T09:00:00.000Z', end: '2026-06-15T13:00:00.000Z' },
        { id: 1005, title: 'Focus block B', start: '2026-06-15T11:00:00.000Z', end: '2026-06-15T15:00:00.000Z' },
      ] as DemoEvent[]}
    >
      <Toolbar />
      <div className="bc-calendar">
        <TimeGridView />
      </div>
    </CalendarStage>
  ),
}
