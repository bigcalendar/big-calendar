/**
 * Each story here replaces one default slot component with a custom one.
 * The goal is to show exactly what data each slot receives and how little
 * code it takes to completely change how that part of the calendar looks.
 *
 * In Svelte, custom slot components are plain `.svelte` files — any component
 * that accepts the documented `$props()` for a given slot is accepted. Pass
 * them via `components={{ month: { weekday: YourComp } }}`.
 *
 * All stories use the shared demo events from `harness.ts`.
 */
import { Views } from '@big-calendar/core'
import type { Meta, StoryObj } from '@storybook/svelte-vite'
import { demoEvents, type DemoEvent, FOCUS, NOW } from './harness'
import CalendarStory from './CalendarStory.svelte'
import BoldWeekday from './custom/BoldWeekday.svelte'
import HighlightedDateCell from './custom/HighlightedDateCell.svelte'
import PillEvent from './custom/PillEvent.svelte'
import MinimalShowMore from './custom/MinimalShowMore.svelte'
import AccentedDayHeading from './custom/AccentedDayHeading.svelte'
import ItalicTimeLabel from './custom/ItalicTimeLabel.svelte'
import StackedTimeEvent from './custom/StackedTimeEvent.svelte'
import TaggedAllDayEvent from './custom/TaggedAllDayEvent.svelte'
import CompactTimeShowMore from './custom/CompactTimeShowMore.svelte'
import RuledAgendaDate from './custom/RuledAgendaDate.svelte'
import TwoColumnAgendaEvent from './custom/TwoColumnAgendaEvent.svelte'
import CustomEmptyState from './custom/CustomEmptyState.svelte'
import BorderedAgendaEvent from './custom/BorderedAgendaEvent.svelte'

const meta: Meta = {
  title: 'Calendar/Custom Rendering',
}
export default meta

type Story = StoryObj<typeof meta>

// ─── Month view ───────────────────────────────────────────────────────────────

/** Replace `components.month.weekday` with a custom column heading that renders
 * the full weekday name in uppercase purple. */
export const MonthWeekday: Story = {
  name: 'Custom Month Weekday',
  render: () => ({
    Component: CalendarStory,
    props: {
      events: demoEvents,
      defaultDate: FOCUS,
      getNow: () => NOW,
      defaultView: Views.MONTH,
      components: { month: { weekday: BoldWeekday } },
    },
  }),
}

/** Replace `components.month.dateCell` to give today a filled circle treatment.
 * Click any date to drill down into the day view. */
export const MonthDateCell: Story = {
  name: 'Custom Month Date Cell',
  render: () => ({
    Component: CalendarStory,
    props: {
      events: demoEvents,
      defaultDate: FOCUS,
      getNow: () => NOW,
      defaultView: Views.MONTH,
      components: { month: { dateCell: HighlightedDateCell } },
    },
  }),
}

/** Replace `components.month.event` to render a small dot before each event title. */
export const MonthEvent: Story = {
  name: 'Custom Month Event',
  render: () => ({
    Component: CalendarStory,
    props: {
      events: demoEvents,
      defaultDate: FOCUS,
      getNow: () => NOW,
      defaultView: Views.MONTH,
      components: { month: { event: PillEvent } },
    },
  }),
}

/** Replace `components.month.showMore` with a custom trigger that opens the
 * same popover but with a plain-text link style. */
export const MonthShowMore: Story = {
  name: 'Custom Month Show More',
  render: () => ({
    Component: CalendarStory,
    props: {
      events: demoEvents,
      defaultDate: FOCUS,
      getNow: () => NOW,
      defaultView: Views.MONTH,
      components: { month: { showMore: MinimalShowMore } },
    },
  }),
}

// ─── Time grid view ──────────────────────────────────────────────────────────

/** Replace `components.time.dayHeading` to highlight today's column with a
 * filled purple background. Click a heading to drill into the day view. */
export const TimeDayHeading: Story = {
  name: 'Custom Time Day Heading',
  render: () => ({
    Component: CalendarStory,
    props: {
      events: demoEvents,
      defaultDate: FOCUS,
      getNow: () => NOW,
      defaultView: Views.WEEK,
      components: { time: { dayHeading: AccentedDayHeading } },
    },
  }),
}

/** Replace `components.time.timeLabel` to render gutter labels in italic teal. */
export const TimeLabel: Story = {
  name: 'Custom Time Label',
  render: () => ({
    Component: CalendarStory,
    props: {
      events: demoEvents,
      defaultDate: FOCUS,
      getNow: () => NOW,
      defaultView: Views.WEEK,
      components: { time: { timeLabel: ItalicTimeLabel } },
    },
  }),
}

