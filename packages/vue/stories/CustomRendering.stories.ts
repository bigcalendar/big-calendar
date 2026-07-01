/**
 * Each story here replaces one default slot component with a custom one.
 * The goal is to show exactly what data each slot receives and how little
 * code it takes to completely change how that part of the calendar looks.
 *
 * In Vue, custom slot components are plain component objects — any object
 * with a `props` declaration and a `template` string (or a `setup` render
 * function) is accepted. Pass them via `:components="{ month: { weekday: YourComp } }"`.
 *
 * All stories use the shared demo events from `harness.ts`.
 */
import type { Component } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { defineComponent, h } from 'vue'
import Calendar from '../src/Calendar/Calendar.vue'
import CalendarProvider from '../src/CalendarProvider/CalendarProvider.vue'
import EventButton from '../src/EventButton/EventButton.vue'
import AgendaEventButton from '../src/AgendaEventButton/AgendaEventButton.vue'
import Popover from '../src/Popover/Popover.vue'
import type { ShowMoreEvent } from '../src/components.type'
import { demoEvents, type DemoEvent, FOCUS, localizer, NOW } from './harness'

const meta: Meta = {
  title: 'Calendar/Custom Rendering',
}
export default meta

type Story = StoryObj<typeof meta>

// ─── Month view ───────────────────────────────────────────────────────────────

const BoldWeekday = {
  props: ['long', 'day', 'short'],
  template: `
    <div style="text-transform:uppercase;letter-spacing:0.08em;font-weight:700;
                background-color:rebeccapurple;color:white;padding:0.25em 0;text-align:center;">
      {{ long }}
    </div>
  `,
}

/** Replace \`components.month.weekday\` with a custom column heading that renders
 * the full weekday name in uppercase purple. */
export const MonthWeekday: Story = {
  name: 'Custom Month Weekday',
  render: () => ({
    components: { CalendarProvider, Calendar },
    setup() {
      const getNow = () => NOW
      const components = { month: { weekday: BoldWeekday as Component } }
      return { localizer, events: demoEvents, FOCUS, getNow, components }
    },
    template: `
      <div style="block-size:100dvh;inline-size:100%">
        <CalendarProvider
          :localizer="localizer" :events="events" :defaultDate="FOCUS"
          :getNow="getNow" :defaultView="'month'" :components="components"
        >
          <Calendar />
        </CalendarProvider>
      </div>
    `,
  }),
}

// ─────────────────────────────────────────────────────────────────────────────

const HighlightedDateCell = {
  props: ['label', 'isToday', 'isOffRange', 'onDrillDown', 'day'],
  template: `
    <button
      type="button"
      @click="onDrillDown"
      :style="{
        background: isToday ? 'rebeccapurple' : 'none',
        color: isToday ? 'white' : isOffRange ? '#aaa' : 'inherit',
        border: 'none',
        borderRadius: '50%',
        width: '2em',
        height: '2em',
        cursor: 'pointer',
        fontWeight: isToday ? 700 : 400,
      }"
    >{{ label }}</button>
  `,
}

/** Replace \`components.month.dateCell\` to give today a filled circle treatment.
 * Click any date to drill down into the day view. */
export const MonthDateCell: Story = {
  name: 'Custom Month Date Cell',
  render: () => ({
    components: { CalendarProvider, Calendar },
    setup() {
      const getNow = () => NOW
      const components = { month: { dateCell: HighlightedDateCell as Component } }
      return { localizer, events: demoEvents, FOCUS, getNow, components }
    },
    template: `
      <div style="block-size:100dvh;inline-size:100%">
        <CalendarProvider
          :localizer="localizer" :events="events" :defaultDate="FOCUS"
          :getNow="getNow" :defaultView="'month'" :components="components"
        >
          <Calendar />
        </CalendarProvider>
      </div>
    `,
  }),
}

// ─────────────────────────────────────────────────────────────────────────────

const PillEvent = {
  props: ['title', 'event'],
  template: `
    <span style="display:flex;align-items:center;gap:0.35em;font-style:italic;">
      <span style="display:inline-block;width:0.5em;height:0.5em;border-radius:50%;
                   background:currentColor;flex-shrink:0;" />
      {{ title }}
    </span>
  `,
}

