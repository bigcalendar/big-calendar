import { Views } from '@big-calendar/core'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Calendar, EventButton, Popover } from '../src'
import type { PopoverTriggerProps } from '../src'
import type {
  AgendaDateProps,
  AgendaEmptyProps,
  AgendaEventProps,
  MonthDateProps,
  MonthEventProps,
  MonthShowMoreProps,
  MonthWeekdayProps,
  TimeAllDayEventProps,
  TimeDayHeadingProps,
  TimeLabelProps,
  TimeShowMoreProps,
  TimeEventProps,
} from '../src'
import AgendaEventButton from '../src/AgendaEventButton'
import { CalendarStage, demoEvents, type DemoEvent } from './harness'

/**
 * Each story here replaces one default slot component with a custom one.
 * Inspired by the RBC "Customized Component Rendering" example — the goal is
 * to show exactly what data each slot receives and how little code it takes to
 * completely change how that part of the calendar looks.
 *
 * All stories use the shared demo events and localizer from `harness.tsx`.
 * Navigate between months / views using the calendar toolbar.
 */
const meta: Meta = {
  title: 'Calendar/Custom Rendering',
}
export default meta

type Story = StoryObj<typeof meta>

// ─── Month view ─────────────────────────────────────────────────────────────

function BoldWeekday({ long }: MonthWeekdayProps) {
  return (
    <div
      style={{
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        fontWeight: 700,
        backgroundColor: 'rebeccapurple',
        color: 'white',
        padding: '0.25em 0',
        textAlign: 'center',
      }}
    >
      {long}
    </div>
  )
}

/** Replace `components.month.weekday` with a custom column heading that renders
 * the full weekday name in uppercase purple. */
export const MonthWeekday: Story = {
  render: () => (
    <CalendarStage defaultView={Views.MONTH} components={{ month: { weekday: BoldWeekday } }}>
      <Calendar />
    </CalendarStage>
  ),
}
MonthWeekday.storyName = 'Custom Month Weekday'

// ─────────────────────────────────────────────────────────────────────────────

function HighlightedDateCell({ label, isToday, isOffRange, onDrillDown }: MonthDateProps) {
  return (
    <button
      type="button"
      onClick={onDrillDown}
      style={{
        background: isToday ? 'rebeccapurple' : 'none',
        color: isToday ? 'white' : isOffRange ? '#aaa' : 'inherit',
        border: 'none',
        borderRadius: '50%',
        width: '2em',
        height: '2em',
        cursor: 'pointer',
        fontWeight: isToday ? 700 : 400,
      }}
    >
      {label}
    </button>
  )
}

/** Replace `components.month.dateCell` to give today a filled circle treatment.
 * Click any date to drill down into the day view. */
export const MonthDateCell: Story = {
  render: () => (
    <CalendarStage defaultView={Views.MONTH} components={{ month: { dateCell: HighlightedDateCell } }}>
      <Calendar />
    </CalendarStage>
  ),
}
MonthDateCell.storyName = 'Custom Month Date Cell'

// ─────────────────────────────────────────────────────────────────────────────

function PillEvent({ title }: MonthEventProps<DemoEvent>) {
  return (
    <span
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.35em',
        fontStyle: 'italic',
      }}
    >
      <span
        style={{
          display: 'inline-block',
          width: '0.5em',
          height: '0.5em',
          borderRadius: '50%',
          background: 'currentColor',
          flexShrink: 0,
        }}
      />
      {title}
    </span>
  )
}

/** Replace `components.month.event` to render a small dot before each event title. */
export const MonthEvent: Story = {
  render: () => (
    <CalendarStage defaultView={Views.MONTH} components={{ month: { event: PillEvent } }}>
      <Calendar />
    </CalendarStage>
  ),
}
MonthEvent.storyName = 'Custom Month Event'

// ─────────────────────────────────────────────────────────────────────────────

function MinimalShowMore({ count, events, EventSlot }: MonthShowMoreProps<DemoEvent>) {
  return (
    <Popover
      placement="bottom-start"
      sameWidth
      className="bc-popover bc-show-more-popover"
      trigger={(triggerProps: PopoverTriggerProps) => (
        <button
          {...triggerProps}
          type="button"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            inlineSize: '100%',
            blockSize: '100%',
            fontSize: '0.75em',
            color: 'rebeccapurple',
            textDecoration: 'underline',
            cursor: 'pointer',
            paddingInline: '3px',
            background: 'none',
            border: 'none',
            font: 'inherit',
          }}
        >
          {count} more &rsaquo;
        </button>
      )}
    >
      {events.map((item) => (
        <EventButton key={item.key} className="bc-segment" event={item.event} title={item.title} resizeEdges={[]}>
          <EventSlot event={item.event} title={item.title} />
        </EventButton>
      ))}
    </Popover>
  )
}

/** Replace `components.month.showMore` with a custom trigger that opens the
 * same popover but with a plain-text link style. `weekEventLimit={2}` keeps
 * overflow visible right away. */
