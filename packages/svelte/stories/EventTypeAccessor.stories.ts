/**
 * Demonstrates the `type` accessor: assign a category string to each event,
 * configure `accessors: { type: 'type' }`, then use a custom event component
 * to map the category to a colour class.
 *
 * Ten CSS classes are injected via a `<style>` tag. Each class overrides the
 * `--bc-color-event-bg` and `--bc-color-event-fg` CSS custom properties that
 * the base `.bc-event` / `.bc-segment` rules consume.
 *
 * The selector pattern is:
 *   `.bc-event:has(.bc-event-type-{name}) { --bc-color-event-bg: …; }`
 */
import type { Meta, StoryObj } from '@storybook/svelte-vite'
import { EVENT_TYPES, type EventType } from './demoEvents'
import CalendarStory from './CalendarStory.svelte'
import TypedMonthEvent from './custom/TypedMonthEvent.svelte'
import TypedTimeEvent from './custom/TypedTimeEvent.svelte'
import { Views } from '@big-calendar/core'
import { demoEvents, FOCUS, NOW } from './harness'

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

if (typeof document !== 'undefined') {
  const el = document.createElement('style')
  el.textContent = TYPE_STYLES_CSS
  document.head.appendChild(el)
}

const meta: Meta = { title: 'Calendar/Event Type Accessor' }
export default meta
type Story = StoryObj<typeof meta>

export const MonthViewTyped: Story = {
  name: 'Month View — Event Types',
  render: () => ({
    Component: CalendarStory,
    props: {
      events: demoEvents,
      defaultDate: FOCUS,
      getNow: () => NOW,
      defaultView: Views.MONTH,
      accessors: { type: 'type' },
      components: { month: { event: TypedMonthEvent } },
    },
  }),
}

export const WeekViewTyped: Story = {
  name: 'Week View — Event Types',
  render: () => ({
    Component: CalendarStory,
    props: {
      events: demoEvents,
      defaultDate: FOCUS,
      getNow: () => NOW,
      defaultView: Views.WEEK,
      accessors: { type: 'type' },
      components: { time: { event: TypedTimeEvent } },
    },
  }),
}
