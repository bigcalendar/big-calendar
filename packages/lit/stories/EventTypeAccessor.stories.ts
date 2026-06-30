/**
 * Demonstrates the `type` accessor: assign a category string to each event,
 * configure `.accessors=${{ type: 'type' }}` (the default field name), then use
 * CSS to colour event blocks by category.
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
 * In Lit stories, "custom rendering" for events is set via the `components`
 * property on `bc-calendar`. The `components.month.event` and
 * `components.time.event` slots receive a function that returns a `TemplateResult`.
 */
import { html } from 'lit'
import { Views } from '@big-calendar/core'
import type { Meta, StoryObj } from '@storybook/web-components-vite'
import '@big-calendar/lit'
import { demoEvents, EVENT_TYPES, type EventType } from './demoEvents'
import { FOCUS, litLocalizer, NOW } from './harness'

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

function injectStyles(): () => void {
  const el = document.createElement('style')
  el.textContent = TYPE_STYLES_CSS
  document.head.appendChild(el)
  return () => document.head.removeChild(el)
}

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta = { title: 'Calendar/Event Type Accessor' }
export default meta
type Story = StoryObj<typeof meta>

// ─── Stories ─────────────────────────────────────────────────────────────────

/**
 * Month view coloured by event type. Each event has a `type` string field;
 * the `type` accessor maps it to a `.bc-event-type-{type}` class inside the
 * segment button. The `:has()` selector on `.bc-segment` picks up the colour
 * variables without any inline-style hacks.
 */
export const MonthViewTyped: Story = {
  name: 'Month View — Event Types',
  render: () => {
    const cleanup = injectStyles()
    const monthEventRenderer = (event: Record<string, unknown>, title: string) =>
      html`<span class=${event.type ? `bc-event-type-${String(event.type)}` : ''}>${title}</span>`

    // Cleanup must happen when the story is torn down.
    // We attach the cleanup to the rendered container via a lifecycle trick:
    // the container's disconnectedCallback equivalent for plain DOM is
    // relying on a MutationObserver. For simplicity, we clean up on next render.
    const el = document.createElement('div')
    el.style.cssText = 'block-size:100dvh;inline-size:100%'
    el.addEventListener('disconnected-bc-story', cleanup, { once: true })

    const calEl = document.createElement('bc-calendar') as HTMLElement & Record<string, unknown>
    calEl.style.cssText = 'display:block;block-size:100dvh;inline-size:100%'
    calEl.localizer = litLocalizer.current
    calEl.events = demoEvents
    calEl.defaultDate = FOCUS
    calEl.getNow = () => NOW
    calEl.defaultView = Views.MONTH
    calEl.accessors = { type: 'type' }
    calEl.components = { month: { event: monthEventRenderer } }

    window.addEventListener('bc-localizer-change', () => {
      calEl.localizer = litLocalizer.current
    })

    calEl.innerHTML = `
      <div class="bc-calendar">
        <bc-default-toolbar></bc-default-toolbar>
        <bc-month-view></bc-month-view>
        <bc-time-grid-view></bc-time-grid-view>
        <bc-agenda-view></bc-agenda-view>
      </div>
    `

    el.appendChild(calEl)
    return el
  },
}

/**
 * Week view coloured by event type. The `components.time.event` renderer
 * renders a `<span class="bc-event-type-{type}">` inside each event card,
 * letting the `:has()` CSS selector on `.bc-event` apply the colour variables.
 */
export const WeekViewTyped: Story = {
  name: 'Week View — Event Types',
  render: () => {
    const cleanup = injectStyles()
    const timeEventRenderer = (
      event: Record<string, unknown>,
      title: string,
      time: string,
    ) =>
      html`
        <span
          class=${event.type ? `bc-event-type-${String(event.type)}` : ''}
          style="display:flex;flex-direction:column;gap:0.1em;overflow:hidden;"
        >
          <strong style="font-size:0.85em;line-height:1.2;">${title}</strong>
          <span style="font-size:0.7em;opacity:0.75;">${time}</span>
        </span>
      `

    const el = document.createElement('div')
    el.style.cssText = 'block-size:100dvh;inline-size:100%'

    const calEl = document.createElement('bc-calendar') as HTMLElement & Record<string, unknown>
    calEl.style.cssText = 'display:block;block-size:100dvh;inline-size:100%'
    calEl.localizer = litLocalizer.current
    calEl.events = demoEvents
    calEl.defaultDate = FOCUS
    calEl.getNow = () => NOW
    calEl.defaultView = Views.WEEK
    calEl.accessors = { type: 'type' }
    calEl.components = { time: { event: timeEventRenderer } }

    window.addEventListener('bc-localizer-change', () => {
      calEl.localizer = litLocalizer.current
    })

    calEl.innerHTML = `
      <div class="bc-calendar">
        <bc-default-toolbar></bc-default-toolbar>
        <bc-month-view></bc-month-view>
        <bc-time-grid-view></bc-time-grid-view>
        <bc-agenda-view></bc-agenda-view>
      </div>
    `

    el.appendChild(calEl)
    return el
  },
}
