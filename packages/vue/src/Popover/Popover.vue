<script setup lang="ts">
import type { FloatingPlacement } from '@big-calendar/core/utils'
import { ref, shallowRef, useId } from 'vue'
import type { ComponentPublicInstance } from 'vue'
import { useFloatingAnchor } from '../internal/useFloatingAnchor'

interface PopoverToggleEvent extends Event {
  readonly newState: string
}

const {
  placement = 'bottom-start',
  className = 'bc-popover',
  sameWidth,
} = defineProps<{
  placement?: FloatingPlacement
  className?: string
  sameWidth?: boolean
}>()

defineSlots<{
  trigger(props: {
    setAnchor: (el: Element | ComponentPublicInstance | null) => void
    popoverTarget: string
    ariaHaspopup: 'dialog'
    ariaExpanded: boolean
    ariaControls: string
  }): unknown
  default(): unknown
}>()

const id = useId()
const open = ref(false)
const anchorRef = shallowRef<HTMLElement | null>(null)
const panelRef = shallowRef<HTMLDivElement | null>(null)

function setAnchor(el: Element | ComponentPublicInstance | null): void {
  anchorRef.value = el as HTMLElement | null
}

function setPanelRef(el: Element | ComponentPublicInstance | null): void {
  panelRef.value = el as HTMLDivElement | null
}

function handleToggle(event: Event): void {
  open.value = (event as PopoverToggleEvent).newState === 'open'
}

useFloatingAnchor(open, anchorRef, panelRef, placement, sameWidth)
</script>

<template>
  <slot
    name="trigger"
    :set-anchor="setAnchor"
    :popover-target="id"
    :aria-haspopup="'dialog'"
    :aria-expanded="open"
    :aria-controls="id"
  />
  <div
    :ref="setPanelRef"
    :id="id"
    popover="auto"
    :class="className"
    @toggle="handleToggle"
  >
    <slot v-if="open" />
  </div>
</template>
