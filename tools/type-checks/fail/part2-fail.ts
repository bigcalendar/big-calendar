// Part 2 usage that must NOT compile.
import {
  calendarFeatures,
  createCalendar,
  dayGrid,
  dnd,
  standardFeatures,
  timeGrid,
} from '../src/runtime/core'
import { recurrence } from '../src/runtime/recurrence'

// expect: Register the dnd feature to use onEventMove
createCalendar({
  features: standardFeatures,
  events: [],
  onEventMove: () => {},
})

// expect: Property 'resolveRecurringScope' is missing
createCalendar({
  features: calendarFeatures({ dayGrid, recurrence }),
  events: [],
})

// expect: Register the resources feature to use resources
createCalendar({ features: standardFeatures, events: [], resources: [] })

// expect: Type 'Promise<string>' is not assignable to type 'ChangeResult<unknown>'
createCalendar({
  features: calendarFeatures({ dayGrid, timeGrid, dnd }),
  events: [],
  onEventMove: () => Promise.resolve('weekly'),
})

// expect: Type 'false' is not assignable to type 'string | true'
createCalendar({
  features: standardFeatures,
  events: [],
  constraints: { validate: () => false },
})