export const MonthShowMore: Story = {
  render: () => (
    <CalendarStage defaultView={Views.MONTH} weekEventLimit={2} components={{ month: { showMore: MinimalShowMore } }}>
      <Calendar />
    </CalendarStage>
  ),
}
MonthShowMore.storyName = 'Custom Month Show More'

// ─── Time grid view ──────────────────────────────────────────────────────────

function AccentedDayHeading({ label, isToday, onDrillDown }: TimeDayHeadingProps) {
  return (
    <button
      type="button"
      onClick={onDrillDown}
      style={{
        background: isToday ? 'rebeccapurple' : 'transparent',
        color: isToday ? 'white' : 'inherit',
        border: 'none',
        borderRadius: '0.25em',
        padding: '0.2em 0.6em',
        cursor: 'pointer',
        fontWeight: isToday ? 700 : 400,
        width: '100%',
      }}
    >
      {label}
    </button>
  )
}

/** Replace `components.time.dayHeading` to highlight today's column with a
 * filled purple background. Click a heading to drill into the day view. */
export const TimeDayHeading: Story = {
  render: () => (
    <CalendarStage defaultView={Views.WEEK} components={{ time: { dayHeading: AccentedDayHeading } }}>
      <Calendar />
    </CalendarStage>
  ),
}
TimeDayHeading.storyName = 'Custom Time Day Heading'

// ─────────────────────────────────────────────────────────────────────────────

function ItalicTimeLabel({ label }: TimeLabelProps) {
  return (
    <span style={{ fontStyle: 'italic', color: 'darkcyan', fontSize: '0.8em' }}>
      {label}
    </span>
  )
}

/** Replace `components.time.timeLabel` to render gutter labels in italic teal. */
export const TimeLabel: Story = {
  render: () => (
    <CalendarStage defaultView={Views.WEEK} components={{ time: { timeLabel: ItalicTimeLabel } }}>
      <Calendar />
    </CalendarStage>
  ),
}
TimeLabel.storyName = 'Custom Time Label'

// ─────────────────────────────────────────────────────────────────────────────

function StackedTimeEvent({ title, time }: TimeEventProps<DemoEvent>) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1em', padding: '0.1em 0' }}>
      <span style={{ fontWeight: 700, fontSize: '0.85em', lineHeight: 1.2 }}>{title}</span>
      <span style={{ fontSize: '0.7em', opacity: 0.75 }}>{time}</span>
    </div>
  )
}

/** Replace `components.time.event` to render the title and time on separate
 * lines inside the event box, with the title bold. */
export const TimeEvent: Story = {
  render: () => (
    <CalendarStage defaultView={Views.WEEK} components={{ time: { event: StackedTimeEvent } }}>
      <Calendar />
    </CalendarStage>
  ),
}
TimeEvent.storyName = 'Custom Time Event'

// ─────────────────────────────────────────────────────────────────────────────

function TaggedAllDayEvent({ title }: TimeAllDayEventProps<DemoEvent>) {
  return (
    <span
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.25em',
        fontStyle: 'italic',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          display: 'inline-block',
          width: '0.4em',
          height: '0.4em',
          borderRadius: '50%',
          background: 'currentColor',
          flexShrink: 0,
        }}
      />
      {title}
    </span>
  )
}

/** Replace `components.time.allDayEvent` to add a small dot before each all-day
 * event title in the time-grid header strip. */
export const TimeAllDayEvent: Story = {
  render: () => (
    <CalendarStage defaultView={Views.WEEK} components={{ time: { allDayEvent: TaggedAllDayEvent } }}>
      <Calendar />
    </CalendarStage>
  ),
}
TimeAllDayEvent.storyName = 'Custom Time All-Day Event'

// ─────────────────────────────────────────────────────────────────────────────

function CompactTimeShowMore({ count, events, EventSlot }: TimeShowMoreProps<DemoEvent>) {
  return (
    <Popover
      placement="bottom-start"
      sameWidth
      className="bc-popover bc-show-more-popover"
      trigger={(triggerProps: PopoverTriggerProps) => (
        <button
          {...triggerProps}
          type="button"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            inlineSize: '100%',
            blockSize: '100%',
            fontSize: '0.7em',
            fontWeight: 700,
            color: 'rebeccapurple',
            paddingInline: '3px',
            background: 'none',
            border: 'none',
            font: 'inherit',
            cursor: 'pointer',
            pointerEvents: 'auto',
          }}
        >
          +{count}
        </button>
      )}
    >
      {events.map((item) => (
        <EventButton key={item.key} className="bc-segment" event={item.event} title={item.title} resizeEdges={[]}>
          <EventSlot event={item.event} title={item.title} />
        </EventButton>
      ))}
    </Popover>
  )
}

