// Part 3 usage that must NOT compile.
import { customView, dayGridView, standardFeatures } from '../src/core/index.ts'
import type { PartManifest } from '../src/interactions/index.ts'
import { Calendar } from '../src/react-ui/index.ts'

const sprint = customView({
  range: (d) => ({ start: d, end: d }),
  navigate: (d) => d,
  title: () => 'S',
})

// expect: Property 'viewComponents' is missing
export const a = (
  <Calendar
    features={standardFeatures}
    events={[]}
    views={{ month: dayGridView(), sprint }}
  />
)

// expect: Type 'string' has no properties in common with type 'DateTimeFormatOptions'
export const b = (
  <Calendar
    features={standardFeatures}
    events={[]}
    formats={{ timeGutter: 'HH:mm' }}
  />
)

// expect: Target signature provides too few arguments
export const c = (
  <Calendar
    features={standardFeatures}
    events={[]}
    messages={{
      moreEvents: (count: number, total: number) => `${count}/${total}`,
    }}
  />
)

// expect: 'nope' does not exist in type 'Slots<unknown>'
export const d = (
  <Calendar
    features={standardFeatures}
    events={[]}
    slots={{ nope: { wrap: ({ children }) => children } }}
  />
)

// expect: Type '() => null' is not assignable to type 'undefined'
export const e = (
  <Calendar
    features={standardFeatures}
    events={[]}
    slots={{ event: { wrap: ({ children }) => children, render: () => null } }}
  />
)

export const m = {
  part: 'dayCell',
  // expect: Type '"bc-daycell"' is not assignable to type '"bc-day-cell"'
  className: 'bc-daycell',
  feature: 'dayGrid',
  element: 'div',
  role: 'gridcell',
  dataAttributes: {},
  cssVariables: {},
  css: 'day-cell.module.css',
} satisfies PartManifest<'dayCell'>
