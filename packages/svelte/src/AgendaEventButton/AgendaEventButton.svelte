<script lang="ts" generics="TEvent = unknown">
import { onDestroy } from 'svelte'
import { useCalendarContext } from '../CalendarProvider'

const DOUBLE_CLICK_MS = 250

let { event, title }: { event: TEvent; title: string } = $props()

const { store } = useCalendarContext<TEvent>()
const { eventHandlers } = store

let clickTimer: ReturnType<typeof setTimeout> | null = null
onDestroy(() => { if (clickTimer !== null) clearTimeout(clickTimer) })

const primary = (domEvent: MouseEvent | KeyboardEvent) => eventHandlers.click(event, domEvent)
const secondary = (domEvent: MouseEvent | KeyboardEvent) => eventHandlers.doubleClick(event, domEvent)

function handleClick(e: MouseEvent) {
  if (e.detail === 0) return
  if (clickTimer !== null) return
  clickTimer = setTimeout(() => { clickTimer = null; primary(e) }, DOUBLE_CLICK_MS)
}

function handleDblClick(e: MouseEvent) {
  if (clickTimer !== null) { clearTimeout(clickTimer); clickTimer = null }
  secondary(e)
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); primary(e) }
  else if (e.key === 'F2') { e.preventDefault(); secondary(e) }
}
</script>

{#if !eventHandlers.has}
  <span class="bc-agenda-event">{title}</span>
{:else}
  <button
    type="button"
    class="bc-agenda-event"
    aria-keyshortcuts="Enter Space F2"
    onclick={handleClick}
    ondblclick={handleDblClick}
    onkeydown={handleKeydown}
    oncontextmenu={eventHandlers.hasRightClick ? (e) => eventHandlers.rightClick(event, e) : undefined}
    onauxclick={(e) => { if (e.button === 1 && eventHandlers.hasMiddleClick) eventHandlers.middleClick(event, e) }}
  >{title}</button>
{/if}
