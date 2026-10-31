// Part 2 usage that must compile: edit callbacks, drafts, constraints.
import {
  calendarFeatures,
  createCalendar,
  dayGrid,
  dnd,
  resources,
  slotSelection,
  timeGrid,
  type CalendarEvent,
  type Draft,
} from '../core/index.ts'
import { recurrence } from '../recurrence/index.ts'

interface Job {
  crew: string
}
declare const jobs: CalendarEvent<Job>[]
declare function save(
  event: CalendarEvent<Job>,
  signal: AbortSignal,
): Promise<CalendarEvent<Job>>

const calendar = createCalendar({
  features: calendarFeatures({
    dayGrid,
    timeGrid,
    dnd,
    slotSelection,
    resources,
    recurrence,
  }),
  events: jobs,
  // Every callback is typed from the data's meta, with no annotations.
  onEventMove: (change) => {
    if (change.converted && change.after.meta?.crew === 'night') return false
    return save(change.after, change.signal)
  },
  onEventResize: (change) => void change.edge,
  onEventCreate: async (change) => {
    if (
      change.origin.kind === 'external' &&
      change.origin.draft.item.kind === 'fromCalendar'
    ) {
      return save(change.origin.draft.item.event, change.signal)
    }
    return save(change.after, change.signal)
  },
  onEventDragOut: ({ event, dropEffect }) =>
    void (dropEffect === 'move' && event.id),
  onChangeError: (error, change) => console.error(error, change.kind),
  resolveRecurringScope: async (change) =>
    change.kind === 'delete' ? 'series' : 'occurrence',
  constraints: {
    minDuration: 'PT15M',
    overlap: false,
    validate: (draft) =>
      draft.resourceId === 'closed' ? 'This room is closed' : true,
  },
  dnd: {
    snap: 'PT5M',
    acceptExternal: (data) => {
      const title = data.getData('text/plain')
      return title
        ? { kind: 'item', title, duration: 'PT1H', meta: { crew: 'day' } }
        : false
    },
  },
})

// Drafts are a discriminated union.
function describe(draft: Draft<Job>): string {
  switch (draft.kind) {
    case 'creation':
      return `new ${draft.start}`
    case 'internal-drag':
      return `${draft.event.event.title} to ${draft.start}`
    case 'internal-resize':
      return `${draft.event.event.title} ${draft.edge}`
    case 'external-drag':
      return draft.item.kind === 'item'
        ? draft.item.title
        : draft.item.event.title
  }
}
calendar.state.drafts.get().map(describe)
calendar.createEvent({ title: 'Walk-in', start: '2026-10-26T10:00' })
calendar.deleteEvent('j1')
