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

// Not a case: with @types/react loaded, React's `__html` accepts `string | TrustedHTML`, and
// @types/react declares `interface TrustedHTML {}`, which every non-null type satisfies. No type can
// block `__html`; `src/usage/part3-ok.tsx` shows it compiling (P5 draft, finding in part 3).

// expect: Property 'start' is missing
createCalendar({
  features: standardFeatures,
  events: [{ id: 1, title: 'No start' }],
})
