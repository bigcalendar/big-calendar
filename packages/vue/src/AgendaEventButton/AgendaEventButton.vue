<script setup lang="ts" generic="TEvent = unknown">
import { ref, onUnmounted } from 'vue'
import { useCalendarContext } from '../CalendarProvider'

const DOUBLE_CLICK_MS = 250

const props = defineProps<{
  event: TEvent
  title: string
}>()

const { store } = useCalendarContext<TEvent>()
const { eventHandlers } = store

const clickTimer = ref<ReturnType<typeof setTimeout> | null>(null)
onUnmounted(() => {
  if (clickTimer.value !== null) clearTimeout(clickTimer.value)
})

const primary = (domEvent: MouseEvent | KeyboardEvent) => eventHandlers.click(props.event, domEvent)
const secondary = (domEvent: MouseEvent | KeyboardEvent) => eventHandlers.doubleClick(props.event, domEvent)

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
</script>

<template>
  <span v-if="!eventHandlers.has" class="bc-agenda-event">{{ title }}</span>
  <button
    v-else
    type="button"
    class="bc-agenda-event"
    aria-keyshortcuts="Enter Space F2"
    @click="handleClick"
    @dblclick="handleDblClick"
    @keydown="handleKeydown"
    @contextmenu="eventHandlers.hasRightClick ? eventHandlers.rightClick(event, $event) : undefined"
    @auxclick="$event.button === 1 && eventHandlers.hasMiddleClick ? eventHandlers.middleClick(event, $event) : undefined"
  >{{ title }}</button>
</template>
