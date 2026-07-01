<script lang="ts" generics="TEvent = unknown">
import type { Snippet } from 'svelte'
import { onDestroy } from 'svelte'
import type { ResizeEdge } from '@big-calendar/core'
import { wrapAccessor } from '@big-calendar/core'
import clsx from 'clsx'
import { useCalendarContext } from '../CalendarProvider'
import { fromSignal } from '../internal/fromSignal.svelte'

const DOUBLE_CLICK_MS = 250

let {
  event,
  title,
  time,
  class: extraClass = '',
  style,
  resizeEdges,
  children,
}: {
  event: TEvent
  title: string
  time?: string
  class?: string
  style?: string
  resizeEdges?: readonly ResizeEdge[]
  children?: Snippet
} = $props()

const { store, descriptionIds } = useCalendarContext<TEvent>()
const { eventHandlers } = store
const idAccessor = wrapAccessor(store.accessors.id)

const id = $derived(idAccessor(event))

const selected = fromSignal(store.selected)
const grabbed = fromSignal(store.keyboardDrag)
const dnd = fromSignal(store.dndEnabled)

const isSelected = $derived(id != null && selected.current === id)
const isGrabbed = $derived(id != null && grabbed.current != null && String(grabbed.current.id) === String(id))
const isDraggable = $derived(dnd.current && store.isDraggable(event))
const edges = $derived<readonly ResizeEdge[]>(
  resizeEdges != null && dnd.current && store.isResizable(event) ? resizeEdges : [],
)
const buttonClass = $derived(clsx(extraClass, isGrabbed && 'bc-event-grabbed', isDraggable && 'bc-event-draggable'))
const accessibleName = $derived(time ? `${title}, ${time}` : title)

let clickTimer: ReturnType<typeof setTimeout> | null = null
onDestroy(() => { if (clickTimer !== null) clearTimeout(clickTimer) })

const select = () => { if (id != null) store.selectEvent({ id }) }
const primary = (e: MouseEvent | KeyboardEvent) => { select(); eventHandlers.click(event, e) }
const secondary = (e: MouseEvent | KeyboardEvent) => { select(); eventHandlers.doubleClick(event, e) }

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

<button
  type="button"
  class={buttonClass}
  {style}
  data-bc-event={id == null ? '' : String(id)}
  aria-selected={isSelected}
  aria-grabbed={isGrabbed || undefined}
  aria-label={accessibleName || undefined}
  aria-keyshortcuts="Enter Space F2"
  aria-describedby={descriptionIds.event}
  onclick={handleClick}
  ondblclick={handleDblClick}
  onkeydown={handleKeydown}
  oncontextmenu={eventHandlers.hasRightClick ? (e) => eventHandlers.rightClick(event, e) : undefined}
  onauxclick={(e) => { if (e.button === 1 && eventHandlers.hasMiddleClick) eventHandlers.middleClick(event, e) }}
  onpointerdown={(e) => e.stopPropagation()}
>
  {@render children?.()}
  {#each edges as edge (edge)}
    <span class="bc-resize-handle bc-resize-handle-{edge}" data-bc-resize={edge} aria-hidden="true"></span>
  {/each}
</button>
