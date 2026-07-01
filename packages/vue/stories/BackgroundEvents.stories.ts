import { Views } from '@big-calendar/core'
import type { DayLayoutAlgorithmKey, ViewKey } from '@big-calendar/core'
import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { fn } from 'storybook/test'
import { defineComponent, h, ref, shallowRef } from 'vue'
import Calendar from '../src/Calendar/Calendar.vue'
import CalendarProvider from '../src/CalendarProvider/CalendarProvider.vue'
import { useCalendarDnd } from '../src'
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

const DraggableCalendar = defineComponent({
  name: 'DraggableCalendar',
  setup() {
    const calendarRef = shallowRef<HTMLElement | null>(null)
    useCalendarDnd(calendarRef)
    return () => h('div', { ref: calendarRef, style: 'display: contents' }, [h(Calendar)])
  },
})

const dayLayoutArgType = {
  control: 'select',
  options: ['overlap', 'no-overlap'] as DayLayoutAlgorithmKey[],
  description:
    '`overlap` packs concurrent events side-by-side. `no-overlap` gives each event its own lane.',
}

const meta: Meta = {
  title: 'Background Events/With Background Events',
  args: {
    onSlotClick: fn(),
    onSlotDoubleClick: fn(),
    onSlotSelect: fn(),
    onSlotSelecting: fn(),
    onEventDrop: fn(),
    onEventResize: fn(),
    onRangeChange: fn(),
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
    components: { CalendarProvider, Calendar },
    setup() {
      const getNow = () => NOW
      return {
        Views,
        localizer,
        events: demoEvents,
        FOCUS,
        getNow,
        singleDayBg,
        overlappingBg,
        args,
      }
    },
    template: `
      <div style="block-size: 100dvh; inline-size: 100%">
        <CalendarProvider
          :localizer="localizer"
          :events="events"
          :defaultDate="FOCUS"
          :getNow="getNow"
          :defaultView="args.view"
          :views="[Views.WEEK, Views.WORK_WEEK, Views.DAY]"
          :backgroundEvents="args.overlapping ? overlappingBg : singleDayBg"
          :dayLayoutAlgorithm="args.dayLayoutAlgorithm"
        >
          <Calendar />
        </CalendarProvider>
      </div>
    `,
  }),
}

/**
 * Slot selection with background events present. Click or drag in the time grid
 * and check the **Actions** panel to see the full selection payload — including
 * `backgroundEvents` when your selection overlaps one of the coloured bands.
 *
 * The payload omits `backgroundEvents` entirely when the selection does not
 * intersect any background event.
 */
export const SelectableWithBackgroundEvents: StoryObj<BgArgs> = {
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
    components: { CalendarProvider, Calendar },
    setup() {
      const getNow = () => NOW
      return {
        Views,
        localizer,
        events: demoEvents,
        FOCUS,
        getNow,
        singleDayBg,
        overlappingBg,
        args,
      }
    },
    template: `
      <div style="block-size: 100dvh; inline-size: 100%">
        <CalendarProvider
          :localizer="localizer"
          :events="events"
          :defaultDate="FOCUS"
          :getNow="getNow"
          :defaultView="args.view"
          :views="[Views.WEEK, Views.WORK_WEEK, Views.DAY]"
          :backgroundEvents="args.overlapping ? overlappingBg : singleDayBg"
          :dayLayoutAlgorithm="args.dayLayoutAlgorithm"
          :selectable="true"
          :onSlotClick="args.onSlotClick"
          :onSlotDoubleClick="args.onSlotDoubleClick"
          :onSlotSelect="args.onSlotSelect"
          :onSlotSelecting="args.onSlotSelecting"
        >
          <Calendar />
        </CalendarProvider>
      </div>
    `,
  }),
}

type DndBgArgs = BgArgs & {
  onEventDrop: (a: unknown) => void
  onEventResize: (a: unknown) => void
  onRangeChange: (a: unknown) => void
}

const DndWithBg = defineComponent({
  name: 'DndWithBg',
  props: {
    view: String,
    overlapping: Boolean,
    dayLayoutAlgorithm: String,
    onEventDrop: Function,
    onEventResize: Function,
    onRangeChange: Function,
  },
  setup(props) {
    const events = ref<DemoEvent[]>([...demoEvents])
    const getNow = () => NOW

    const apply = ({ event, start, end, allDay }: { event: DemoEvent; start: string; end: string; allDay: boolean }) => {
      events.value = events.value.map((e) =>
        e.id === event.id ? { ...e, start, end, allDay } : e,
      )
    }

    return () =>
      h('div', { style: 'block-size: 100dvh; inline-size: 100%' }, [
        h(
          CalendarProvider,
          {
            localizer: localizer.value,
            events: events.value,
            defaultDate: FOCUS,
            getNow,
            defaultView: props.view ?? Views.WEEK,
            views: [Views.WEEK, Views.WORK_WEEK, Views.DAY],
            backgroundEvents: props.overlapping ? overlappingBg : singleDayBg,
            dayLayoutAlgorithm: props.dayLayoutAlgorithm ?? 'overlap',
            onRangeChange: props.onRangeChange,
            onEventDrop: (a: { event: DemoEvent; start: string; end: string; allDay: boolean }) => {
              props.onEventDrop?.(a)
              apply(a)
            },
            onEventResize: (a: { event: DemoEvent; start: string; end: string; allDay: boolean }) => {
              props.onEventResize?.(a)
              apply(a)
            },
          },
          { default: () => h(DraggableCalendar) },
        ),
      ])
  },
})

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
  render: () => DndWithBg,
}
