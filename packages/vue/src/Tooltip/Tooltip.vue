<script setup lang="ts">
import type { FloatingPlacement } from '@big-calendar/core/utils'
import { ref, shallowRef, useId, watch } from 'vue'
import type { ComponentPublicInstance } from 'vue'
import { useFloatingAnchor } from '../internal/useFloatingAnchor'

interface PopoverControl {
  showPopover?: () => void
  hidePopover?: () => void
}

defineProps<{
  label: string
  placement?: FloatingPlacement
}>()

const id = useId()
const open = ref(false)
const anchorRef = shallowRef<HTMLSpanElement | null>(null)
const tipRef = shallowRef<HTMLDivElement | null>(null)

function setAnchorRef(el: Element | ComponentPublicInstance | null): void {
  anchorRef.value = el as HTMLSpanElement | null
}

function setTipRef(el: Element | ComponentPublicInstance | null): void {
  tipRef.value = el as HTMLDivElement | null
}

function show(): void { open.value = true }
function hide(): void { open.value = false }
function toggle(): void { open.value = !open.value }

watch(open, (isOpen) => {
  const tip = tipRef.value as (HTMLDivElement & PopoverControl) | null
  if (!tip) return
  if (isOpen) {
    if (typeof tip.showPopover === 'function') tip.showPopover()
  } else {
    if (typeof tip.hidePopover === 'function') tip.hidePopover()
  }
})

useFloatingAnchor(open, anchorRef, tipRef)
</script>

<template>
  <span
    :ref="setAnchorRef"
    class="bc-tooltip-anchor"
    style="display: inline-flex"
    :aria-describedby="id"
    @pointerenter="show"
    @pointerleave="hide"
    @focus="show"
    @blur="hide"
    @click="toggle"
  >
    <slot />
    <div
      :ref="setTipRef"
      :id="id"
      role="tooltip"
      popover="manual"
      class="bc-tooltip"
    >
      {{ label }}
    </div>
  </span>
</template>