/** Replace \`components.month.event\` to render a small dot before each event title. */
export const MonthEvent: Story = {
  name: 'Custom Month Event',
  render: () => ({
    components: { CalendarProvider, Calendar },
    setup() {
      const getNow = () => NOW
      const components = { month: { event: PillEvent as Component } }
      return { localizer, events: demoEvents, FOCUS, getNow, components }
    },
    template: `
      <div style="block-size:100dvh;inline-size:100%">
        <CalendarProvider
          :localizer="localizer" :events="events" :defaultDate="FOCUS"
          :getNow="getNow" :defaultView="'month'" :components="components"
        >
          <Calendar />
        </CalendarProvider>
      </div>
    `,
  }),
}

// ─────────────────────────────────────────────────────────────────────────────

const MinimalShowMore = defineComponent({
  name: 'MinimalShowMore',
  props: {
    count: Number,
    label: String,
    day: String,
    events: Array as () => ReadonlyArray<ShowMoreEvent<DemoEvent>>,
    eventSlot: Object as () => Component,
  },
  setup(props) {
    return () =>
      h(
        Popover,
        { placement: 'bottom-start', sameWidth: true, className: 'bc-popover bc-show-more-popover' },
        {
          trigger: ({ setAnchor, popoverTarget, ariaHaspopup, ariaExpanded, ariaControls }: Record<string, unknown>) =>
            h(
              'button',
              {
                ref: setAnchor as (el: unknown) => void,
                popovertarget: popoverTarget,
                'aria-haspopup': ariaHaspopup,
                'aria-expanded': ariaExpanded,
                'aria-controls': ariaControls,
                type: 'button',
                style: {
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
                },
              },
              `${props.count} more ›`,
            ),
          default: () =>
            (props.events ?? []).map((item) =>
              h(
                EventButton,
                { key: item.key, class: 'bc-segment', event: item.event, title: item.title, resizeEdges: [] },
                { default: () => h(props.eventSlot as Component, { event: item.event, title: item.title }) },
              ),
            ),
        },
      )
  },
})

/** Replace \`components.month.showMore\` with a custom trigger that opens the
 * same popover but with a plain-text link style. */
export const MonthShowMore: Story = {
  name: 'Custom Month Show More',
  render: () => ({
    components: { CalendarProvider, Calendar },
    setup() {
      const getNow = () => NOW
      const components = { month: { showMore: MinimalShowMore as Component } }
      return { localizer, events: demoEvents, FOCUS, getNow, components }
    },
    template: `
      <div style="block-size:100dvh;inline-size:100%">
        <CalendarProvider
          :localizer="localizer" :events="events" :defaultDate="FOCUS"
          :getNow="getNow" :defaultView="'month'"
          :components="components"
        >
          <Calendar />
        </CalendarProvider>
      </div>
    `,
  }),
}

// ─── Time grid view ──────────────────────────────────────────────────────────

const AccentedDayHeading = {
  props: ['label', 'day', 'isToday', 'onDrillDown'],
  template: `
    <button
      type="button"
      @click="onDrillDown"
      :style="{
        background: isToday ? 'rebeccapurple' : 'transparent',
        color: isToday ? 'white' : 'inherit',
        border: 'none',
        borderRadius: '0.25em',
        padding: '0.2em 0.6em',
        cursor: 'pointer',
        fontWeight: isToday ? 700 : 400,
        width: '100%',
      }"
    >{{ label }}</button>
  `,
}

/** Replace \`components.time.dayHeading\` to highlight today's column with a
 * filled purple background. Click a heading to drill into the day view. */
export const TimeDayHeading: Story = {
  name: 'Custom Time Day Heading',
  render: () => ({
    components: { CalendarProvider, Calendar },
    setup() {
      const getNow = () => NOW
      const components = { time: { dayHeading: AccentedDayHeading as Component } }
      return { localizer, events: demoEvents, FOCUS, getNow, components }
    },
    template: `
      <div style="block-size:100dvh;inline-size:100%">
        <CalendarProvider
          :localizer="localizer" :events="events" :defaultDate="FOCUS"
          :getNow="getNow" :defaultView="'week'" :components="components"
        >
          <Calendar />
        </CalendarProvider>
      </div>
    `,
  }),
}