const timeShowMoreEvents: DemoEvent[] = [
  ...demoEvents,
  { id: 211, title: 'Engineering Summit',  allDay: true, start: '2026-06-15T00:00:00.000Z', end: '2026-06-17T00:00:00.000Z' },
  { id: 212, title: 'Product Sprint',      allDay: true, start: '2026-06-15T00:00:00.000Z', end: '2026-06-20T00:00:00.000Z' },
  { id: 213, title: 'Code Freeze',         allDay: true, start: '2026-06-16T00:00:00.000Z', end: '2026-06-18T00:00:00.000Z' },
  { id: 214, title: 'Release Week',        allDay: true, start: '2026-06-15T00:00:00.000Z', end: '2026-06-20T00:00:00.000Z' },
]

/** Replace `components.time.showMore` with a compact "+N" badge trigger that
 * opens the same popover as the default. Extra all-day events are added to the
 * focus week so the strip overflows and the indicator is visible immediately. */
export const TimeShowMore: Story = {
  render: () => (
    <CalendarStage
      defaultView={Views.WEEK}
      showAllEvents={false}
      events={timeShowMoreEvents}
      components={{ time: { showMore: CompactTimeShowMore } }}
    >
      <Calendar />
    </CalendarStage>
  ),
}
TimeShowMore.storyName = 'Custom Time Show More'

// ─── Agenda view ─────────────────────────────────────────────────────────────

function RuledAgendaDate({ label }: AgendaDateProps) {
  return (
    <div
      style={{
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        fontSize: '0.8em',
        borderBottom: '2px solid rebeccapurple',
        paddingBottom: '0.2em',
        color: 'rebeccapurple',
      }}
    >
      {label}
    </div>
  )
}

/** Replace `components.agenda.date` to render each day heading in uppercase
 * with an underline accent. */
export const AgendaDate: Story = {
  render: () => (
    <CalendarStage defaultView={Views.AGENDA} components={{ agenda: { date: RuledAgendaDate } }}>
      <Calendar />
    </CalendarStage>
  ),
}
AgendaDate.storyName = 'Custom Agenda Date'

// ─────────────────────────────────────────────────────────────────────────────

function TwoColumnAgendaEvent({ title, time, allDay }: AgendaEventProps<DemoEvent>) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '7rem 1fr',
        gap: '0.75rem',
        alignItems: 'baseline',
        padding: '0.3rem 0',
      }}
    >
      <span style={{ color: 'gray', fontVariantNumeric: 'tabular-nums', fontSize: '0.85em' }}>
        {allDay ? 'all day' : time}
      </span>
      <strong>{title}</strong>
    </div>
  )
}

/** Replace `components.agenda.event` to render a two-column grid row with the
 * time left-aligned and the title bold on the right. */
export const AgendaEvent: Story = {
  render: () => (
    <CalendarStage defaultView={Views.AGENDA} components={{ agenda: { event: TwoColumnAgendaEvent } }}>
      <Calendar />
    </CalendarStage>
  ),
}
AgendaEvent.storyName = 'Custom Agenda Event'

// ─────────────────────────────────────────────────────────────────────────────

function CustomEmptyState({ message }: AgendaEmptyProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4rem 2rem',
        gap: '0.75rem',
        color: '#888',
      }}
    >
      <div style={{ fontSize: '2rem', lineHeight: 1 }}>(  )</div>
      <p style={{ margin: 0, fontSize: '0.9em' }}>{message}</p>
    </div>
  )
}

/** Replace `components.agenda.empty` to show a custom empty state. An empty
 * `events` array is passed so the empty state is visible immediately. */
export const AgendaEmpty: Story = {
  render: () => (
    <CalendarStage defaultView={Views.AGENDA} events={[]} components={{ agenda: { empty: CustomEmptyState } }}>
      <Calendar />
    </CalendarStage>
  ),
}
AgendaEmpty.storyName = 'Custom Agenda Empty State'

// ─────────────────────────────────────────────────────────────────────────────

function BorderedAgendaEvent({ event, title, time, allDay }: AgendaEventProps<DemoEvent>) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '6rem 1fr',
        gap: '0.5rem',
        alignItems: 'baseline',
        borderLeft: '3px solid rebeccapurple',
        paddingLeft: '0.75rem',
        padding: '0.25rem 0 0.25rem 0.75rem',
      }}
    >
      <span style={{ color: 'gray', fontSize: '0.8em' }}>{allDay ? 'all day' : time}</span>
      <AgendaEventButton event={event} title={title} />
    </div>
  )
}

/** Replace `components.agenda.event` with a custom row that uses `AgendaEventButton`
 * directly. `AgendaEventButton` renders the title as a link-styled `<button>` when
 * the app has wired any event handler (click, double-click, etc.), otherwise as a
 * plain `<span>` — the same smart toggle the default row uses internally. */
export const AgendaEventButtonUsage: Story = {
  render: () => (
    <CalendarStage defaultView={Views.AGENDA} components={{ agenda: { event: BorderedAgendaEvent } }}>
      <Calendar />
    </CalendarStage>
  ),
}
AgendaEventButtonUsage.storyName = 'AgendaEventButton in Custom Row'
