// Part 1 usage that must NOT compile. Each `// expect:` names text the error on the next line must contain.
import {
  calendarFeatures,
  createCalendar,
  dayGrid,
  dayGridView,
  dnd,
  resources,
  slotSelection,
  standardFeatures,
  timeGrid,
  timeGridView,
  untrustedHtml,
} from '../src/core/index.ts'
import '../src/recurrence/index.ts'

// expect: dnd needs a grid family
calendarFeatures({ dnd })

// expect: resources needs timeGrid or timeline
calendarFeatures({ dayGrid, resources })

// expect: Register at least one view family
calendarFeatures({ slotSelection })

// expect: Register the timeGrid feature to use these options
createCalendar({
  features: calendarFeatures({ dayGrid }),
  events: [],
  timeGrid: { step: 'PT15M' },
})

// expect: Register the recurrence feature to use these options
createCalendar({ features: standardFeatures, events: [], recurrence: {} })

// expect: Register the slotSelection feature to use selection
createCalendar({
  features: standardFeatures,
  events: [],
  onSelectionChange: () => {},
})

// expect: resources
createCalendar({ features: standardFeatures, events: [], resources: [] })

// expect: '"agenda" | "day" | "month" | "week"'
createCalendar({ features: standardFeatures, events: [], defaultView: 'year' })

// expect: ViewDefinition<"dayGrid">
createCalendar({
  features: calendarFeatures({ timeGrid }),
  events: [],
  views: { month: dayGridView(), week: timeGridView({ days: 7 }) },
})

// expect: hiddenEventCount
createCalendar({ features: standardFeatures, events: [] }).hiddenEventCount

// expect: UntrustedHtml
const html: string = untrustedHtml('<b>x</b>')
void html

// expect: TrustedHTML
void ({ __html: untrustedHtml('<b>x</b>') } satisfies {
  __html: string | TrustedHTML
})

// expect: Property 'start' is missing
createCalendar({
  features: standardFeatures,
  events: [{ id: 1, title: 'No start' }],
})
