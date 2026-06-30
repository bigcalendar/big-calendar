/**
 * Demonstrates the `type` accessor: assign a category string to each event,
 * configure `[accessors]="{ type: 'type' }"` (the default field name), then use
 * an `ng-template` slot to map the category to a colour class.
 *
 * Ten CSS classes are injected via `ngOnInit`. Each class overrides the
 * `--bc-color-event-bg` and `--bc-color-event-fg` CSS custom properties that
 * the base `.bc-event` / `.bc-segment` rules consume, so the full event card —
 * including hover and resize handles — automatically picks up the correct
 * palette without any inline-style hacks.
 *
 * The selector pattern is:
 *   `.bc-event:has(.bc-event-type-{name}) { --bc-color-event-bg: …; }`
 *
 * The `ng-template` puts a `<span class="bc-event-type-{type}">` inside the
 * event button. The `:has()` selector on the outer button then matches and
 * applies the right variables.
 */
import { Component, TemplateRef, ViewChild } from '@angular/core'
import type { OnDestroy, OnInit } from '@angular/core'
import type { Meta, StoryObj } from '@storybook/angular'
import { CalendarProviderComponent } from '../src/CalendarProvider/CalendarProviderComponent'
import { CalendarComponent } from '../src/CalendarComponent/CalendarComponent'
import { MonthViewComponent } from '../src/MonthViewComponent/MonthViewComponent'
import { TimeGridViewComponent } from '../src/TimeGridViewComponent/TimeGridViewComponent'
import { demoEvents, EVENT_TYPES, type EventType } from './demoEvents'
import { FOCUS, localizer, NOW } from './harness'

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

interface TypedEvent { id: number; title: string; start: string; end: string; type?: EventType }

@Component({
  selector: 'story-event-type-month',
  standalone: true,
  imports: [CalendarProviderComponent, CalendarComponent, MonthViewComponent],
  template: `
    <div style="block-size: 100dvh; inline-size: 100%">
      <bc-calendar-provider
        [localizer]="loc"
        [events]="events"
        [defaultDate]="FOCUS"
        [getNow]="getNow"
        defaultView="month"
        [accessors]="{ type: 'type' }"
      >
        <div class="bc-calendar">
          <bc-month-view [bcMonthEvent]="typedMonthEvent" />
        </div>
      </bc-calendar-provider>
    </div>
    <ng-template #typedMonthEvent let-ctx>
      <span [class]="ctx.event?.type ? 'bc-event-type-' + ctx.event.type : ''">{{ ctx.title }}</span>
    </ng-template>
  `,
})
class EventTypeMonthComponent implements OnInit, OnDestroy {
  readonly loc = localizer
  readonly events: TypedEvent[] = demoEvents as TypedEvent[]
  readonly FOCUS = FOCUS
  readonly getNow = () => NOW
  @ViewChild('typedMonthEvent') typedMonthEvent!: TemplateRef<unknown>
  private styleEl!: HTMLStyleElement

  ngOnInit() {
    this.styleEl = document.createElement('style')
    this.styleEl.textContent = TYPE_STYLES_CSS
    document.head.appendChild(this.styleEl)
  }
  ngOnDestroy() { document.head.removeChild(this.styleEl) }
}

@Component({
  selector: 'story-event-type-week',
  standalone: true,
  imports: [CalendarProviderComponent, CalendarComponent, TimeGridViewComponent],
  template: `
    <div style="block-size: 100dvh; inline-size: 100%">
      <bc-calendar-provider
        [localizer]="loc"
        [events]="events"
        [defaultDate]="FOCUS"
        [getNow]="getNow"
        defaultView="week"
        [accessors]="{ type: 'type' }"
      >
        <div class="bc-calendar">
          <bc-time-grid-view [bcTimeEvent]="typedTimeEvent" />
        </div>
      </bc-calendar-provider>
    </div>
    <ng-template #typedTimeEvent let-ctx>
      <span
        [class]="ctx.event?.type ? 'bc-event-type-' + ctx.event.type : ''"
        style="display: flex; flex-direction: column; gap: 0.1em; overflow: hidden"
      >
        <strong style="font-size: 0.85em; line-height: 1.2">{{ ctx.title }}</strong>
        <span style="font-size: 0.7em; opacity: 0.75">{{ ctx.time }}</span>
      </span>
    </ng-template>
  `,
})
class EventTypeWeekComponent implements OnInit, OnDestroy {
  readonly loc = localizer
  readonly events: TypedEvent[] = demoEvents as TypedEvent[]
  readonly FOCUS = FOCUS
  readonly getNow = () => NOW
  @ViewChild('typedTimeEvent') typedTimeEvent!: TemplateRef<unknown>
  private styleEl!: HTMLStyleElement

  ngOnInit() {
    this.styleEl = document.createElement('style')
    this.styleEl.textContent = TYPE_STYLES_CSS
    document.head.appendChild(this.styleEl)
  }
  ngOnDestroy() { document.head.removeChild(this.styleEl) }
}

const meta: Meta = { title: 'Calendar/Event Type Accessor' }
export default meta

export const MonthViewTyped = {
  name: 'Month View — Event Types',
  render: () => ({
    template: '<story-event-type-month></story-event-type-month>',
    moduleMetadata: { imports: [EventTypeMonthComponent] },
  }),
}

export const WeekViewTyped = {
  name: 'Week View — Event Types',
  render: () => ({
    template: '<story-event-type-week></story-event-type-week>',
    moduleMetadata: { imports: [EventTypeWeekComponent] },
  }),
}