// ─────────────────────────────────────────────────────────────────────────────

const ItalicTimeLabel = {
  props: ['label', 'time'],
  template: `<span style="font-style:italic;color:darkcyan;font-size:0.8em;">{{ label }}</span>`,
}

/** Replace \`components.time.timeLabel\` to render gutter labels in italic teal. */
export const TimeLabel: Story = {
  name: 'Custom Time Label',
  render: () => ({
    components: { CalendarProvider, Calendar },
    setup() {
      const getNow = () => NOW
      const components = { time: { timeLabel: ItalicTimeLabel as Component } }
      return { localizer, events: demoEvents, FOCUS, getNow, components }
    },
    template: `
      <div style="block-size:100dvh;inline-size:100%">
        <CalendarProvider
          :localizer="localizer" :events="events" :defaultDate="FOCUS"
          :getNow="getNow" :defaultView="'week'" :components="components"
        >
          <Calendar />
        </CalendarProvider>
      </div>
    `,
  }),
}

// ─────────────────────────────────────────────────────────────────────────────

const StackedTimeEvent = {
  props: ['title', 'time', 'event'],
  template: `
    <div style="display:flex;flex-direction:column;gap:0.1em;padding:0.1em 0;">
      <span style="font-weight:700;font-size:0.85em;line-height:1.2;">{{ title }}</span>
      <span style="font-size:0.7em;opacity:0.75;">{{ time }}</span>
    </div>
  `,
}

/** Replace \`components.time.event\` to render the title and time on separate
 * lines inside the event box, with the title bold. */
export const TimeEvent: Story = {
  name: 'Custom Time Event',
  render: () => ({
    components: { CalendarProvider, Calendar },
    setup() {
      const getNow = () => NOW
      const components = { time: { event: StackedTimeEvent as Component } }
      return { localizer, events: demoEvents, FOCUS, getNow, components }
    },
    template: `
      <div style="block-size:100dvh;inline-size:100%">
        <CalendarProvider
          :localizer="localizer" :events="events" :defaultDate="FOCUS"
          :getNow="getNow" :defaultView="'week'" :components="components"
        >
          <Calendar />
        </CalendarProvider>
      </div>
    `,
  }),
}

// ─────────────────────────────────────────────────────────────────────────────

const TaggedAllDayEvent = {
  props: ['title', 'event'],
  template: `
    <span style="display:flex;align-items:center;gap:0.25em;font-style:italic;
                 overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
      <span style="display:inline-block;width:0.4em;height:0.4em;border-radius:50%;
                   background:currentColor;flex-shrink:0;" />
      {{ title }}
    </span>
  `,
}

/** Replace \`components.time.allDayEvent\` to add a small dot before each all-day
 * event title in the time-grid header strip. */
export const TimeAllDayEvent: Story = {
  name: 'Custom Time All-Day Event',
  render: () => ({
    components: { CalendarProvider, Calendar },
    setup() {
      const getNow = () => NOW
      const components = { time: { allDayEvent: TaggedAllDayEvent as Component } }
      return { localizer, events: demoEvents, FOCUS, getNow, components }
    },
    template: `
      <div style="block-size:100dvh;inline-size:100%">
        <CalendarProvider
          :localizer="localizer" :events="events" :defaultDate="FOCUS"
          :getNow="getNow" :defaultView="'week'" :components="components"
        >
          <Calendar />
        </CalendarProvider>
      </div>
    `,
  }),
}

// ─────────────────────────────────────────────────────────────────────────────

