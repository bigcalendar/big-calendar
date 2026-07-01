<script lang="ts">
import type { Snippet } from 'svelte'

let {
  open,
  onClose,
  className,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
  children,
}: {
  open: boolean
  onClose: () => void
  className?: string
  'aria-label'?: string
  'aria-labelledby'?: string
  children?: Snippet
} = $props()

let dialogEl: HTMLDialogElement | null = $state(null)
let restoreFocus: HTMLElement | null = null

$effect(() => {
  const dialog = dialogEl
  if (!dialog) return

  const handleClose = () => onClose()
  dialog.addEventListener('close', handleClose)
  return () => dialog.removeEventListener('close', handleClose)
})

$effect(() => {
  const dialog = dialogEl
  if (!dialog) return
  if (open) {
    restoreFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    if (typeof (dialog as HTMLDialogElement & { showModal?: () => void }).showModal === 'function' && !dialog.open) {
      dialog.showModal()
    }
  } else {
    if (typeof (dialog as HTMLDialogElement & { close?: () => void }).close === 'function' && dialog.open) {
      dialog.close()
    }
    restoreFocus?.focus()
  }
})
</script>

<dialog
  bind:this={dialogEl}
  class={className ?? 'bc-dialog'}
  aria-label={ariaLabel}
  aria-labelledby={ariaLabelledby}
>
  {#if open}
    {@render children?.()}
  {/if}
</dialog>
