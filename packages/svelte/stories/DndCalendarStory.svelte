<script lang="ts">
  import type { DemoEvent } from './demoEvents'
  import CalendarProvider from '../src/CalendarProvider/CalendarProvider.svelte'
  import DndContainer from './DndContainer.svelte'
  import { localizer } from './localizerRef'
  import { demoEvents, FOCUS, NOW } from './harness'

  let {
    defaultView = 'week',
    lockAllDayEvents = false,
    onRangeChange,
    onEventDrop,
    onEventResize,
  }: {
    defaultView?: string
    lockAllDayEvents?: boolean
    onRangeChange?: (a: unknown) => void
    onEventDrop?: (a: unknown) => void
    onEventResize?: (a: unknown) => void
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
    {defaultView}
    accessors={lockAllDayEvents ? { draggable: (e: DemoEvent) => !e.allDay } : undefined}
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
