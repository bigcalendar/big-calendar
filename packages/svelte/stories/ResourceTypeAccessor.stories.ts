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
import { Views } from '@big-calendar/core'
import type { Meta, StoryObj } from '@storybook/svelte-vite'
import { demoEvents, FOCUS, NOW } from './harness'
import CalendarStory from './CalendarStory.svelte'

// ─── Resource definitions ─────────────────────────────────────────────────────

type RoomType = 'conference' | 'training' | 'meeting' | 'executive'

interface Room {
  id: string
  title: string
  resourceType: RoomType
}

const rooms: Room[] = [
  { id: 'board',    title: 'Board room',      resourceType: 'conference' },
  { id: 'training', title: 'Training room',   resourceType: 'training'   },
  { id: 'mtg1',     title: 'Meeting room 1',  resourceType: 'meeting'    },
  { id: 'mtg2',     title: 'Meeting room 2',  resourceType: 'meeting'    },
  { id: 'mtg3',     title: 'Meeting room 3',  resourceType: 'meeting'    },
  { id: 'exec',     title: 'Executive suite', resourceType: 'executive'  },
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

if (typeof document !== 'undefined') {
  const el = document.createElement('style')
  el.textContent = TYPE_STYLES_CSS
  document.head.appendChild(el)
}

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta = { title: 'Resources/Resource Type Accessor' }
export default meta
type Story = StoryObj<typeof meta>

// ─── Stories ─────────────────────────────────────────────────────────────────

/**
 * Each resource occupies its own column within the single day. Lane backgrounds
 * reflect `resourceType` — conference rooms in blue, training in green,
 * meeting rooms in yellow, and the executive suite in purple.
 */
export const DayView: Story = {
  name: 'Day View — Resource Lane Colours',
  render: () => ({
    Component: CalendarStory,
    props: {
      events: demoEvents,
      defaultDate: FOCUS,
      getNow: () => NOW,
      defaultView: Views.DAY,
      views: [Views.DAY],
      resources: rooms,
      accessors: { resourceType: 'resourceType' },
    },
  }),
}

/**
 * Resources share each day column. The `resourceType` lane colour is visible
 * in the all-day strip (`bc-allday-resource`) and in the day column backgrounds
 * when there is only one resource per column (`data-bc-resource-type` on
 * `.bc-day-column`).
 */
export const WeekView: Story = {
  name: 'Week View — Resource Lane Colours',
  render: () => ({
    Component: CalendarStory,
    props: {
      events: demoEvents,
      defaultDate: FOCUS,
      getNow: () => NOW,
      defaultView: Views.WEEK,
      views: [Views.WEEK],
      resources: rooms,
      accessors: { resourceType: 'resourceType' },
    },
  }),
}

/**
 * `resourceLayout="day"` makes resources the outer (major) columns and nests
 * days inside each resource. The full week of every room is visible at once,
 * making cross-resource comparisons straightforward.
 */
export const DayMajorView: Story = {
  name: 'Day-Major Week — Resource Lane Colours',
  render: () => ({
    Component: CalendarStory,
    props: {
      events: demoEvents,
      defaultDate: FOCUS,
      getNow: () => NOW,
      defaultView: Views.WEEK,
      views: [Views.WEEK],
      resources: rooms,
      resourceLayout: 'day',
      accessors: { resourceType: 'resourceType' },
    },
  }),
}
