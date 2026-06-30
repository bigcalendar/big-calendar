import { html } from 'lit'
import { LitElement } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { Views } from '@big-calendar/core'
import type { ViewKey } from '@big-calendar/core'
import { EXTERNAL_MIME } from '@big-calendar/dnd'
import type { Meta, StoryObj } from '@storybook/web-components-vite'
import { fn } from 'storybook/test'
import '@big-calendar/lit'
import { CalendarDndController } from '@big-calendar/lit'
import { demoEvents, type DemoEvent, FOCUS, litLocalizer, NOW } from './harness'

const PALETTE: { label: string; payload: Record<string, unknown> }[] = [
  { label: '30-min meeting',           payload: { durationMinutes: 30 } },
  { label: '1-hour focus block',       payload: { durationMinutes: 60 } },
  { label: '90-min workshop',          payload: { durationMinutes: 90 } },
  { label: 'Holiday (all-day)',        payload: {} },
  {
    label: '9–10am standup (re-dated)',
    payload: { start: '2020-01-01T09:00:00.000Z', end: '2020-01-01T10:00:00.000Z' },
  },
]

@customElement('bc-story-drop-outside')
class DropFromOutsideDemoElement extends LitElement {
  override createRenderRoot() { return this }

  @property({ attribute: false }) view: ViewKey = Views.WEEK
  @property({ attribute: false }) onRangeChange?: (a: unknown) => void

  private _events: DemoEvent[] = [...demoEvents]
  private _nextId = 1000
  private _dnd = new CalendarDndController(this)

  private _onDragStart(e: DragEvent, item: { payload: Record<string, unknown> }): void {
    if (!e.dataTransfer) return
    e.dataTransfer.effectAllowed = 'copy'
    e.dataTransfer.setData(EXTERNAL_MIME, JSON.stringify(item.payload))
  }

  private _onDropFromOutside({ start, end, allDay }: { start: string; end: string; allDay: boolean }): void {
    this._events = [
      ...this._events,
      { id: this._nextId++, title: 'New event', start, end, allDay },
    ]
    this.requestUpdate()
  }

  override render() {
    return html`
      <div style="display:flex;gap:1rem;block-size:100dvh;inline-size:100%">
        <aside style="display:flex;flex-direction:column;gap:0.5rem;flex:0 0 13rem;padding-block-start:0.5rem">
          <strong style="font-size:0.8rem">Drag onto the calendar →</strong>
          ${PALETTE.map((item) => html`
            <div
              draggable="true"
              @dragstart=${(e: DragEvent) => this._onDragStart(e, item)}
              style="padding:0.5rem 0.6rem;border:1px solid var(--bc-color-border,#d4d4d8);border-radius:6px;background:var(--bc-color-surface,#fff);cursor:grab;font-size:0.8rem"
            >${item.label}</div>
          `)}
        </aside>
        <div style="flex:1;min-inline-size:0">
          <bc-calendar
            .localizer=${litLocalizer.current}
            .events=${this._events}
            .defaultDate=${FOCUS}
            .getNow=${() => NOW}
            .defaultView=${this.view}
            .onRangeChange=${this.onRangeChange}
            .onDropFromOutside=${this._onDropFromOutside.bind(this)}
          >
            <div class="bc-calendar">
              <bc-default-toolbar></bc-default-toolbar>
              <bc-month-view></bc-month-view>
              <bc-time-grid-view></bc-time-grid-view>
              <bc-agenda-view></bc-agenda-view>
            </div>
          </bc-calendar>
        </div>
      </div>
    `
  }
}

type DropArgs = {
  view: ViewKey
  onRangeChange: (a: { range: { start: string; end: string }; view: ViewKey }) => void
}

const meta: Meta = {
  title: 'Drag & Drop/Drop from Outside',
  args: { onRangeChange: fn() },
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
 * time-of-day is preserved). Use the **Controls** panel to switch between views.
 */
export const DropFromOutside: StoryObj<DropArgs> = {
  args: { view: Views.WEEK },
  argTypes: {
    view: {
      control: 'select',
      options: [Views.MONTH, Views.WEEK, Views.WORK_WEEK, Views.DAY],
      description:
        'Calendar view to drop onto. Time-grid views snap to the slot; month view re-dates or creates an all-day event.',
    },
  },
  render: (args) => html`
    <div style="block-size:100dvh;inline-size:100%">
      <bc-story-drop-outside
        .view=${args.view}
        .onRangeChange=${args.onRangeChange}
      ></bc-story-drop-outside>
    </div>
  `,
}
