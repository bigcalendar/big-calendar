<script setup lang="ts">
import { onMounted, onUnmounted, shallowRef, watch } from 'vue'
import type { ComponentPublicInstance } from 'vue'

interface DialogControl {
  showModal?: () => void
  close?: () => void
  open?: boolean
}

const props = defineProps<{
  open: boolean
  onClose: () => void
  className?: string
  'aria-label'?: string
  'aria-labelledby'?: string
}>()

const dialogRef = shallowRef<(HTMLDialogElement & DialogControl) | null>(null)
let restoreFocus: HTMLElement | null = null

function setDialogRef(el: Element | ComponentPublicInstance | null): void {
  dialogRef.value = el as (HTMLDialogElement & DialogControl) | null
}

function handleCloseEvent(): void {
  props.onClose()
}

onMounted(() => {
  dialogRef.value?.addEventListener('close', handleCloseEvent)
})

onUnmounted(() => {
  dialogRef.value?.removeEventListener('close', handleCloseEvent)
})

watch(
  () => props.open,
  (isOpen) => {
    const dialog = dialogRef.value
    if (!dialog) return
    if (isOpen) {
      restoreFocus =
        document.activeElement instanceof HTMLElement ? document.activeElement : null
      if (typeof dialog.showModal === 'function' && !dialog.open) dialog.showModal()
    } else {
      if (typeof dialog.close === 'function' && dialog.open) dialog.close()
      restoreFocus?.focus()
    }
  },
)
</script>

<template>
  <dialog
    :ref="setDialogRef"
    :class="className ?? 'bc-dialog'"
    :aria-label="$props['aria-label']"
    :aria-labelledby="$props['aria-labelledby']"
  >
    <slot v-if="open" />
  </dialog>
</template>
