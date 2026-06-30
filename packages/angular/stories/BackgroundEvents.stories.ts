import { Views } from '@big-calendar/core'
import type { DayLayoutAlgorithmKey, ViewKey } from '@big-calendar/core'
import { Component, Input, signal } from '@angular/core'
import type { Meta, StoryObj } from '@storybook/angular'
import { moduleMetadata } from '@storybook/angular'
import { CalendarProviderComponent } from '../src/CalendarProvider/CalendarProviderComponent'
import { CalendarComponent } from '../src/CalendarComponent/CalendarComponent'
import { CalendarDndDirective } from '../src/CalendarDnd/CalendarDndDirective'
import { demoEvents, type DemoEvent, FOCUS, localizer, NOW } from './harness'

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
  control: 'select' as const,
  options: ['overlap', 'no-overlap'] as DayLayoutAlgorithmKey[],
  description:
    '`overlap` packs concurrent events side-by-side. `no-overlap` gives each event its own lane.',
}

const meta: Meta = {
  title: 'Background Events/With Background Events',
  argTypes: {
    onSlotClick: { action: 'onSlotClick' },
    onSlotDoubleClick: { action: 'onSlotDoubleClick' },
    onSlotSelect: { action: 'onSlotSelect' },
    onSlotSelecting: { action: 'onSlotSelecting' },
    onEventDrop: { action: 'onEventDrop' },
    onEventResize: { action: 'onEventResize' },
    onRangeChange: { action: 'onRangeChange' },
  },
}
export default meta

type BgArgs = { view: ViewKey; overlapping: boolean; dayLayoutAlgorithm: DayLayoutAlgorithmKey }

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
  render: (args) => ({
    props: {
      localizer,
      events: demoEvents,
      FOCUS,
      getNow: () => NOW,
      views: [Views.WEEK, Views.WORK_WEEK, Views.DAY],
      singleDayBg,
      overlappingBg,
      ...args,
    },
    template: `
      <div style="block-size: 100dvh; inline-size: 100%">
        <bc-calendar-provider
          [localizer]="localizer"
          [events]="events"
          [defaultDate]="FOCUS"
          [getNow]="getNow"
          [defaultView]="view"
          [views]="views"
          [backgroundEvents]="overlapping ? overlappingBg : singleDayBg"
          [dayLayoutAlgorithm]="dayLayoutAlgorithm"
        >
          <bc-calendar />
        </bc-calendar-provider>
      </div>
    `,
    moduleMetadata: { imports: [CalendarProviderComponent, CalendarComponent] },
  }),
}

/**
 * Slot selection with background events present. Click or drag in the time grid
 * and check the **Actions** panel to see the full selection payload — including
 * `backgroundEvents` when your selection overlaps one of the coloured bands.
 */
export const SelectableWithBackgroundEvents: StoryObj<BgArgs & { onSlotClick: (e: unknown) => void; onSlotDoubleClick: (e: unknown) => void; onSlotSelect: (e: unknown) => void; onSlotSelecting: (e: unknown) => void }> = {
  args: { view: Views.WEEK, overlapping: false, dayLayoutAlgorithm: 'overlap' },
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
  render: (args) => ({
    props: args,
    template: `
      <story-selectable-bg
        [view]="view"
        [overlapping]="overlapping"
        [dayLayoutAlgorithm]="dayLayoutAlgorithm"
        [onSlotClick]="onSlotClick"
        [onSlotDoubleClick]="onSlotDoubleClick"
        [onSlotSelect]="onSlotSelect"
        [onSlotSelecting]="onSlotSelecting"
      ></story-selectable-bg>
    `,
    moduleMetadata: { imports: [SelectableBgWrapperComponent] },
  }),
}

@Component({
  selector: 'story-selectable-bg',
  standalone: true,
  imports: [CalendarProviderComponent, CalendarComponent],
  template: `
    <div style="block-size: 100dvh; inline-size: 100%">
      <bc-calendar-provider
        [localizer]="loc"
        [events]="events"
        [defaultDate]="FOCUS"
        [getNow]="getNow"
        [defaultView]="view"
        [views]="views"
        [backgroundEvents]="overlapping ? overlappingBg : singleDayBg"
        [dayLayoutAlgorithm]="dayLayoutAlgorithm"
        [selectable]="true"
        [onSlotClick]="onSlotClick"
        [onSlotDoubleClick]="onSlotDoubleClick"
        [onSlotSelect]="onSlotSelect"
        [onSlotSelecting]="onSlotSelecting"
      >
        <bc-calendar />
      </bc-calendar-provider>
    </div>
  `,
})
export class SelectableBgWrapperComponent {
  readonly loc = localizer
  readonly events = demoEvents
  readonly FOCUS = FOCUS
  readonly getNow = () => NOW
  readonly views = [Views.WEEK, Views.WORK_WEEK, Views.DAY]
  readonly singleDayBg = singleDayBg
  readonly overlappingBg = overlappingBg

  @Input() view: ViewKey = Views.WEEK
  @Input() overlapping = false
  @Input() dayLayoutAlgorithm: DayLayoutAlgorithmKey = 'overlap'
  @Input() onSlotClick?: (args: unknown) => void
  @Input() onSlotDoubleClick?: (args: unknown) => void
  @Input() onSlotSelect?: (args: unknown) => void
  @Input() onSlotSelecting?: (args: unknown) => void
}

type DndPayload = { event: DemoEvent; start: string; end: string; allDay: boolean }

@Component({
  selector: 'story-dnd-bg',
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
        [views]="views"
        [backgroundEvents]="singleDayBg"
        dayLayoutAlgorithm="overlap"
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
class DndWithBgComponent {
  readonly loc = localizer
  readonly FOCUS = FOCUS
  readonly getNow = () => NOW
  readonly Views = Views
  readonly views = [Views.WEEK, Views.WORK_WEEK, Views.DAY]
  readonly singleDayBg = singleDayBg
  readonly events = signal<DemoEvent[]>([...demoEvents])

  readonly apply = ({ event, start, end, allDay }: DndPayload) => {
    this.events.update((list) =>
      list.map((e) => (e.id === event.id ? { ...e, start, end, allDay } : e)),
    )
  }
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
export const DragAndDropWithBackgroundEvents = {
  render: () => ({
    template: '<story-dnd-bg></story-dnd-bg>',
    moduleMetadata: { imports: [DndWithBgComponent] },
  }),
}
