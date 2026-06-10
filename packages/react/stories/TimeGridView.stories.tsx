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
