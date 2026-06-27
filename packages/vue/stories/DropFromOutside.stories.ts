import { Views } from '@big-calendar/core'
import type { ViewKey } from '@big-calendar/core'
import { EXTERNAL_MIME } from '@big-calendar/dnd'
import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { fn } from 'storybook/test'
import { defineComponent, h, ref, shallowRef } from 'vue'
import Calendar from '../src/Calendar/Calendar.vue'
import CalendarProvider from '../src/CalendarProvider/CalendarProvider.vue'
import { useCalendarDnd } from '../src'
import { demoEvents, type DemoEvent, FOCUS, localizer, NOW } from './harness'

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

const DraggableCalendar = defineComponent({
  name: 'DraggableCalendar',
  setup() {
    const calendarRef = shallowRef<HTMLElement | null>(null)
    useCalendarDnd(calendarRef)
    return () => h('div', { ref: calendarRef, style: 'display: contents' }, [h(Calendar)])
  },
})

type DropArgs = {
  view: ViewKey
  onRangeChange: (a: { range: { start: string; end: string }; view: ViewKey }) => void
}

const DropFromOutsideDemo = defineComponent({
  name: 'DropFromOutsideDemo',
  props: {
    view: String as () => ViewKey,
    onRangeChange: Function,
  },
  setup(props) {
    const events = ref<DemoEvent[]>([...demoEvents])
    const nextId = ref(1000)
    const getNow = () => NOW

    const onDragStart = (e: DragEvent, item: { payload: Record<string, unknown> }) => {
      if (!e.dataTransfer) return
      e.dataTransfer.effectAllowed = 'copy'
      e.dataTransfer.setData(EXTERNAL_MIME, JSON.stringify(item.payload))
    }

    const onDropFromOutside = ({ start, end, allDay }: { start: string; end: string; allDay: boolean }) => {
      events.value = [
        ...events.value,
        { id: nextId.value++, title: 'New event', start, end, allDay },
      ]
    }

    return () =>
      h('div', { style: { display: 'flex', gap: '1rem', blockSize: '100dvh', inlineSize: '100%' } }, [
        h(
          'aside',
          {
            style: {
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              flex: '0 0 13rem',
              paddingBlockStart: '0.5rem',
            },
          },
          [
            h('strong', { style: { fontSize: '0.8rem' } }, 'Drag onto the calendar →'),
            ...PALETTE.map((item) =>
              h(
                'div',
                {
                  key: item.label,
                  draggable: true,
                  onDragstart: (e: DragEvent) => onDragStart(e, item),
                  style: {
                    padding: '0.5rem 0.6rem',
                    border: '1px solid var(--bc-color-border, #d4d4d8)',
                    borderRadius: '6px',
                    background: 'var(--bc-color-surface, #fff)',
                    cursor: 'grab',
                    fontSize: '0.8rem',
                  },
                },
                item.label,
              ),
            ),
          ],
        ),
        h('div', { style: { flex: 1, minInlineSize: 0 } }, [
          h(
            CalendarProvider,
            {
              localizer,
              events: events.value,
              defaultDate: FOCUS,
              getNow,
              defaultView: props.view ?? Views.WEEK,
              onRangeChange: props.onRangeChange,
              onDropFromOutside,
            },
            { default: () => h(DraggableCalendar) },
          ),
        ]),
      ])
  },
})

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
  render: () => DropFromOutsideDemo,
}
