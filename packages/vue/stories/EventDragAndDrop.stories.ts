import { Views } from '@big-calendar/core'
import type { ViewKey } from '@big-calendar/core'
import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { fn } from 'storybook/test'
import { defineComponent, h, ref, shallowRef } from 'vue'
import Calendar from '../src/Calendar/Calendar.vue'
import CalendarProvider from '../src/CalendarProvider/CalendarProvider.vue'
import { useCalendarDnd } from '../src'
import { demoEvents, type DemoEvent, FOCUS, localizer, NOW } from './harness'

const DraggableCalendar = defineComponent({
  name: 'DraggableCalendar',
  setup() {
    const calendarRef = shallowRef<HTMLElement | null>(null)
    useCalendarDnd(calendarRef)
    return () => h('div', { ref: calendarRef, style: 'display: contents' }, [h(Calendar)])
  },
})

type DndArgs = {
  view: ViewKey
  lockAllDayEvents: boolean
  onRangeChange: (a: unknown) => void
}

const DndDemo = defineComponent({
  name: 'DndDemo',
  props: {
    view: String,
    lockAllDayEvents: Boolean,
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
            localizer,
            events: events.value,
            defaultDate: FOCUS,
            getNow,
            defaultView: props.view ?? Views.WEEK,
            accessors: props.lockAllDayEvents
              ? { draggable: (e: DemoEvent) => !e.allDay }
              : undefined,
            onRangeChange: props.onRangeChange,
            onEventDrop: apply,
            onEventResize: apply,
          },
          { default: () => h(DraggableCalendar) },
        ),
      ])
  },
})

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
  render: () => DndDemo,
}
