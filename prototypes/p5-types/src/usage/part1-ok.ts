// Part 1 usage that must compile.
import {
  agenda,
  agendaView,
  calendarFeatures,
  createAtom,
  createCalendar,
  createEventCollection,
  customView,
  dayGrid,
  dayGridView,
  dnd,
  readUntrustedHtml,
  resources,
  slotSelection,
  standardFeatures,
  timeGrid,
  timeGridView,
  untrustedHtml,
  type CalendarEvent,
} from '../core/index.ts'
import { temporalReady } from '../temporal/index.ts'
import { recurrence } from '../recurrence/index.ts'

await temporalReady

// 1. The minimum: events and the standard preset.
const simple = createCalendar({
  features: standardFeatures,
  events: [{ id: 1, title: 'Holiday', start: '2026-12-25', end: '2026-12-26' }],
})
simple.setView('agenda')
simple.navigate('next')
const view: 'month' | 'week' | 'day' | 'agenda' = simple.state.view.get()
void view

// 2. Meta is inferred from the data, and flows to processed events.
interface Booking {
  room: string
}
const bookings: CalendarEvent<Booking>[] = [
  {
    id: 'b1',
    title: 'Standup',
    start: '2026-10-26T09:00',
    end: '2026-10-26T09:15',
    meta: { room: 'A' },
  },
]
const withMeta = createCalendar({
  features: standardFeatures,
  events: bookings,
})
const room: string | undefined = withMeta.events.get('b1')?.event.meta?.room
void room

// 3. Features add options, inputs, state and API; views are typed by their keys.
const features = calendarFeatures({
  dayGrid,
  timeGrid,
  dnd,
  slotSelection,
  resources,
  recurrence,
})
const dateAtom = createAtom('2026-10-26')
const full = createCalendar({
  features,
  events: createEventCollection<Booking>(bookings),
  resources: [{ id: 'r1', title: 'Room A', meta: { floor: 2 } }],
  views: {
    month: dayGridView(),
    week: timeGridView({ days: 'week' }),
    threeDay: timeGridView({ days: 3 }),
    sprint: customView({
      range: (date) => ({ start: date, end: date }),
      navigate: (date) => date,
      title: () => 'Sprint',
    }),
  },
  defaultView: 'threeDay',
  atoms: { date: dateAtom },
  onSelectionChange: (selection) => void selection?.resourceId,
  timeGrid: { step: 'PT15M', min: '07:00', max: '20:00' },
  dnd: { snap: 'PT5M', resizable: 'end' },
  resourceOptions: { layout: 'dayMajor', unassignedLane: true },
  recurrence: { expansionMargin: 'P7D' },
  resolveRecurringScope: () => 'occurrence',
})
full.setView('sprint')
full.clearSelection()
const hidden: number = full.hiddenEventCount.get()
const visible = full.state.visibleResources.get()
void hidden
void visible

// 4. Untrusted HTML takes an explicit step out.
const html = untrustedHtml('<b>hi</b>')
const raw: string = readUntrustedHtml(html)
void raw

// 5. Agenda alone is a valid calendar.
createCalendar({
  features: calendarFeatures({ agenda }),
  events: [],
  views: { list: agendaView() },
})
