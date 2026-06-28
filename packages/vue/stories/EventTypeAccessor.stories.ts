/**
 * Demonstrates the `type` accessor: assign a category string to each event,
 * configure `:accessors="{ type: 'type' }"` (the default field name), then use
 * a custom event component to map the category to a colour class.
 *
 * Ten CSS classes are injected via the story setup. Each class overrides the
 * `--bc-color-event-bg` and `--bc-color-event-fg` CSS custom properties that
 * the base `.bc-event` / `.bc-segment` rules consume, so the full event card —
 * including hover and resize handles — automatically picks up the correct
 * palette without any inline-style hacks.
 *
 * The selector pattern is:
 *   `.bc-event:has(.bc-event-type-{name}) { --bc-color-event-bg: …; }`
 *
 * The custom slot component puts a `<span class="bc-event-type-{type}">` inside
 * the event button. The `:has()` selector on the outer button then matches and
 * applies the right variables.
 */
import type { Component } from 'vue'
import { onBeforeUnmount } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3-vite'
import Calendar from '../src/Calendar/Calendar.vue'
import CalendarProvider from '../src/CalendarProvider/CalendarProvider.vue'
import { demoEvents, EVENT_TYPES, type EventType } from './demoEvents'
import { FOCUS, localizer, NOW } from './harness'

// ─── Colour palette ───────────────────────────────────────────────────────────

const TYPE_COLORS: Record<EventType, { bg: string; fg: string }> = {
  'meeting':    { bg: '#b8d4f5', fg: '#1a3a5c' },
  'standup':    { bg: '#b8f0c8', fg: '#1a4d2a' },
  'review':     { bg: '#fdf5b0', fg: '#4d3e00' },
  'planning':   { bg: '#ffd9a0', fg: '#4d2a00' },
  'social':     { bg: '#f5b8d4', fg: '#5c1a3a' },
  'training':   { bg: '#d4b8f5', fg: '#3a1a5c' },
  'one-on-one': { bg: '#b8f0f0', fg: '#1a4d4d' },
  'demo':       { bg: '#f5c8b8', fg: '#5c2a1a' },
  'interview':  { bg: '#b8f5d4', fg: '#1a5c3a' },
  'holiday':    { bg: '#f5e4b8', fg: '#5c4a1a' },
}

const TYPE_STYLES_CSS = EVENT_TYPES.map((type) => {
  const { bg, fg } = TYPE_COLORS[type]
  return (
    `.bc-event:has(.bc-event-type-${type}),\n` +
    `.bc-segment:has(.bc-event-type-${type}) {\n` +
    `  --bc-color-event-bg: ${bg};\n` +
    `  --bc-color-event-fg: ${fg};\n` +
    `  --bc-color-event-hover-bg: color-mix(in oklab, ${bg}, CanvasText 20%);\n` +
    `}`
  )
}).join('\n')

// ─── Custom slot components ───────────────────────────────────────────────────

const TypedMonthEvent = {
  props: ['event', 'title'],
  template: `<span :class="event?.type ? 'bc-event-type-' + event.type : ''">{{ title }}</span>`,
}

const TypedTimeEvent = {
  props: ['event', 'title', 'time'],
  template: `
    <span
      :class="event?.type ? 'bc-event-type-' + event.type : ''"
      style="display:flex;flex-direction:column;gap:0.1em;overflow:hidden;"
    >
      <strong style="font-size:0.85em;line-height:1.2;">{{ title }}</strong>
      <span style="font-size:0.7em;opacity:0.75;">{{ time }}</span>
    </span>
  `,
}

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta = { title: 'Calendar/Event Type Accessor' }
export default meta
type Story = StoryObj<typeof meta>

// ─── Stories ─────────────────────────────────────────────────────────────────

export const MonthViewTyped: Story = {
  name: 'Month View — Event Types',
  render: () => ({
    components: { CalendarProvider, Calendar },
    setup() {
      const getNow = () => NOW
      const styleEl = document.createElement('style')
      styleEl.textContent = TYPE_STYLES_CSS
      document.head.appendChild(styleEl)
      onBeforeUnmount(() => document.head.removeChild(styleEl))
      const components = { month: { event: TypedMonthEvent as Component } }
      return { localizer, events: demoEvents, FOCUS, getNow, components }
    },
    template: `
      <div style="block-size:100dvh;inline-size:100%">
        <CalendarProvider
          :localizer="localizer"
          :events="events"
          :defaultDate="FOCUS"
          :getNow="getNow"
          :defaultView="'month'"
          :accessors="{ type: 'type' }"
          :components="components"
        >
          <Calendar />
        </CalendarProvider>
      </div>
    `,
  }),
}

export const WeekViewTyped: Story = {
  name: 'Week View — Event Types',
  render: () => ({
    components: { CalendarProvider, Calendar },
    setup() {
      const getNow = () => NOW
      const styleEl = document.createElement('style')
      styleEl.textContent = TYPE_STYLES_CSS
      document.head.appendChild(styleEl)
      onBeforeUnmount(() => document.head.removeChild(styleEl))
      const components = { time: { event: TypedTimeEvent as Component } }
      return { localizer, events: demoEvents, FOCUS, getNow, components }
    },
    template: `
      <div style="block-size:100dvh;inline-size:100%">
        <CalendarProvider
          :localizer="localizer"
          :events="events"
          :defaultDate="FOCUS"
          :getNow="getNow"
          :defaultView="'week'"
          :accessors="{ type: 'type' }"
          :components="components"
        >
          <Calendar />
        </CalendarProvider>
      </div>
    `,
  }),
}
