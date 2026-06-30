import { html } from 'lit'
import { LitElement } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { Views } from '@big-calendar/core'
import type { ViewKey } from '@big-calendar/core'
import type { Meta, StoryObj } from '@storybook/web-components-vite'
import { fn } from 'storybook/test'
import '@big-calendar/lit'
import { CalendarDndController } from '@big-calendar/lit'
import { demoEvents, type DemoEvent, FOCUS, litLocalizer, NOW } from './harness'

@customElement('bc-story-dnd-demo')
class DndDemoElement extends LitElement {
  override createRenderRoot() { return this }

  @property({ attribute: false }) view: ViewKey = Views.WEEK
  @property({ attribute: false }) lockAllDayEvents = false
  @property({ attribute: false }) onRangeChange?: (a: unknown) => void

  private _events: DemoEvent[] = [...demoEvents]
  private _dnd = new CalendarDndController(this)

  override render() {
    const apply = (a: { event: DemoEvent; start: string; end: string; allDay: boolean }) => {
      this._events = this._events.map((e) =>
        e.id === a.event.id ? { ...e, start: a.start, end: a.end, allDay: a.allDay } : e,
      )
      this.requestUpdate()
    }

    const accessors = this.lockAllDayEvents
      ? { draggable: (e: DemoEvent) => !e.allDay }
      : undefined

    return html`
      <bc-calendar
        .localizer=${litLocalizer.current}
        .events=${this._events}
        .defaultDate=${FOCUS}
        .getNow=${() => NOW}
        .defaultView=${this.view}
        .accessors=${accessors}
        .onRangeChange=${this.onRangeChange}
        .onEventDrop=${apply}
        .onEventResize=${apply}
      >
        <div class="bc-calendar">
          <bc-default-toolbar></bc-default-toolbar>
          <bc-month-view></bc-month-view>
          <bc-time-grid-view></bc-time-grid-view>
          <bc-agenda-view></bc-agenda-view>
        </div>
      </bc-calendar>
    `
  }
}

type DndArgs = {
  view: ViewKey
  lockAllDayEvents: boolean
  onRangeChange: (a: unknown) => void
}

const meta: Meta = {
  title: 'Drag & Drop/Event Drag & Drop',
  args: { onRangeChange: fn() },
}
export default meta

/**
 * Full drag-and-drop calendar: move events by dragging to a new day or slot,
 * resize timed events by dragging their top/bottom edge (time-grid views) or
 * leading/trailing edge (month view). Keyboard DnD is also available — Tab to
 * an event, Space to pick it up, arrow keys to move, Shift+arrows to resize,
 * Enter or Escape to drop or cancel.
 *
 * Use the **Controls** panel to switch between the month grid (whole-day moves)
 * and the time-grid views (slot-snapping moves + resize handles). Toggle
 * **Lock all-day events** to see `accessors.draggable` prevent picks on all-day
 * events while timed events still move.
 *
 * Events update in place on every drop so you can reposition them repeatedly.
 *
 * **Implementation note:** `CalendarDndController` is the Lit equivalent of
 * the Angular `[calendarDnd]` directive. It attaches to the host element,
 * subscribes to the store's `view` signal, and calls `bindCalendarDnd` from
 * `@big-calendar/dnd` whenever the view changes.
 */
export const EventDragAndDrop: StoryObj<DndArgs> = {
  args: { view: Views.WEEK, lockAllDayEvents: false },
  argTypes: {
    view: {
      control: 'select',
      options: [Views.MONTH, Views.WEEK, Views.WORK_WEEK, Views.DAY],
      description:
        'Calendar view. Month moves by whole day; time-grid views snap to the dropped slot and preserve duration.',
    },
    lockAllDayEvents: {
      control: 'boolean',
      description:
        'Set accessors.draggable to return false for all-day events, preventing them from being picked up.',
    },
  },
  render: (args) => html`
    <div style="block-size:100dvh;inline-size:100%">
      <bc-story-dnd-demo
        .view=${args.view}
        .lockAllDayEvents=${args.lockAllDayEvents}
        .onRangeChange=${args.onRangeChange}
      ></bc-story-dnd-demo>
    </div>
  `,
}
