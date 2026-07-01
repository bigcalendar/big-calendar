import { html, LitElement } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { Views } from '@big-calendar/core'
import type { DayLayoutAlgorithmKey, ViewKey } from '@big-calendar/core'
import type { Meta, StoryObj } from '@storybook/web-components-vite'
import { fn } from 'storybook/test'
import '@big-calendar/lit'
import { demoEvents, type DemoEvent, FOCUS, litLocalizer, NOW } from './harness'

const singleDayBg: DemoEvent[] = [
  { id: 1001, title: 'Deep work', start: '2026-06-15T09:00:00.000Z', end: '2026-06-15T12:00:00.000Z' },
  { id: 1002, title: 'Sprint focus', start: '2026-06-16T09:00:00.000Z', end: '2026-06-18T17:00:00.000Z' },
  { id: 1003, title: 'Review window', start: '2026-06-19T13:00:00.000Z', end: '2026-06-19T17:00:00.000Z' },
]

const overlappingBg: DemoEvent[] = [
  { id: 1004, title: 'Focus block A', start: '2026-06-15T09:00:00.000Z', end: '2026-06-15T13:00:00.000Z' },
  { id: 1005, title: 'Focus block B', start: '2026-06-15T11:00:00.000Z', end: '2026-06-15T15:00:00.000Z' },
  { id: 1006, title: 'Sprint focus', start: '2026-06-16T09:00:00.000Z', end: '2026-06-18T17:00:00.000Z' },
]

const dayLayoutArgType = {
  control: 'select',
  options: ['overlap', 'no-overlap'] as DayLayoutAlgorithmKey[],
  description:
    '`overlap` packs concurrent events side-by-side. `no-overlap` gives each event its own lane.',
}

// Stateful element for the DnD + background events story.
// Defined at module scope to avoid re-registering the custom element on each render.
@customElement('bc-story-dnd-bg')
class DndBgElement extends LitElement {
  override createRenderRoot() { return this }

  @property({ attribute: false }) view: ViewKey = Views.WEEK
  @property({ attribute: false }) overlapping = false
  @property({ attribute: false }) dayLayoutAlgorithm: DayLayoutAlgorithmKey = 'overlap'
  @property({ attribute: false }) onEventDrop?: (a: unknown) => void
  @property({ attribute: false }) onEventResize?: (a: unknown) => void
  @property({ attribute: false }) onRangeChange?: (a: unknown) => void

  private _events: DemoEvent[] = [...demoEvents]

