/**
 * These stories demonstrate CSS-based customization of calendar elements.
 *
 * The Lit adapter uses light DOM (no shadow DOM), so every element is directly
 * accessible from the page's stylesheet. You can target any Big Calendar class
 * — `.bc-weekday`, `.bc-date-number`, `.bc-segment`, `.bc-event`, `.bc-gutter-label`,
 * `.bc-day-heading`, etc. — without `::part()` or `::slotted()`.
 *
 * **Render function customization** (the `components` prop from the React/Vue/Angular
 * adapters) is on the Lit roadmap. For the current release, CSS is the primary
 * customization surface and already covers the most common use-cases.
 */
import { html } from 'lit'
import { Views } from '@big-calendar/core'
import type { Meta, StoryObj } from '@storybook/web-components-vite'
import '@big-calendar/lit'
import { demoEvents, FOCUS, litLocalizer, NOW } from './harness'

const meta: Meta = {
  title: 'Calendar/Custom Rendering',
}
export default meta

type Story = StoryObj<typeof meta>

// ─── Helpers ──────────────────────────────────────────────────────────────────

function withStyles(css: string, node: HTMLElement): HTMLElement {
  const style = document.createElement('style')
  style.textContent = css
  const wrapper = document.createElement('div')
  wrapper.style.cssText = 'block-size:100dvh;inline-size:100%'
  wrapper.appendChild(style)
  wrapper.appendChild(node)
  return wrapper
}

function calendarEl(opts: {
  defaultView?: string
  views?: string[]
  events?: unknown[]
  extra?: Record<string, unknown>
}): HTMLElement & Record<string, unknown> {
  const el = document.createElement('bc-calendar') as HTMLElement & Record<string, unknown>
  el.style.cssText = 'display:block;block-size:100dvh;inline-size:100%'
  el.localizer = litLocalizer.current
  el.events = opts.events ?? demoEvents
  el.defaultDate = FOCUS
  el.getNow = () => NOW
  el.defaultView = opts.defaultView ?? Views.MONTH
  if (opts.views) el.views = opts.views
  Object.assign(el, opts.extra ?? {})
  window.addEventListener('bc-localizer-change', () => {
    el.localizer = litLocalizer.current
  })
  el.innerHTML = `
    <div class="bc-calendar">
      <bc-default-toolbar></bc-default-toolbar>
      <bc-month-view></bc-month-view>
      <bc-time-grid-view></bc-time-grid-view>
      <bc-agenda-view></bc-agenda-view>
    </div>
  `
  return el
}

// ─── Month view ───────────────────────────────────────────────────────────────

/**
 * Override `.bc-weekday` to render the day-column headers in uppercase purple.
 * All Big Calendar elements are in the light DOM so any selector works without
 * `::part()` indirection.
 */
export const MonthWeekday: Story = {
  name: 'Custom Month Weekday',
  render: () =>
    withStyles(
      `.bc-weekday {
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-weight: 700;
        background-color: rebeccapurple;
        color: white;
        padding: 0.25em 0;
        text-align: center;
      }`,
      calendarEl({ defaultView: Views.MONTH }),
    ),
}

/**
 * Override `.bc-date-number` — the drilldown button inside each date cell —
 * to give today a filled circle treatment.
 */
export const MonthDateCell: Story = {
  name: 'Custom Month Date Cell',
  render: () =>
    withStyles(
      `.bc-date-number {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 2em;
        height: 2em;
        border-radius: 50%;
        border: none;
        cursor: pointer;
        font-weight: 400;
      }
      .bc-today .bc-date-number {
        background: rebeccapurple;
        color: white;
        font-weight: 700;
      }
      .bc-off-range .bc-date-number {
        color: #aaa;
      }`,
      calendarEl({ defaultView: Views.MONTH }),
    ),
}

/**
 * Override `.bc-segment` to add a small dot before each event title using a
 * `::before` pseudo-element.
 */
export const MonthEvent: Story = {
  name: 'Custom Month Event',
  render: () =>
    withStyles(
      `.bc-segment .bc-event-title::before {
        content: '';
        display: inline-block;
        width: 0.5em;
        height: 0.5em;
        border-radius: 50%;
        background: currentColor;
        margin-inline-end: 0.35em;
        flex-shrink: 0;
        vertical-align: middle;
      }
      .bc-segment .bc-event-title {
        display: flex;
        align-items: center;
        font-style: italic;
      }`,
      calendarEl({ defaultView: Views.MONTH }),
    ),
}

// ─── Time grid view ──────────────────────────────────────────────────────────

/**
 * Override `.bc-day-heading` buttons inside the time grid to highlight today's
 * column with a filled purple background.
 */
export const TimeDayHeading: Story = {
  name: 'Custom Time Day Heading',
  render: () =>
    withStyles(
      `.bc-day-heading {
        width: 100%;
        border: none;
        background: transparent;
        border-radius: 0.25em;
        padding: 0.2em 0.6em;
        cursor: pointer;
        font-weight: 400;
      }
      .bc-day-column.bc-today .bc-day-heading {
        background: rebeccapurple;
        color: white;
        font-weight: 700;
      }`,
      calendarEl({ defaultView: Views.WEEK }),
    ),
}

/**
 * Override `.bc-gutter-label` to render time-gutter labels in italic teal.
 */
export const TimeLabel: Story = {
  name: 'Custom Time Label',
  render: () =>
    withStyles(
      `.bc-gutter-label {
        font-style: italic;
        color: darkcyan;
        font-size: 0.8em;
      }`,
      calendarEl({ defaultView: Views.WEEK }),
    ),
}

/**
 * Override `.bc-event` inside time-grid columns to stack the title and time
 * on separate lines.
 */
export const TimeEvent: Story = {
  name: 'Custom Time Event',
  render: () =>
    withStyles(
      `.bc-event .bc-event-title {
        display: flex;
        flex-direction: column;
        gap: 0.1em;
      }
      .bc-event .bc-event-title::after {
        /* The time string is not in a separate element by default.
           Subclass TimeGridViewElement or use renderTimeEvent for full control. */
      }`,
      calendarEl({ defaultView: Views.WEEK }),
    ),
}

// ─── Agenda view ─────────────────────────────────────────────────────────────

/**
 * Override `.bc-agenda-date-cell` to render each day heading in uppercase with
 * a purple underline.
 */
export const AgendaDate: Story = {
  name: 'Custom Agenda Date',
  render: () =>
    withStyles(
      `.bc-agenda-date-cell {
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        font-size: 0.8em;
        border-bottom: 2px solid rebeccapurple;
        padding-bottom: 0.2em;
        color: rebeccapurple;
      }`,
      calendarEl({ defaultView: Views.AGENDA }),
    ),
}

/**
 * Override `.bc-agenda-event-cell` to add a left purple border accent and
 * a two-column layout (time + title).
 */
export const AgendaEvent: Story = {
  name: 'Custom Agenda Event',
  render: () =>
    withStyles(
      `.bc-agenda-event-cell {
        border-left: 3px solid rebeccapurple;
        padding-inline-start: 0.75rem;
      }`,
      calendarEl({ defaultView: Views.AGENDA }),
    ),
}

/**
 * Show the agenda empty state by passing an empty `events` array.
 * Override `.bc-agenda-empty` to style it differently.
 */
export const AgendaEmpty: Story = {
  name: 'Custom Agenda Empty State',
  render: () =>
    withStyles(
      `.bc-agenda-empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 4rem 2rem;
        gap: 0.75rem;
        color: #888;
        font-size: 0.9em;
      }`,
      calendarEl({ defaultView: Views.AGENDA, events: [] }),
    ),
}
