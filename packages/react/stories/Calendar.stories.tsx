import { Views } from '@big-calendar/core'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Calendar } from '../src'
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
