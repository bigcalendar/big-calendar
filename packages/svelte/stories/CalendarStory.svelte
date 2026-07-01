<script lang="ts">
  import type { LocalizerContract } from '@big-calendar/core'
  import type { Messages } from '@big-calendar/core'
  import type { CalendarComponents } from '../src/components.type'
  import CalendarProvider from '../src/CalendarProvider/CalendarProvider.svelte'
  import Calendar from '../src/Calendar/Calendar.svelte'
  import { localizer as _defaultLocalizer } from './localizerRef'
  import { demoEvents, FOCUS, NOW } from './harness'

  let {
    localizer: localizerProp,
    defaultView = 'month',
    defaultDate = FOCUS,
    events = demoEvents,
    backgroundEvents,
    views,
    selectable,
    weekEventLimit,
    showAllEvents,
    dayLayoutAlgorithm,
    min,
    max,
    scrollToTime,
    accessors,
    resources,
    resourceLayout,
    messages,
    getNow = () => NOW,
    onEventClick,
    onEventDoubleClick,
    onEventRightClick,
    onEventMiddleClick,
    onSlotClick,
    onSlotDoubleClick,
    onSlotSelect,
    onSlotSelecting,
    onRangeChange,
    onNavigate,
    onView,
    components,
    dir,
    lang,
    storeKey,
  }: {
    localizer?: LocalizerContract
    defaultView?: string
    defaultDate?: string
    events?: unknown[]
    backgroundEvents?: unknown[]
    views?: string[]
    selectable?: boolean | 'ignore-events'
    weekEventLimit?: number
    showAllEvents?: boolean
    dayLayoutAlgorithm?: string
    min?: { hour: number; minute?: number }
    max?: { hour: number; minute?: number }
    scrollToTime?: { hour: number; minute?: number }
    accessors?: Record<string, unknown>
    resources?: unknown[]
    resourceLayout?: string
    messages?: Partial<Messages>
    getNow?: () => string
    onEventClick?: (event: unknown) => void
    onEventDoubleClick?: (event: unknown) => void
    onEventRightClick?: (event: unknown, e: MouseEvent) => void
    onEventMiddleClick?: (event: unknown, e: MouseEvent) => void
    onSlotClick?: (info: unknown) => void
    onSlotDoubleClick?: (info: unknown) => void
    onSlotSelect?: (info: unknown) => void
    onSlotSelecting?: (info: unknown) => boolean | undefined
    onRangeChange?: (info: unknown) => void
    onNavigate?: (info: unknown) => void
    onView?: (view: string) => void
    components?: CalendarComponents
    dir?: string
    lang?: string
    storeKey?: string
  } = $props()
</script>

<div style="block-size: 100dvh; inline-size: 100%" {dir} {lang}>
  {#key storeKey}
    <CalendarProvider
      localizer={localizerProp ?? _defaultLocalizer}
      {events}
      {defaultDate}
      {getNow}
      {defaultView}
      {backgroundEvents}
      {views}
      {selectable}
      {weekEventLimit}
      {showAllEvents}
      {dayLayoutAlgorithm}
      {min}
      {max}
      {scrollToTime}
      {accessors}
      {resources}
      {resourceLayout}
      {messages}
      {onEventClick}
      {onEventDoubleClick}
      {onEventRightClick}
      {onEventMiddleClick}
      {onSlotClick}
      {onSlotDoubleClick}
      {onSlotSelect}
      {onSlotSelecting}
      {onRangeChange}
      {onNavigate}
      {onView}
      {components}
    >
      <Calendar />
    </CalendarProvider>
  {/key}
</div>