const CompactTimeShowMore = defineComponent({
  name: 'CompactTimeShowMore',
  props: {
    count: Number,
    label: String,
    events: Array as () => ReadonlyArray<ShowMoreEvent<DemoEvent>>,
    eventSlot: Object as () => Component,
  },
  setup(props) {
    return () =>
      h(
        Popover,
        { placement: 'bottom-start', sameWidth: true, className: 'bc-popover bc-show-more-popover' },
        {
          trigger: ({ setAnchor, popoverTarget, ariaHaspopup, ariaExpanded, ariaControls }: Record<string, unknown>) =>
            h(
              'button',
              {
                ref: setAnchor as (el: unknown) => void,
                popovertarget: popoverTarget,
                'aria-haspopup': ariaHaspopup,
                'aria-expanded': ariaExpanded,
                'aria-controls': ariaControls,
                type: 'button',
                style: {
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
                  cursor: 'pointer',
                  pointerEvents: 'auto',
                },
              },
              `+${props.count}`,
            ),
          default: () =>
            (props.events ?? []).map((item) =>
              h(
                EventButton,
                { key: item.key, class: 'bc-segment', event: item.event, title: item.title, resizeEdges: [] },
                { default: () => h(props.eventSlot as Component, { event: item.event, title: item.title }) },
              ),
            ),
        },
      )
  },
})

const timeShowMoreEvents: DemoEvent[] = [
  ...demoEvents,
  { id: 211, title: 'Engineering Summit', allDay: true, start: '2026-06-15T00:00:00.000Z', end: '2026-06-17T00:00:00.000Z' },
  { id: 212, title: 'Product Sprint',     allDay: true, start: '2026-06-15T00:00:00.000Z', end: '2026-06-20T00:00:00.000Z' },
  { id: 213, title: 'Code Freeze',        allDay: true, start: '2026-06-16T00:00:00.000Z', end: '2026-06-18T00:00:00.000Z' },
  { id: 214, title: 'Release Week',       allDay: true, start: '2026-06-15T00:00:00.000Z', end: '2026-06-20T00:00:00.000Z' },
]

/** Replace \`components.time.showMore\` with a compact "+N" badge trigger that
 * opens the same popover as the default. Extra all-day events are added to the
 * focus week so the strip overflows and the indicator is visible immediately. */
export const TimeShowMore: Story = {
  name: 'Custom Time Show More',
  render: () => ({
    components: { CalendarProvider, Calendar },
    setup() {
      const getNow = () => NOW
      const components = { time: { showMore: CompactTimeShowMore as Component } }
      return { localizer, events: timeShowMoreEvents, FOCUS, getNow, components }
    },
    template: `
      <div style="block-size:100dvh;inline-size:100%">
        <CalendarProvider
          :localizer="localizer" :events="events" :defaultDate="FOCUS"
          :getNow="getNow" :defaultView="'week'" :showAllEvents="false"
          :components="components"
        >
          <Calendar />
        </CalendarProvider>
      </div>
    `,
  }),
}

// ─── Agenda view ─────────────────────────────────────────────────────────────

const RuledAgendaDate = {
  props: ['label', 'day'],
  template: `
    <div style="font-weight:700;text-transform:uppercase;letter-spacing:0.06em;
                font-size:0.8em;border-bottom:2px solid rebeccapurple;
                padding-bottom:0.2em;color:rebeccapurple;">
      {{ label }}
    </div>
  `,
}

/** Replace \`components.agenda.date\` to render each day heading in uppercase
 * with an underline accent. */
export const AgendaDate: Story = {
  name: 'Custom Agenda Date',
  render: () => ({
    components: { CalendarProvider, Calendar },
    setup() {
      const getNow = () => NOW
      const components = { agenda: { date: RuledAgendaDate as Component } }
      return { localizer, events: demoEvents, FOCUS, getNow, components }
    },
    template: `
      <div style="block-size:100dvh;inline-size:100%">
        <CalendarProvider
          :localizer="localizer" :events="events" :defaultDate="FOCUS"
          :getNow="getNow" :defaultView="'agenda'" :components="components"
        >
          <Calendar />
        </CalendarProvider>
      </div>
    `,
  }),
}

// ─────────────────────────────────────────────────────────────────────────────

const TwoColumnAgendaEvent = {
  props: ['title', 'time', 'allDay', 'event'],
  template: `
    <div style="display:grid;grid-template-columns:7rem 1fr;gap:0.75rem;
                align-items:baseline;padding:0.3rem 0;">
      <span style="color:gray;font-variant-numeric:tabular-nums;font-size:0.85em;">
        {{ allDay ? 'all day' : time }}
      </span>
      <strong>{{ title }}</strong>
    </div>
  `,
}

