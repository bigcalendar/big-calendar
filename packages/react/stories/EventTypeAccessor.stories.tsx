import { Views } from '@big-calendar/core'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Calendar } from '../src'
import type { MonthEventProps, TimeEventProps } from '../src'
import { CalendarStage, type DemoEvent } from './harness'
import { EVENT_TYPES, type EventType } from './demoEvents'

/**
 * Demonstrates the `type` accessor: assign a category string to each event,
 * configure `accessors={{ type: 'type' }}` (the default field name), then use
 * a custom event component to map the category to a colour class.
 *
 * Ten CSS classes are defined inside the story's `<style>` tag. Each class
 * overrides the `--bc-color-event-bg` and `--bc-color-event-fg` CSS custom
 * properties that the base `.bc-event` / `.bc-segment` rules consume, so the
 * full event card — including hover and resize handles — automatically picks
 * up the correct palette without any inline-style hacks.
 *
 * The selector pattern is:
 *   `.bc-event:has(.bc-event-type-{name}) { --bc-color-event-bg: …; }`
 *
 * The custom slot component puts a `<span className="bc-event-type-{type}">`
 * inside the event button. The `:has()` selector on the outer button then
 * matches and applies the right variables.
 */

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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function typeClass(event: DemoEvent): string {
  return event.type ? `bc-event-type-${event.type}` : ''
}

// ─── Custom slot components ───────────────────────────────────────────────────

function TypedMonthEvent({ event, title }: MonthEventProps<DemoEvent>) {
  return <span className={typeClass(event)}>{title}</span>
}

function TypedTimeEvent({ event, title, time }: TimeEventProps<DemoEvent>) {
  return (
    <span
      className={typeClass(event)}
      style={{ display: 'flex', flexDirection: 'column', gap: '0.1em', overflow: 'hidden' }}
    >
      <strong style={{ fontSize: '0.85em', lineHeight: 1.2 }}>{title}</strong>
      <span style={{ fontSize: '0.7em', opacity: 0.75 }}>{time}</span>
    </span>
  )
}

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta = { title: 'Calendar/Event Type Accessor' }
export default meta
type Story = StoryObj<typeof meta>

// ─── Stories ─────────────────────────────────────────────────────────────────

export const MonthViewTyped: Story = {
  render: () => (
    <>
      <style>{TYPE_STYLES_CSS}</style>
      <CalendarStage
        defaultView={Views.MONTH}
        accessors={{ type: 'type' }}
        components={{ month: { event: TypedMonthEvent } }}
      >
        <Calendar />
      </CalendarStage>
    </>
  ),
}
MonthViewTyped.storyName = 'Month View — Event Types'

export const WeekViewTyped: Story = {
  render: () => (
    <>
      <style>{TYPE_STYLES_CSS}</style>
      <CalendarStage
        defaultView={Views.WEEK}
        accessors={{ type: 'type' }}
        components={{ time: { event: TypedTimeEvent } }}
      >
        <Calendar />
      </CalendarStage>
    </>
  ),
}
WeekViewTyped.storyName = 'Week View — Event Types'
