import { Views } from '@big-calendar/core'
import type { ViewKey } from '@big-calendar/core'
import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { fn } from 'storybook/test'
import { defineComponent, h, ref, shallowRef } from 'vue'
import Calendar from '../src/Calendar/Calendar.vue'
import CalendarProvider from '../src/CalendarProvider/CalendarProvider.vue'
import { useCalendarDnd } from '../src'
import { demoEvents, type DemoEvent, FOCUS, localizer, NOW } from './harness'

type Resource = { id: string; title: string }

const rooms: Resource[] = [
  { id: 'board',    title: 'Board room' },
  { id: 'training', title: 'Training room' },
  { id: 'mtg1',    title: 'Meeting room 1' },
  { id: 'mtg2',    title: 'Meeting room 2' },
  { id: 'mtg3',    title: 'Meeting room 3' },
  { id: 'exec',    title: 'Executive suite' },
]

const DraggableCalendar = defineComponent({
  name: 'DraggableCalendar',
  setup() {
    const calendarRef = shallowRef<HTMLElement | null>(null)
    useCalendarDnd(calendarRef)
    return () => h('div', { ref: calendarRef, style: 'display: contents' }, [h(Calendar)])
  },
})

type ResourceArgs = {
  layout: 'day' | 'week' | 'week-day-major'
  onRangeChange: (a: { range: { start: string; end: string }; view: ViewKey }) => void
}

const ResourceDemo = defineComponent({
  name: 'ResourceDemo',
  props: {
    layout: String as () => 'day' | 'week' | 'week-day-major',
    onRangeChange: Function,
  },
  setup(props) {
    const events = ref<DemoEvent[]>([...demoEvents])
    const getNow = () => NOW

    const apply = ({
      event,
      start,
      end,
      allDay,
      resourceId,
    }: {
      event: DemoEvent
      start: string
      end: string
      allDay: boolean
      resourceId?: string
    }) => {
      events.value = events.value.map((e) =>
        e.id === event.id
          ? { ...e, start, end, allDay, resourceId: resourceId ?? e.resourceId }
          : e,
      )
    }

    return () => {
      const layout = props.layout ?? 'week'
      const defaultView = layout === 'day' ? Views.DAY : Views.WEEK
      const views = layout === 'day' ? [Views.DAY] : [Views.WEEK, Views.WORK_WEEK]
      const resourceLayout = layout === 'week-day-major' ? 'day' : undefined

      return h('div', { style: 'block-size: 100dvh; inline-size: 100%' }, [
        h(
          CalendarProvider,
          {
            localizer: localizer.value,
            events: events.value,
            defaultDate: FOCUS,
            getNow,
            defaultView,
            views,
            resources: rooms,
            resourceLayout,
            selectable: true,
            onRangeChange: props.onRangeChange,
            onEventDrop: apply,
            onEventResize: apply,
          },
          { default: () => h(DraggableCalendar) },
        ),
      ])
    }
  },
})

const meta: Meta = {
  title: 'Resources/With Resources',
  args: { onRangeChange: fn() },
}
export default meta

/**
 * A resource calendar where each resource (room) gets its own column. Selection
 * and drag-and-drop both work exactly as in the standard calendar — the difference
 * is that the slot and drop callbacks also report the `resourceId` of the column
 * the user interacted with, so you can assign or reassign events to resources.
 *
 * Use the **Controls** panel to switch between layout modes:
 * - **day** — one column per resource under a single day header.
 * - **week** — resource-major: all days for one resource, then all days for the next.
 * - **week-day-major** — day-major: all resources for Monday, then all for Tuesday, etc.
 *
 * Drag an event into a different resource's column — `onEventDrop` reports the new
 * `resourceId` and your state update moves it there.
 */
export const WithResources: StoryObj<ResourceArgs> = {
  args: { layout: 'week' },
  argTypes: {
    layout: {
      control: 'select',
      options: ['day', 'week', 'week-day-major'],
      description:
        'Column ordering. "day" = one column per resource; "week" = resource-major; "week-day-major" = day-major.',
    },
  },
  render: (args) => ({
    components: { ResourceDemo },
    setup() { return { args } },
    template: '<ResourceDemo v-bind="args" />',
  }),
}
