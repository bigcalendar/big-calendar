// Part 3 usage that must compile: <Calendar>, slots, custom views, formats, messages, headless hooks.
import { Suspense } from 'react'
import {
  calendarFeatures,
  customView,
  dayGrid,
  dayGridView,
  dnd,
  standardFeatures,
  timeGrid,
  timeGridView,
  type CalendarEvent,
} from '../core/index.ts'
import type { PartManifest } from '../interactions/index.ts'
import {
  normalize,
  useCalendar,
  useCalendarGetters,
  useCalendarState,
} from '../react/index.ts'
import { Calendar } from '../react-ui/index.ts'

interface Shift {
  nurse: string
}
declare const shifts: CalendarEvent<Shift>[]
const features = calendarFeatures({ dayGrid, timeGrid, dnd })

// 1. Drop-in, with every callback and slot typed from the data.
export function Schedule() {
  return (
    <Calendar
      features={features}
      events={shifts}
      views={{
        month: dayGridView(),
        week: timeGridView({ days: 'week' }),
        roster: customView({
          label: 'Roster',
          range: (date) => ({ start: date, end: date }),
          navigate: (date) => date,
          title: () => 'Roster',
        }),
      }}
      viewComponents={{
        roster: ({ events }) => (
          <ul>
            {events.map((e) => (
              <li key={e.key}>{e.event.meta?.nurse}</li>
            ))}
          </ul>
        ),
      }}
      onEventMove={(change) => void change.after.meta?.nurse}
      formats={{
        timeGutter: { hour: 'numeric' },
        eventTime: { hour: 'numeric', minute: '2-digit' },
      }}
      messages={{ today: 'Now', moreEvents: (count) => `+${count}` }}
      slots={{
        event: {
          wrap: ({ event, children }) => (
            <span title={event.event.meta?.nurse}>{children}</span>
          ),
        },
        toolbar: {
          render: ({ props, title }) => <header {...props}>{title}</header>,
        },
      }}
      sizing="page"
    />
  )
}

// 2. Headless: hooks and getters on your own markup.
export function Headless() {
  const calendar = useCalendar({ features: standardFeatures, events: shifts })
  const view = useCalendarState(calendar, (state) => state.view)
  const { getRootProps } = useCalendarGetters(calendar)
  return <section {...getRootProps()}>{view}</section>
}
export const app = (
  <Suspense fallback="Loading">
    <Headless />
  </Suspense>
)

// 3. A manifest, checked against its part.
export const dayCellManifest = {
  part: 'dayCell',
  className: 'bc-day-cell',
  feature: 'dayGrid',
  element: 'div',
  role: 'gridcell',
  dataAttributes: {
    'data-state': {
      values: 'token-list',
      description: 'selected, today, outside',
    },
    'data-invalid': {
      values: 'boolean',
      description: 'A draft here breaks a constraint',
      feature: 'dnd',
    },
  },
  cssVariables: {
    '--bc-col': {
      kind: 'inline',
      syntax: '<integer>',
      description: 'Column, from 1',
    },
  },
  css: 'day-cell.module.css',
} satisfies PartManifest<'dayCell'>

void normalize

// 4. Known gap: React's `__html` accepts `string | TrustedHTML`, and @types/react declares an empty
// `TrustedHTML` interface, so an `UntrustedHtml` value type-checks here. Only lint can catch this.
declare const risky: CalendarEvent<Shift>
export const gap = risky.descriptionHtml && (
  <div dangerouslySetInnerHTML={{ __html: risky.descriptionHtml }} />
)

// 5. RBC's per-view event components become one slot that branches on `view` (part 4).
export const perView = (
  <Calendar
    features={standardFeatures}
    events={shifts}
    slots={{
      eventContent: {
        render: ({ props, event, view }) => (
          <span {...props}>
            {view === 'month'
              ? event.event.title
              : `${event.event.title} (${event.event.meta?.nurse})`}
          </span>
        ),
      },
    }}
    dayGrid={{ maxRows: 'all', overflow: 'none' }}
    onShowMore={({ date, events }) => void [date, events.length]}
    drilldownView={(_date, fromView) => (fromView === 'month' ? 'day' : null)}
    onEventKeyDown={(event, key) => void (key.key === 'p' && event.event.id)}
  />
)
