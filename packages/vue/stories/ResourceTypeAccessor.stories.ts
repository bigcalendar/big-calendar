/**
 * Demonstrates the `resourceType` accessor: assign a type string to each
 * resource object, configure `:accessors="{ resourceType: 'resourceType' }"`
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
import { onBeforeUnmount } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3-vite'
import Calendar from '../src/Calendar/Calendar.vue'
import CalendarProvider from '../src/CalendarProvider/CalendarProvider.vue'
import { demoEvents } from './demoEvents'
import { localizer, NOW, FOCUS } from './harness'

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

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta = { title: 'Resources/Resource Type Accessor' }
export default meta
type Story = StoryObj<typeof meta>

// ─── Stories ─────────────────────────────────────────────────────────────────

export const DayView: Story = {
  name: 'Day View — Resource Lane Colours',
  render: () => ({
    components: { CalendarProvider, Calendar },
    setup() {
      const getNow = () => NOW
      const styleEl = document.createElement('style')
      styleEl.textContent = TYPE_STYLES_CSS
      document.head.appendChild(styleEl)
      onBeforeUnmount(() => document.head.removeChild(styleEl))
      return { localizer, events: demoEvents, FOCUS, getNow, rooms, Views }
    },
    template: `
      <div style="block-size:100dvh;inline-size:100%">
        <CalendarProvider
          :localizer="localizer"
          :events="events"
          :defaultDate="FOCUS"
          :getNow="getNow"
          :defaultView="Views.DAY"
          :views="[Views.DAY]"
          :resources="rooms"
        >
          <Calendar />
        </CalendarProvider>
      </div>
    `,
  }),
}

export const WeekView: Story = {
  name: 'Week View — Resource Lane Colours',
  render: () => ({
    components: { CalendarProvider, Calendar },
    setup() {
      const getNow = () => NOW
      const styleEl = document.createElement('style')
      styleEl.textContent = TYPE_STYLES_CSS
      document.head.appendChild(styleEl)
      onBeforeUnmount(() => document.head.removeChild(styleEl))
      return { localizer, events: demoEvents, FOCUS, getNow, rooms, Views }
    },
    template: `
      <div style="block-size:100dvh;inline-size:100%">
        <CalendarProvider
          :localizer="localizer"
          :events="events"
          :defaultDate="FOCUS"
          :getNow="getNow"
          :defaultView="Views.WEEK"
          :views="[Views.WEEK]"
          :resources="rooms"
        >
          <Calendar />
        </CalendarProvider>
      </div>
    `,
  }),
}

export const DayMajorView: Story = {
  name: 'Day-Major Week — Resource Lane Colours',
  render: () => ({
    components: { CalendarProvider, Calendar },
    setup() {
      const getNow = () => NOW
      const styleEl = document.createElement('style')
      styleEl.textContent = TYPE_STYLES_CSS
      document.head.appendChild(styleEl)
      onBeforeUnmount(() => document.head.removeChild(styleEl))
      return { localizer, events: demoEvents, FOCUS, getNow, rooms, Views }
    },
    template: `
      <div style="block-size:100dvh;inline-size:100%">
        <CalendarProvider
          :localizer="localizer"
          :events="events"
          :defaultDate="FOCUS"
          :getNow="getNow"
          :defaultView="Views.WEEK"
          :views="[Views.WEEK]"
          :resources="rooms"
          resourceLayout="day"
        >
          <Calendar />
        </CalendarProvider>
      </div>
    `,
  }),
}
