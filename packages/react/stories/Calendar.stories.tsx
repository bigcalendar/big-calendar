import { Navigate, Views, defineView } from '@big-calendar/core'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Calendar } from '../src'
import type { CustomViewProps } from '../src'
import type { DemoEvent } from './harness'
import { CalendarStage, SelectionDemo } from './harness'

/**
 * Five events crammed onto the focus day (Jun 15). With `weekEventLimit={2}` the
 * first two fill the week's rows and the rest overflow into the month "+N more"
 * indicator — click it to open the top-layer popover listing the hidden events.
 */
const overflowEvents: DemoEvent[] = [
  { id: 1, title: 'Standup', start: '2026-06-15T09:00:00.000Z', end: '2026-06-15T09:30:00.000Z' },
  { id: 2, title: 'Design review', start: '2026-06-15T10:00:00.000Z', end: '2026-06-15T11:00:00.000Z' },
  { id: 3, title: '1:1 with Dana', start: '2026-06-15T11:30:00.000Z', end: '2026-06-15T12:00:00.000Z' },
  { id: 4, title: 'Sprint planning', start: '2026-06-15T13:00:00.000Z', end: '2026-06-15T14:30:00.000Z' },
  { id: 5, title: 'Release cut', start: '2026-06-15T16:00:00.000Z', end: '2026-06-15T17:00:00.000Z' },
]

const meta: Meta<typeof Calendar> = {
  title: 'React/Calendar',
  component: Calendar,
  parameters: {
    docs: {
      description: {
        component:
          'The default calendar tree. Reads the active view from context and renders the matching view inside `.bc-calendar`, with the toolbar as a sibling outside it. One view renders at a time — the toolbar switches between them. Must be wrapped in a `CalendarProvider`.',
      },
    },
  },
}
export default meta

type Story = StoryObj<typeof Calendar>

/** Month view with the toolbar (the default). Use the toolbar to switch views. */
export const Default: Story = {
  render: () => (
    <CalendarStage defaultView={Views.MONTH}>
      <Calendar />
    </CalendarStage>
  ),
}

/** Opened on the week view. */
export const Week: Story = {
  render: () => (
    <CalendarStage defaultView={Views.WEEK}>
      <Calendar />
    </CalendarStage>
  ),
}

/** Opened on the agenda view. */
export const Agenda: Story = {
  render: () => (
    <CalendarStage defaultView={Views.AGENDA}>
      <Calendar />
    </CalendarStage>
  ),
}

/**
 * Interactive selection playground. Use the **Controls** panel to toggle
 * `selectable` and switch the active `view`. With `selectable` on: in the time
 * views drag down a column / click / double-click a slot; in the month view drag
 * across day cells / click a day; in any view click an event. Each gesture's
 * payload (a slot callback — `onSlotClick` / `onSlotDoubleClick` / `onSlotSelect`
 * — with ISO `start`/`end`/`slots`, or `onEventClick`/`onEventDoubleClick`) shows
 * in the read-out below the calendar.
 */
export const Selectable: StoryObj<{
  selectable: boolean
  view: (typeof Views)[keyof typeof Views]
}> = {
  args: { selectable: true, view: Views.MONTH },
  argTypes: {
    selectable: {
      control: 'boolean',
      description: 'Enable slot/day selection (drag, click, double-click).',
    },
    view: {
      control: 'select',
      options: [Views.MONTH, Views.WEEK, Views.WORK_WEEK, Views.DAY, Views.AGENDA],
      description: 'Active view to open on.',
    },
  },
  render: ({ selectable, view }) => (
    <SelectionDemo defaultView={view} selectable={selectable}>
      <Calendar />
    </SelectionDemo>
  ),
}

/** `toolbar={false}` omits the navigation toolbar; the view fills the stage. */
export const WithoutToolbar: Story = {
  render: () => (
    <CalendarStage defaultView={Views.MONTH} rows="1fr">
      <Calendar toolbar={false} />
    </CalendarStage>
  ),
}

/**
 * A registered **custom view** (§9). The core `views` config maps the key
 * `'3day'` to a pure `ViewDefinition` (range / navigate / label / buildModel run
 * in core, like the built-ins); `components.views['3day']` supplies the React
 * component, which reads the model core built. `<Calendar>` renders it inside
 * `.bc-calendar` when the active view is `'3day'`.
 */
interface ThreeDayModel {
  dayLabels: string[]
  eventCount: number
}
const threeDayView = defineView<DemoEvent>()({
  range: ({ localizer, date }) => {
    const start = localizer.startOf({ value: date, unit: 'day' })
    const last = localizer.add({ value: start, amount: 2, unit: 'day' })
    return { firstVisibleDay: start, lastVisibleDay: last, days: localizer.range({ start, end: last, unit: 'day' }) }
  },
  navigate: ({ localizer, date, direction }) =>
    localizer.add({ value: date, amount: direction === Navigate.NEXT ? 3 : -3, unit: 'day' }),
  label: ({ localizer, range }) =>
    `${localizer.format({ value: range.firstVisibleDay, format: 'monthDay' })} – ${localizer.format({ value: range.lastVisibleDay, format: 'monthDay' })}`,
  buildModel: ({ localizer, days, events }): ThreeDayModel => ({
    dayLabels: days.map((d) => localizer.format({ value: d, format: 'dayHeader' })),
    eventCount: events.length,
  }),
})

function ThreeDayView({ model }: CustomViewProps) {
  const { dayLabels, eventCount } = model as ThreeDayModel
  return (
    <div style={{ padding: '1rem' }}>
      <p style={{ marginBlock: '0 0.75rem' }}>
        Custom 3-day view — {eventCount} event{eventCount === 1 ? '' : 's'} in range
      </p>
      <ul style={{ margin: 0, paddingInlineStart: '1.25rem' }}>
        {dayLabels.map((label) => (
          <li key={label}>{label}</li>
        ))}
      </ul>
    </div>
  )
}

export const CustomView: Story = {
  render: () => (
    <CalendarStage
      defaultView="3day"
      viewDefinitions={{ '3day': threeDayView }}
      components={{ views: { '3day': ThreeDayView } }}
    >
      <Calendar />
    </CalendarStage>
  ),
}

/**
 * Limit the toolbar to two views via the `views` prop. Only Month and Agenda
 * buttons appear; Week / Work Week / Day are hidden.
 */
export const LimitedViews: Story = {
  render: () => (
    <CalendarStage defaultView={Views.MONTH} views={[Views.MONTH, Views.AGENDA]}>
      <Calendar />
    </CalendarStage>
  ),
}

/**
 * A day overloaded past `weekEventLimit` so the month "+N more" indicator
 * appears. Click it to open the top-layer show-more popover (native Popover API,
 * positioned with floating-ui) listing the overflowed events.
 */
export const ShowMorePopover: Story = {
  render: () => (
    <CalendarStage defaultView={Views.MONTH} weekEventLimit={2} events={overflowEvents}>
      <Calendar />
    </CalendarStage>
  ),
}
