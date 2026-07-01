import { Views } from '@big-calendar/core'
import { Component, signal } from '@angular/core'
import type { Meta, StoryObj } from '@storybook/angular'
import { CalendarProviderComponent } from '../src/CalendarProvider/CalendarProviderComponent'
import { CalendarComponent } from '../src/CalendarComponent/CalendarComponent'
import { CalendarDndDirective } from '../src/CalendarDnd/CalendarDndDirective'
import { demoEvents, type DemoEvent, FOCUS, localizer, NOW } from './harness'

type DndPayload = { event: DemoEvent; start: string; end: string; allDay: boolean }

@Component({
  selector: 'story-event-dnd',
  standalone: true,
  imports: [CalendarProviderComponent, CalendarComponent, CalendarDndDirective],
  template: `
    <div style="block-size: 100dvh; inline-size: 100%">
      <bc-calendar-provider
        [localizer]="loc"
        [events]="events()"
        [defaultDate]="FOCUS"
        [getNow]="getNow"
        [defaultView]="Views.WEEK"
        [accessors]="accessors"
        [onEventDrop]="apply"
        [onEventResize]="apply"
      >
        <div calendarDnd style="display: contents">
          <bc-calendar />
        </div>
      </bc-calendar-provider>
    </div>
  `,
})
class DndDemoComponent {
  readonly loc = localizer
  readonly FOCUS = FOCUS
  readonly getNow = () => NOW
  readonly Views = Views
  readonly accessors = undefined
  readonly events = signal<DemoEvent[]>([...demoEvents])

  readonly apply = ({ event, start, end, allDay }: DndPayload) => {
    this.events.update((list) =>
      list.map((e) => (e.id === event.id ? { ...e, start, end, allDay } : e)),
    )
  }
}

@Component({
  selector: 'story-locked-allay',
  standalone: true,
  imports: [CalendarProviderComponent, CalendarComponent, CalendarDndDirective],
  template: `
    <div style="block-size: 100dvh; inline-size: 100%">
      <bc-calendar-provider
        [localizer]="loc"
        [events]="events()"
        [defaultDate]="FOCUS"
        [getNow]="getNow"
        [defaultView]="Views.WEEK"
        [accessors]="{ draggable: noAllDayDrag }"
        [onEventDrop]="apply"
        [onEventResize]="apply"
      >
        <div calendarDnd style="display: contents">
          <bc-calendar />
        </div>
      </bc-calendar-provider>
    </div>
  `,
})
class DndLockedAllDayComponent {
  readonly loc = localizer
  readonly FOCUS = FOCUS
  readonly getNow = () => NOW
  readonly Views = Views
  readonly events = signal<DemoEvent[]>([...demoEvents])
  readonly noAllDayDrag = (e: DemoEvent) => !e.allDay

  readonly apply = ({ event, start, end, allDay }: DndPayload) => {
    this.events.update((list) =>
      list.map((e) => (e.id === event.id ? { ...e, start, end, allDay } : e)),
    )
  }
}

const meta: Meta = {
  title: 'Drag & Drop/Event Drag & Drop',
  argTypes: { onRangeChange: { action: 'onRangeChange' } },
}
export default meta

/**
 * Full drag-and-drop calendar: move events by dragging to a new day or slot,
 * resize timed events by dragging their top/bottom edge (time-grid views) or
 * leading/trailing edge (month view). Keyboard DnD is also available — Tab to
 * an event, Space to pick it up, arrow keys to move, Shift+arrows to resize,
 * Enter or Escape to drop or cancel.
 *
 * The `calendarDnd` directive must wrap the `<bc-calendar>` element inside the
 * provider. Events update in place on every drop so you can reposition them
 * repeatedly.
 */
export const EventDragAndDrop = {
  render: () => ({
    template: '<story-event-dnd></story-event-dnd>',
    moduleMetadata: { imports: [DndDemoComponent] },
  }),
}

/**
 * Demonstrates `accessors.draggable` — a function that returns `false` for
 * all-day events, preventing them from being picked up while timed events
 * still move freely.
 */
export const LockedAllDayEvents = {
  name: 'Lock All-Day Events',
  render: () => ({
    template: '<story-locked-allay></story-locked-allay>',
    moduleMetadata: { imports: [DndLockedAllDayComponent] },
  }),
}
