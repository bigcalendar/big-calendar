<script lang="ts" module>
  import { EXTERNAL_MIME } from '@big-calendar/dnd'

  const PALETTE: { label: string; payload: Record<string, unknown> }[] = [
    { label: '30-min meeting',            payload: { durationMinutes: 30 } },
    { label: '1-hour focus block',        payload: { durationMinutes: 60 } },
    { label: '90-min workshop',           payload: { durationMinutes: 90 } },
    { label: 'Holiday (all-day)',         payload: {} },
    { label: '9–10am standup (re-dated)', payload: { start: '2020-01-01T09:00:00.000Z', end: '2020-01-01T10:00:00.000Z' } },
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
    view = Views.WEEK,
    onRangeChange,
    onDropFromOutside,
  }: {
    view?: string
    onRangeChange?: (a: unknown) => void
    onDropFromOutside?: (a: unknown) => void
  } = $props()

  let events = $state<DemoEvent[]>([...demoEvents])
  let nextId = $state(1000)

  const getNow = () => NOW

  function onDragStart(e: DragEvent, item: { payload: Record<string, unknown> }) {
    if (!e.dataTransfer) return
    e.dataTransfer.effectAllowed = 'copy'
    e.dataTransfer.setData(EXTERNAL_MIME, JSON.stringify(item.payload))
  }

  function handleDropFromOutside(a: { start: string; end: string; allDay: boolean }) {
    events = [...events, { id: nextId++, title: 'New event', start: a.start, end: a.end, allDay: a.allDay }]
    onDropFromOutside?.(a)
  }
</script>

<div style="display: flex; gap: 1rem; block-size: 100dvh; inline-size: 100%">
  <aside style="display: flex; flex-direction: column; gap: 0.5rem; flex: 0 0 13rem; padding-block-start: 0.5rem">
    <strong style="font-size: 0.8rem">Drag onto the calendar →</strong>
    {#each PALETTE as item (item.label)}
      <div
        draggable="true"
        ondragstart={(e) => onDragStart(e, item)}
        style="padding: 0.5rem 0.6rem; border: 1px solid var(--bc-color-border, #d4d4d8); border-radius: 6px; background: var(--bc-color-surface, #fff); cursor: grab; font-size: 0.8rem"
      >
        {item.label}
      </div>
    {/each}
  </aside>
  <div style="flex: 1; min-inline-size: 0">
    <CalendarProvider
      {localizer}
      {events}
      defaultDate={FOCUS}
      {getNow}
      defaultView={view}
      {onRangeChange}
      onDropFromOutside={handleDropFromOutside}
    >
      <DndContainer />
    </CalendarProvider>
  </div>
</div>