/** Replace `components.time.event` to render the title and time on separate
 * lines inside the event box, with the title bold. */
export const TimeEvent: Story = {
  name: 'Custom Time Event',
  render: () => ({
    Component: CalendarStory,
    props: {
      events: demoEvents,
      defaultDate: FOCUS,
      getNow: () => NOW,
      defaultView: Views.WEEK,
      components: { time: { event: StackedTimeEvent } },
    },
  }),
}

/** Replace `components.time.allDayEvent` to add a small dot before each all-day
 * event title in the time-grid header strip. */
export const TimeAllDayEvent: Story = {
  name: 'Custom Time All-Day Event',
  render: () => ({
    Component: CalendarStory,
    props: {
      events: demoEvents,
      defaultDate: FOCUS,
      getNow: () => NOW,
      defaultView: Views.WEEK,
      components: { time: { allDayEvent: TaggedAllDayEvent } },
    },
  }),
}

const timeShowMoreEvents: DemoEvent[] = [
  ...demoEvents,
  { id: 211, title: 'Engineering Summit', allDay: true, start: '2026-06-15T00:00:00.000Z', end: '2026-06-17T00:00:00.000Z' },
  { id: 212, title: 'Product Sprint',     allDay: true, start: '2026-06-15T00:00:00.000Z', end: '2026-06-20T00:00:00.000Z' },
  { id: 213, title: 'Code Freeze',        allDay: true, start: '2026-06-16T00:00:00.000Z', end: '2026-06-18T00:00:00.000Z' },
  { id: 214, title: 'Release Week',       allDay: true, start: '2026-06-15T00:00:00.000Z', end: '2026-06-20T00:00:00.000Z' },
]

/** Replace `components.time.showMore` with a compact "+N" badge trigger that
 * opens the same popover as the default. Extra all-day events are added to the
 * focus week so the strip overflows and the indicator is visible immediately. */
export const TimeShowMore: Story = {
  name: 'Custom Time Show More',
  render: () => ({
    Component: CalendarStory,
    props: {
      events: timeShowMoreEvents,
      defaultDate: FOCUS,
      getNow: () => NOW,
      defaultView: Views.WEEK,
      showAllEvents: false,
      components: { time: { showMore: CompactTimeShowMore } },
    },
  }),
}

// ─── Agenda view ─────────────────────────────────────────────────────────────

/** Replace `components.agenda.date` to render each day heading in uppercase
 * with an underline accent. */
export const AgendaDate: Story = {
  name: 'Custom Agenda Date',
  render: () => ({
    Component: CalendarStory,
    props: {
      events: demoEvents,
      defaultDate: FOCUS,
      getNow: () => NOW,
      defaultView: Views.AGENDA,
      components: { agenda: { date: RuledAgendaDate } },
    },
  }),
}

/** Replace `components.agenda.event` to render a two-column grid row with the
 * time left-aligned and the title bold on the right. */
export const AgendaEvent: Story = {
  name: 'Custom Agenda Event',
  render: () => ({
    Component: CalendarStory,
    props: {
      events: demoEvents,
      defaultDate: FOCUS,
      getNow: () => NOW,
      defaultView: Views.AGENDA,
      components: { agenda: { event: TwoColumnAgendaEvent } },
    },
  }),
}

/** Replace `components.agenda.empty` to show a custom empty state. An empty
 * `events` array is passed so the empty state is visible immediately. */
export const AgendaEmpty: Story = {
  name: 'Custom Agenda Empty State',
  render: () => ({
    Component: CalendarStory,
    props: {
      events: [],
      defaultDate: FOCUS,
      getNow: () => NOW,
      defaultView: Views.AGENDA,
      components: { agenda: { empty: CustomEmptyState } },
    },
  }),
}

/** Replace `components.agenda.event` with a custom row that uses `AgendaEventButton`
 * directly. `AgendaEventButton` renders the title as a link-styled `<button>` when
 * the app has wired any event handler, otherwise as a plain `<span>` — the same
 * smart toggle the default row uses internally. */
export const AgendaEventButtonUsage: Story = {
  name: 'AgendaEventButton in Custom Row',
  render: () => ({
    Component: CalendarStory,
    props: {
      events: demoEvents,
      defaultDate: FOCUS,
      getNow: () => NOW,
      defaultView: Views.AGENDA,
      components: { agenda: { event: BorderedAgendaEvent } },
    },
  }),
}
