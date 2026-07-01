<script lang="ts" module>
  import { Views } from '@big-calendar/core'
  import type { DemoEvent } from './demoEvents'

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
</script>

<script lang="ts">
  import CalendarProvider from '../src/CalendarProvider/CalendarProvider.svelte'
  import DndContainer from './DndContainer.svelte'
  import { localizer } from './localizerRef'
  import { demoEvents, FOCUS, NOW } from './harness'

  let {
    view = Views.WEEK,
    overlapping = false,
    dayLayoutAlgorithm,
    onSlotClick,
    onSlotDoubleClick,
    onSlotSelect,
    onSlotSelecting,
    onEventDrop,
    onEventResize,
    onRangeChange,
  }: {
    view?: string
    overlapping?: boolean
    dayLayoutAlgorithm?: string
    onSlotClick?: (a: unknown) => void
    onSlotDoubleClick?: (a: unknown) => void
    onSlotSelect?: (a: unknown) => void
    onSlotSelecting?: (a: unknown) => boolean | undefined
    onEventDrop?: (a: unknown) => void
    onEventResize?: (a: unknown) => void
    onRangeChange?: (a: unknown) => void
  } = $props()

  let events = $state<DemoEvent[]>([...demoEvents])

  const getNow = () => NOW

  function apply({ event, start, end, allDay }: { event: DemoEvent; start: string; end: string; allDay: boolean }) {
    events = events.map((e) => (e.id === event.id ? { ...e, start, end, allDay } : e))
  }
</script>

<div style="block-size: 100dvh; inline-size: 100%">
  <CalendarProvider
    {localizer}
    {events}
    defaultDate={FOCUS}
    {getNow}
    defaultView={view}
    views={[Views.WEEK, Views.WORK_WEEK, Views.DAY]}
    backgroundEvents={overlapping ? overlappingBg : singleDayBg}
    {dayLayoutAlgorithm}
    {onSlotClick}
    {onSlotDoubleClick}
    {onSlotSelect}
    {onSlotSelecting}
    {onRangeChange}
    onEventDrop={(a: { event: DemoEvent; start: string; end: string; allDay: boolean }) => {
      onEventDrop?.(a)
      apply(a)
    }}
    onEventResize={(a: { event: DemoEvent; start: string; end: string; allDay: boolean }) => {
      onEventResize?.(a)
      apply(a)
    }}
  >
    <DndContainer />
  </CalendarProvider>
</div>
