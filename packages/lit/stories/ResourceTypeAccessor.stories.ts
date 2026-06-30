/**
 * Demonstrates the `resourceType` accessor: assign a type string to each
 * resource object, configure `.accessors=${{ resourceType: 'resourceType' }}`
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
import { html } from 'lit'
import { Views } from '@big-calendar/core'
import type { Meta, StoryObj } from '@storybook/web-components-vite'
import '@big-calendar/lit'
import { demoEvents } from './demoEvents'
import { litLocalizer, NOW, FOCUS } from './harness'

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

function injectStyles(): HTMLStyleElement {
  const el = document.createElement('style')
  el.textContent = TYPE_STYLES_CSS
  document.head.appendChild(el)
  return el
}

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta = { title: 'Resources/Resource Type Accessor' }
export default meta
type Story = StoryObj<typeof meta>

// ─── Stories ─────────────────────────────────────────────────────────────────

function makeCalendarEl(defaultView: string, views: string[]) {
  const styleEl = injectStyles()

  const calEl = document.createElement('bc-calendar') as HTMLElement & Record<string, unknown>
  calEl.style.cssText = 'display:block;block-size:100dvh;inline-size:100%'
  calEl.localizer = litLocalizer.current
  calEl.events = demoEvents
  calEl.defaultDate = FOCUS
  calEl.getNow = () => NOW
  calEl.defaultView = defaultView
  calEl.views = views
  calEl.resources = rooms

  window.addEventListener('bc-localizer-change', () => {
    calEl.localizer = litLocalizer.current
  })

  calEl.innerHTML = `
    <bc-default-toolbar></bc-default-toolbar>
    <bc-month-view></bc-month-view>
    <bc-time-grid-view></bc-time-grid-view>
    <bc-agenda-view></bc-agenda-view>
  `

  const wrapper = document.createElement('div')
  wrapper.style.cssText = 'block-size:100dvh;inline-size:100%'
  wrapper.appendChild(calEl)

  // Clean up the style element when the wrapper is removed from the DOM.
  const observer = new MutationObserver(() => {
    if (!wrapper.isConnected) {
      document.head.removeChild(styleEl)
      observer.disconnect()
    }
  })
  observer.observe(document.body, { childList: true, subtree: true })

  return wrapper
}

/**
 * Day view with one column per resource, each lane colour-coded by `resourceType`.
 * The `data-bc-resource-type` attribute on `.bc-day-column` mirrors the accessor
 * value directly — no JavaScript needed at render time.
 */
export const DayView: Story = {
  name: 'Day View — Resource Lane Colours',
  render: () => makeCalendarEl(Views.DAY, [Views.DAY]),
}

/**
 * Week (resource-major) layout. Resources expand horizontally across the full week
 * span before the next resource's columns begin. Lane colours come from
 * `data-bc-resource-type` on `.bc-day-column`.
 */
export const WeekView: Story = {
  name: 'Week View — Resource Lane Colours',
  render: () => makeCalendarEl(Views.WEEK, [Views.WEEK]),
}

/**
 * Day-major week layout (`resourceLayout="day"`). All resources are grouped under
 * each day header. This lets you compare capacity across rooms day-by-day rather
 * than resource-by-resource. Colours persist via `data-bc-resource-type`.
 */
export const DayMajorView: Story = {
  name: 'Day-Major Week — Resource Lane Colours',
  render: () => {
    const styleEl = injectStyles()

    const calEl = document.createElement('bc-calendar') as HTMLElement & Record<string, unknown>
    calEl.style.cssText = 'display:block;block-size:100dvh;inline-size:100%'
    calEl.localizer = litLocalizer.current
    calEl.events = demoEvents
    calEl.defaultDate = FOCUS
    calEl.getNow = () => NOW
    calEl.defaultView = Views.WEEK
    calEl.views = [Views.WEEK]
    calEl.resources = rooms
    calEl.resourceLayout = 'day'

    window.addEventListener('bc-localizer-change', () => {
      calEl.localizer = litLocalizer.current
    })

    calEl.innerHTML = `
      <bc-default-toolbar></bc-default-toolbar>
      <bc-month-view></bc-month-view>
      <bc-time-grid-view></bc-time-grid-view>
      <bc-agenda-view></bc-agenda-view>
    `

    const wrapper = document.createElement('div')
    wrapper.style.cssText = 'block-size:100dvh;inline-size:100%'
    wrapper.appendChild(calEl)

    const observer = new MutationObserver(() => {
      if (!wrapper.isConnected) {
        document.head.removeChild(styleEl)
        observer.disconnect()
      }
    })
    observer.observe(document.body, { childList: true, subtree: true })

    return wrapper
  },
}
