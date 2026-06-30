import { Views } from '@big-calendar/core'
import type { ViewKey } from '@big-calendar/core'
import { EXTERNAL_MIME } from '@big-calendar/dnd'
import { Component, Input, signal } from '@angular/core'
import type { Meta, StoryObj } from '@storybook/angular'
import { CalendarProviderComponent } from '../src/CalendarProvider/CalendarProviderComponent'
import { CalendarComponent } from '../src/CalendarComponent/CalendarComponent'
import { CalendarDndDirective } from '../src/CalendarDnd/CalendarDndDirective'
import { demoEvents, type DemoEvent, FOCUS, localizer, NOW } from './harness'

const PALETTE: { label: string; payload: Record<string, unknown> }[] = [
  { label: '30-min meeting',          payload: { durationMinutes: 30 } },
  { label: '1-hour focus block',      payload: { durationMinutes: 60 } },
  { label: '90-min workshop',         payload: { durationMinutes: 90 } },
  { label: 'Holiday (all-day)',       payload: {} },
  {
    label: '9–10am standup (re-dated)',
    payload: { start: '2020-01-01T09:00:00.000Z', end: '2020-01-01T10:00:00.000Z' },
  },
]

@Component({
  selector: 'story-drop-outside',
  standalone: true,
  imports: [CalendarProviderComponent, CalendarComponent, CalendarDndDirective],
  template: `
    <div style="display: flex; gap: 1rem; block-size: 100dvh; inline-size: 100%">
      <aside style="display: flex; flex-direction: column; gap: 0.5rem; flex: 0 0 13rem; padding-block-start: 0.5rem">
        <strong style="font-size: 0.8rem">Drag onto the calendar →</strong>
        @for (item of palette; track item.label) {
          <div
            draggable="true"
            (dragstart)="onDragStart($event, item)"
            style="padding: 0.5rem 0.6rem; border: 1px solid var(--bc-color-border, #d4d4d8); border-radius: 6px; background: var(--bc-color-surface, #fff); cursor: grab; font-size: 0.8rem"
          >{{ item.label }}</div>
        }
      </aside>
      <div style="flex: 1; min-inline-size: 0">
        <bc-calendar-provider
          [localizer]="loc"
          [events]="events()"
          [defaultDate]="FOCUS"
          [getNow]="getNow"
          [defaultView]="view"
          [onDropFromOutside]="onDropFromOutside"
        >
          <div calendarDnd style="display: contents">
            <bc-calendar />
          </div>
        </bc-calendar-provider>
      </div>
    </div>
  `,
})
class DropFromOutsideComponent {
  @Input() view: ViewKey = Views.WEEK
  readonly loc = localizer
  readonly FOCUS = FOCUS
  readonly getNow = () => NOW
  readonly Views = Views
  readonly palette = PALETTE
  readonly events = signal<DemoEvent[]>([...demoEvents])
  private nextId = 1000

  onDragStart(e: DragEvent, item: { payload: Record<string, unknown> }) {
    if (!e.dataTransfer) return
    e.dataTransfer.effectAllowed = 'copy'
    e.dataTransfer.setData(EXTERNAL_MIME, JSON.stringify(item.payload))
  }

  readonly onDropFromOutside = ({ start, end, allDay }: { start: string; end: string; allDay: boolean }) => {
    this.events.update((list) => [
      ...list,
      { id: this.nextId++, title: 'New event', start, end, allDay },
    ])
  }
}

const meta: Meta = {
  title: 'Drag & Drop/Drop from Outside',
  argTypes: { onRangeChange: { action: 'onRangeChange' } },
}
export default meta

/**
 * Drag a chip from the palette on the left onto the calendar to create a new event.
 * Duration chips write their payload onto the drag's `dataTransfer` under the
 * `EXTERNAL_MIME` type; dropping on a slot fires `onDropFromOutside` with the
 * proposed `start`/`end`/`allDay` and your code appends the event.
 *
 * On a **time-grid** slot, timed chips snap to the dropped slot for the given
 * duration. On the **month** grid, an empty payload creates an all-day event;
 * a chip with a `start`/`end` template is re-dated to the dropped day (the
 * time-of-day is preserved).
 */
export const DropFromOutside: StoryObj<{ view: ViewKey }> = {
  args: { view: Views.WEEK },
  argTypes: {
    view: {
      control: 'select',
      options: [Views.MONTH, Views.WEEK, Views.WORK_WEEK, Views.DAY],
      description:
        'Calendar view to drop onto. Time-grid views snap to the slot; month view re-dates or creates an all-day event.',
    },
  },
  render: (args) => ({
    props: { view: args.view },
    template: '<story-drop-outside [view]="view"></story-drop-outside>',
    moduleMetadata: { imports: [DropFromOutsideComponent] },
  }),
}