  override render() {
    const bg = this.overlapping ? overlappingBg : singleDayBg
    const apply = (a: { event: DemoEvent; start: string; end: string; allDay: boolean }) => {
      this._events = this._events.map((e) =>
        e.id === a.event.id ? { ...e, start: a.start, end: a.end, allDay: a.allDay } : e,
      )
      this.requestUpdate()
    }
    return html`
      <bc-calendar
        style="display:grid;grid-template-rows:auto 1fr;row-gap:0.5rem;block-size:100%;inline-size:100%"
        .localizer=${litLocalizer.current}
        .events=${this._events}
        .defaultDate=${FOCUS}
        .getNow=${() => NOW}
        .defaultView=${this.view}
        .views=${[Views.WEEK, Views.WORK_WEEK, Views.DAY]}
        .backgroundEvents=${bg}
        .dayLayoutAlgorithm=${this.dayLayoutAlgorithm}
        .onRangeChange=${this.onRangeChange}
        .onEventDrop=${(a: { event: DemoEvent; start: string; end: string; allDay: boolean }) => {
          this.onEventDrop?.(a)
          apply(a)
        }}
        .onEventResize=${(a: { event: DemoEvent; start: string; end: string; allDay: boolean }) => {
          this.onEventResize?.(a)
          apply(a)
        }}
      >
        <bc-default-toolbar></bc-default-toolbar>
        <bc-calendar-dnd>
          <div class="bc-calendar">
            <bc-month-view></bc-month-view>
            <bc-time-grid-view></bc-time-grid-view>
            <bc-agenda-view></bc-agenda-view>
          </div>
        </bc-calendar-dnd>
      </bc-calendar>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'bc-story-dnd-bg': DndBgElement
  }
}

const meta: Meta = {
  title: 'Background Events/With Background Events',
  args: {
    onSlotClick: fn(),
    onSlotDoubleClick: fn(),
    onSlotSelect: fn(),
    onSlotSelecting: fn(),
    onEventClick: fn(),
    onEventDoubleClick: fn(),
    onEventRightClick: fn(),
    onEventMiddleClick: fn(),
    onRangeChange: fn(),
  },
}
export default meta

type BgArgs = { view: ViewKey; overlapping: boolean; dayLayoutAlgorithm: DayLayoutAlgorithmKey }

type SelectableBgArgs = BgArgs & {
  onSlotClick: (a: unknown) => void
  onSlotDoubleClick: (a: unknown) => void
  onSlotSelect: (a: unknown) => void
  onSlotSelecting: (a: unknown) => void
  onEventClick: (a: unknown) => void
  onEventDoubleClick: (a: unknown) => void
  onEventRightClick: (a: unknown) => void
  onEventMiddleClick: (a: unknown) => void
  onRangeChange: (a: unknown) => void
}

/**
 * Background events appear behind timed events as coloured bands. Pointer events
 * pass straight through them — slot selection and event interaction still work
 * anywhere on their surface.
 *
 * A single-day background event has rounded corners on both edges. A multi-day
 * event is clipped at midnight per column. Toggle **Overlapping** in Controls to
 * see two background events share the column width on the same day.
 */
export const WithBackgroundEvents: StoryObj<BgArgs> = {
  args: { view: Views.WEEK, overlapping: false, dayLayoutAlgorithm: 'overlap' },
  argTypes: {
    view: {
      control: 'select',
      options: [Views.WEEK, Views.WORK_WEEK, Views.DAY],
      description: 'Time-grid view to render.',
    },
    overlapping: {
      control: 'boolean',
      description: 'Show two overlapping background events on Jun 15.',
    },
    dayLayoutAlgorithm: dayLayoutArgType,
  },
  render: (args) => html`
    <div style="block-size:100dvh;inline-size:100%">
      <bc-calendar
        style="display:grid;grid-template-rows:auto 1fr;row-gap:0.5rem;block-size:100%;inline-size:100%"
        .localizer=${litLocalizer.current}
        .events=${demoEvents}
        .defaultDate=${FOCUS}
        .getNow=${() => NOW}
        .defaultView=${args.view}
        .views=${[Views.WEEK, Views.WORK_WEEK, Views.DAY]}
        .backgroundEvents=${args.overlapping ? overlappingBg : singleDayBg}
        .dayLayoutAlgorithm=${args.dayLayoutAlgorithm}
      >
        <bc-default-toolbar></bc-default-toolbar>
        <div class="bc-calendar">
          <bc-month-view></bc-month-view>
          <bc-time-grid-view></bc-time-grid-view>
          <bc-agenda-view></bc-agenda-view>
        </div>
      </bc-calendar>
    </div>
  `,
}

/**
 * Slot selection with background events present. Click or drag in the time grid
 * and check the **Actions** panel to see the full selection payload — including
 * `backgroundEvents` when your selection overlaps one of the coloured bands.
 *
 * The payload omits `backgroundEvents` entirely when the selection does not
 * intersect any background event.
 */
export const SelectableWithBackgroundEvents: StoryObj<SelectableBgArgs> = {
  args: {
    view: Views.WEEK,
    overlapping: false,
    dayLayoutAlgorithm: 'overlap',
    onSlotClick: fn(),
    onSlotDoubleClick: fn(),
    onSlotSelect: fn(),
    onSlotSelecting: fn(),
    onEventClick: fn(),
    onEventDoubleClick: fn(),
    onEventRightClick: fn(),
    onEventMiddleClick: fn(),
    onRangeChange: fn(),
  },
  argTypes: {
    view: {
      control: 'select',
      options: [Views.WEEK, Views.WORK_WEEK, Views.DAY],
      description: 'Time-grid view to render.',
    },
    overlapping: {
      control: 'boolean',
      description: 'Use overlapping background events to show multiple entries in the payload.',
    },
    dayLayoutAlgorithm: dayLayoutArgType,
  },
  render: (args) => html`
    <div style="block-size:100dvh;inline-size:100%">
      <bc-calendar
        style="display:grid;grid-template-rows:auto 1fr;row-gap:0.5rem;block-size:100%;inline-size:100%"
        .localizer=${litLocalizer.current}
        .events=${demoEvents}
        .defaultDate=${FOCUS}
        .getNow=${() => NOW}
        .defaultView=${args.view}
        .views=${[Views.WEEK, Views.WORK_WEEK, Views.DAY]}
        .backgroundEvents=${args.overlapping ? overlappingBg : singleDayBg}
        .dayLayoutAlgorithm=${args.dayLayoutAlgorithm}
        .selectable=${true}
        .onSlotClick=${args.onSlotClick}
        .onSlotDoubleClick=${args.onSlotDoubleClick}
        .onSlotSelect=${args.onSlotSelect}
        .onSlotSelecting=${args.onSlotSelecting}
        .onEventClick=${args.onEventClick}
        .onEventDoubleClick=${args.onEventDoubleClick}
        .onEventRightClick=${args.onEventRightClick}
        .onEventMiddleClick=${args.onEventMiddleClick}
        .onRangeChange=${args.onRangeChange}
      >
        <bc-default-toolbar></bc-default-toolbar>
        <div class="bc-calendar">
          <bc-month-view></bc-month-view>
          <bc-time-grid-view></bc-time-grid-view>
          <bc-agenda-view></bc-agenda-view>
        </div>
      </bc-calendar>
    </div>
  `,
}

type DndBgArgs = BgArgs & {
  onEventDrop: (a: unknown) => void
  onEventResize: (a: unknown) => void
  onRangeChange: (a: unknown) => void
}

/**
 * Drag and resize events over a calendar that has background events. Check the
 * **Actions** panel after each drop or resize — when the event's new bounds
 * overlap a background event, a `backgroundEvents` field appears in the payload.
 *
 * Events actually update on drop so you can reposition them and repeat the test.
 * Keyboard DnD is also available: Tab to an event, Space to pick it up, arrow
 * keys to move, Shift+arrows to resize, Enter to commit.
 */
export const DragAndDropWithBackgroundEvents: StoryObj<DndBgArgs> = {
  args: { view: Views.WEEK, overlapping: false, dayLayoutAlgorithm: 'overlap' },
  argTypes: {
    view: {
      control: 'select',
      options: [Views.WEEK, Views.WORK_WEEK, Views.DAY],
      description: 'Time-grid view to render.',
    },
    overlapping: {
      control: 'boolean',
      description: 'Switch to the overlapping background event set.',
    },
    dayLayoutAlgorithm: dayLayoutArgType,
  },
  render: (args) => html`
    <div style="block-size:100dvh;inline-size:100%">
      <bc-story-dnd-bg
        style="display:block;block-size:100%;inline-size:100%"
        .view=${args.view}
        .overlapping=${args.overlapping}
        .dayLayoutAlgorithm=${args.dayLayoutAlgorithm}
        .onEventDrop=${args.onEventDrop}
        .onEventResize=${args.onEventResize}
        .onRangeChange=${args.onRangeChange}
      ></bc-story-dnd-bg>
    </div>
  `,
}
