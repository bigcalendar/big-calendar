import { Views } from '@big-calendar/core'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Calendar, CalendarProvider } from '../src'
import type { DemoEvent } from './demoEvents'
import { demoEvents } from './demoEvents'
import { localizer, NOW, FOCUS } from './harness'

/**
 * Demonstrates the `resourceType` accessor: assign a type string to each
 * resource object, configure `accessors={{ resourceType: 'resourceType' }}`
 * (the default field name), then target the rendered `data-bc-resource-type`
 * attribute with CSS to colour each lane.
 *
 * The selector pattern is:
 *   `.bc-day-column[data-bc-resource-type="conference"] { background-color: …; }`
 *
 * Because `data-bc-resource-type` sits directly on the `.bc-day-column` element,
 * no `:has()` indirection is needed — you can target the column background
 * straight from the attribute selector.
 */

// ─── Resource definitions ─────────────────────────────────────────────────────

type RoomType = 'conference' | 'training' | 'meeting' | 'executive'

interface Room {
  id: string
  title: string
  resourceType: RoomType
}

const rooms: Room[] = [
  { id: 'board',    title: 'Board room',       resourceType: 'conference' },
  { id: 'training', title: 'Training room',    resourceType: 'training'   },
  { id: 'mtg1',     title: 'Meeting room 1',   resourceType: 'meeting'    },
  { id: 'mtg2',     title: 'Meeting room 2',   resourceType: 'meeting'    },
  { id: 'mtg3',     title: 'Meeting room 3',   resourceType: 'meeting'    },
  { id: 'exec',     title: 'Executive suite',  resourceType: 'executive'  },
]

// ─── Colour palette ───────────────────────────────────────────────────────────

const TYPE_COLORS: Record<RoomType, string> = {
  conference: '#d4e8f5',
  training:   '#d4f5e8',
  meeting:    '#f5f0d4',
  executive:  '#ead4f5',
}

const ROOM_TYPES: RoomType[] = ['conference', 'training', 'meeting', 'executive']

const TYPE_STYLES_CSS = ROOM_TYPES.map(
  (type) => [
    `.bc-day-column[data-bc-resource-type="${type}"]:not(.bc-today) { background-color: ${TYPE_COLORS[type]}; }`,
    `.bc-allday-resource[data-bc-resource-type="${type}"]:not(.bc-today) { background-color: ${TYPE_COLORS[type]}; }`,
    `.bc-day-column[data-bc-resource-type="${type}"].bc-today,`,
    `.bc-allday-resource[data-bc-resource-type="${type}"].bc-today {`,
    `  --bc-color-today-bg: color-mix(in oklab, ${TYPE_COLORS[type]}, CanvasText 5%);`,
    `  background-color: var(--bc-color-today-bg);`,
    `}`,
  ].join('\n'),
).join('\n')

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta = { title: 'Resources/Resource Type Accessor' }
export default meta
type Story = StoryObj<typeof meta>

// ─── Stories ─────────────────────────────────────────────────────────────────

export const DayView: Story = {
  render: () => (
    <>
      <style>{TYPE_STYLES_CSS}</style>
      <CalendarProvider<DemoEvent, Room>
        localizer={localizer}
        getNow={() => NOW}
        defaultDate={FOCUS}
        defaultView={Views.DAY}
        views={[Views.DAY]}
        events={demoEvents}
        resources={rooms}
      >
        <Calendar />
      </CalendarProvider>
    </>
  ),
}
DayView.storyName = 'Day View — Resource Lane Colours'

export const WeekView: Story = {
  render: () => (
    <>
      <style>{TYPE_STYLES_CSS}</style>
      <CalendarProvider<DemoEvent, Room>
        localizer={localizer}
        getNow={() => NOW}
        defaultDate={FOCUS}
        defaultView={Views.WEEK}
        views={[Views.WEEK]}
        events={demoEvents}
        resources={rooms}
      >
        <Calendar />
      </CalendarProvider>
    </>
  ),
}
WeekView.storyName = 'Week View — Resource Lane Colours'

export const DayMajorView: Story = {
  render: () => (
    <>
      <style>{TYPE_STYLES_CSS}</style>
      <CalendarProvider<DemoEvent, Room>
        localizer={localizer}
        getNow={() => NOW}
        defaultDate={FOCUS}
        defaultView={Views.WEEK}
        views={[Views.WEEK]}
        events={demoEvents}
        resources={rooms}
        resourceLayout="day"
      >
        <Calendar />
      </CalendarProvider>
    </>
  ),
}
DayMajorView.storyName = 'Day-Major Week — Resource Lane Colours'
