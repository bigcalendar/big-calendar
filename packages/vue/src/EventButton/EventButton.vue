<script setup lang="ts" generic="TEvent = unknown">
import { wrapAccessor } from '@big-calendar/core'
import type { ResizeEdge } from '@big-calendar/core'
import clsx from 'clsx'
import { computed, onUnmounted, ref } from 'vue'
import { useCalendarContext } from '../CalendarProvider'
import { useSignalRef } from '../internal/useSignalRef'

const DOUBLE_CLICK_MS = 250

const props = defineProps<{
  event: TEvent
  title: string
  time?: string | undefined
  class: string
  style?: Record<string, string> | undefined
  resizeEdges?: readonly ResizeEdge[] | undefined
}>()

const { store, descriptionIds } = useCalendarContext<TEvent>()
const { eventHandlers } = store

const idAccessor = wrapAccessor(store.accessors.id)
const id = computed(() => idAccessor(props.event))

const selectedRef = useSignalRef(store.selected)
const grabRef = useSignalRef(store.keyboardDrag)
const dndRef = useSignalRef(store.dndEnabled)

const isSelected = computed(() => id.value != null && selectedRef.value === id.value)
const isGrabbed = computed(() => id.value != null && grabRef.value != null && String(grabRef.value.id) === String(id.value))
const isDraggable = computed(() => dndRef.value && store.isDraggable(props.event))
const edges = computed<readonly ResizeEdge[]>(() =>
  props.resizeEdges != null && dndRef.value && store.isResizable(props.event)
    ? props.resizeEdges
    : [],
)

const buttonClass = computed(() =>
  clsx(props.class, isGrabbed.value && 'bc-event-grabbed', isDraggable.value && 'bc-event-draggable'),
)

const accessibleName = computed(() =>
  props.time ? `${props.title}, ${props.time}` : props.title,
)

const clickTimer = ref<ReturnType<typeof setTimeout> | null>(null)
onUnmounted(() => {
  if (clickTimer.value !== null) clearTimeout(clickTimer.value)
})

const select = () => {
  const evId = id.value
  if (evId != null) store.selectEvent({ id: evId })
}
const primary = (domEvent: MouseEvent | KeyboardEvent) => {
  select()
  eventHandlers.click(props.event, domEvent)
}
const secondary = (domEvent: MouseEvent | KeyboardEvent) => {
  select()
  eventHandlers.doubleClick(props.event, domEvent)
}

function handleClick(e: MouseEvent) {
  if (e.detail === 0) return
  if (clickTimer.value !== null) return
  clickTimer.value = setTimeout(() => {
    clickTimer.value = null
    primary(e)
  }, DOUBLE_CLICK_MS)
}

function handleDblClick(e: MouseEvent) {
  if (clickTimer.value !== null) {
    clearTimeout(clickTimer.value)
    clickTimer.value = null
  }
  secondary(e)
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    primary(e)
  } else if (e.key === 'F2') {
    e.preventDefault()
    secondary(e)
  }
}

function handleContextmenu(e: MouseEvent) {
  if (eventHandlers.hasRightClick) eventHandlers.rightClick(props.event, e)
}

function handleAuxclick(e: MouseEvent) {
  if (e.button === 1 && eventHandlers.hasMiddleClick) {
    eventHandlers.middleClick(props.event, e)
  }
}

function handlePointerdown(e: PointerEvent) {
  e.stopPropagation()
}
</script>

<template>
  <button
    type="button"
    :class="buttonClass"
    :style="style"
    :data-bc-event="id == null ? '' : String(id)"
    :aria-selected="isSelected"
    :aria-grabbed="isGrabbed || undefined"
    :aria-label="accessibleName || undefined"
    aria-keyshortcuts="Enter Space F2"
    :aria-describedby="descriptionIds.event"
    @click="handleClick"
    @dblclick="handleDblClick"
    @keydown="handleKeydown"
    @contextmenu="eventHandlers.hasRightClick ? handleContextmenu($event) : undefined"
    @auxclick="eventHandlers.hasMiddleClick ? handleAuxclick($event) : undefined"
    @pointerdown="handlePointerdown"
  >
    <slot />
    <span
      v-for="edge in edges"
      :key="edge"
      :class="`bc-resize-handle bc-resize-handle-${edge}`"
      :data-bc-resize="edge"
      aria-hidden="true"
    />
  </button>
</template>
