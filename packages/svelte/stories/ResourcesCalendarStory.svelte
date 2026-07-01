<script lang="ts" module>
  const rooms = [
    { id: 'board',    title: 'Board room' },
    { id: 'training', title: 'Training room' },
    { id: 'mtg1',    title: 'Meeting room 1' },
    { id: 'mtg2',    title: 'Meeting room 2' },
    { id: 'mtg3',    title: 'Meeting room 3' },
    { id: 'exec',    title: 'Executive suite' },
  ]
</script>

<script lang="ts">
  import { Views } from '@big-calendar/core'
  import type { DemoEvent } from './demoEvents'
  import CalendarProvider from '../src/CalendarProvider/CalendarProvider.svelte'
  import DndContainer from './DndContainer.svelte'
  import { localizer } from './localizerRef'
  import { demoEvents, FOCUS, NOW } from './harness'

  let {
    layout = 'week',
    onRangeChange,
    onEventDrop,
    onEventResize,
  }: {
    layout?: 'day' | 'week' | 'week-day-major'
    onRangeChange?: (a: unknown) => void
    onEventDrop?: (a: unknown) => void
    onEventResize?: (a: unknown) => void
  } = $props()

  let events = $state<DemoEvent[]>([...demoEvents])

  const getNow = () => NOW

  const defaultView = $derived(layout === 'day' ? Views.DAY : Views.WEEK)
  const views = $derived(layout === 'day' ? [Views.DAY] : [Views.WEEK, Views.WORK_WEEK])
  const resourceLayout = $derived(layout === 'week-day-major' ? 'day' : undefined)

  function apply({
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
  }) {
    events = events.map((e) =>
      e.id === event.id
        ? { ...e, start, end, allDay, resourceId: resourceId ?? e.resourceId }
        : e,
    )
  }
</script>

<div style="block-size: 100dvh; inline-size: 100%">
  <CalendarProvider
    {localizer}
    {events}
    defaultDate={FOCUS}
    {getNow}
    {defaultView}
    {views}
    resources={rooms}
    {resourceLayout}
    {onRangeChange}
    onEventDrop={(a: { event: DemoEvent; start: string; end: string; allDay: boolean; resourceId?: string }) => {
      onEventDrop?.(a)
      apply(a)
    }}
    onEventResize={(a: { event: DemoEvent; start: string; end: string; allDay: boolean; resourceId?: string }) => {
      onEventResize?.(a)
      apply(a)
    }}
  >
    <DndContainer />
  </CalendarProvider>
</div>