/** Replace \`components.agenda.event\` to render a two-column grid row with the
 * time left-aligned and the title bold on the right. */
export const AgendaEvent: Story = {
  name: 'Custom Agenda Event',
  render: () => ({
    components: { CalendarProvider, Calendar },
    setup() {
      const getNow = () => NOW
      const components = { agenda: { event: TwoColumnAgendaEvent as Component } }
      return { localizer, events: demoEvents, FOCUS, getNow, components }
    },
    template: `
      <div style="block-size:100dvh;inline-size:100%">
        <CalendarProvider
          :localizer="localizer" :events="events" :defaultDate="FOCUS"
          :getNow="getNow" :defaultView="'agenda'" :components="components"
        >
          <Calendar />
        </CalendarProvider>
      </div>
    `,
  }),
}

// ─────────────────────────────────────────────────────────────────────────────

const CustomEmptyState = {
  props: ['message'],
  template: `
    <div style="display:flex;flex-direction:column;align-items:center;
                justify-content:center;padding:4rem 2rem;gap:0.75rem;color:#888;">
      <div style="font-size:2rem;line-height:1;">(  )</div>
      <p style="margin:0;font-size:0.9em;">{{ message }}</p>
    </div>
  `,
}

/** Replace \`components.agenda.empty\` to show a custom empty state. An empty
 * \`events\` array is passed so the empty state is visible immediately. */
export const AgendaEmpty: Story = {
  name: 'Custom Agenda Empty State',
  render: () => ({
    components: { CalendarProvider, Calendar },
    setup() {
      const getNow = () => NOW
      const components = { agenda: { empty: CustomEmptyState as Component } }
      return { localizer, events: [], FOCUS, getNow, components }
    },
    template: `
      <div style="block-size:100dvh;inline-size:100%">
        <CalendarProvider
          :localizer="localizer" :events="events" :defaultDate="FOCUS"
          :getNow="getNow" :defaultView="'agenda'" :components="components"
        >
          <Calendar />
        </CalendarProvider>
      </div>
    `,
  }),
}

// ─────────────────────────────────────────────────────────────────────────────

const BorderedAgendaEvent = defineComponent({
  name: 'BorderedAgendaEvent',
  props: {
    event: Object as () => DemoEvent,
    title: String,
    time: String,
    allDay: Boolean,
  },
  setup(props) {
    return () =>
      h(
        'div',
        {
          style: {
            display: 'grid',
            gridTemplateColumns: '6rem 1fr',
            gap: '0.5rem',
            alignItems: 'baseline',
            borderLeft: '3px solid rebeccapurple',
            padding: '0.25rem 0 0.25rem 0.75rem',
          },
        },
        [
          h('span', { style: { color: 'gray', fontSize: '0.8em' } }, props.allDay ? 'all day' : props.time),
          h(AgendaEventButton, { event: props.event, title: props.title ?? '' }),
        ],
      )
  },
})

/** Replace \`components.agenda.event\` with a custom row that uses \`AgendaEventButton\`
 * directly. \`AgendaEventButton\` renders the title as a link-styled \`<button>\` when
 * the app has wired any event handler, otherwise as a plain \`<span>\` — the same
 * smart toggle the default row uses internally. */
export const AgendaEventButtonUsage: Story = {
  name: 'AgendaEventButton in Custom Row',
  render: () => ({
    components: { CalendarProvider, Calendar },
    setup() {
      const getNow = () => NOW
      const components = { agenda: { event: BorderedAgendaEvent as Component } }
      return { localizer, events: demoEvents, FOCUS, getNow, components }
    },
    template: `
      <div style="block-size:100dvh;inline-size:100%">
        <CalendarProvider
          :localizer="localizer" :events="events" :defaultDate="FOCUS"
          :getNow="getNow" :defaultView="'agenda'" :components="components"
        >
          <Calendar />
        </CalendarProvider>
      </div>
    `,
  }),
}
