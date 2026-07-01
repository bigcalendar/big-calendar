<script lang="ts">
import type { Snippet } from 'svelte'
import type { FloatingPlacement } from '@big-calendar/core/utils'
import { useFloatingAnchor } from '../internal/useFloatingAnchor.svelte'

let {
  label,
  placement,
  children,
}: {
  label: string
  placement?: FloatingPlacement
  children?: Snippet
} = $props()

const id = `bc-tip-${Math.random().toString(36).slice(2)}`
let open = $state(false)
let anchorEl: HTMLSpanElement | null = $state(null)
let tipEl: HTMLDivElement | null = $state(null)

function show() { open = true }
function hide() { open = false }
function toggle() { open = !open }

$effect(() => {
  const tip = tipEl as (HTMLDivElement & { showPopover?: () => void; hidePopover?: () => void }) | null
  if (!tip) return
  if (open) {
    tip.showPopover?.()
  } else {
    tip.hidePopover?.()
  }
})

useFloatingAnchor(() => open, () => anchorEl, () => tipEl, placement)
</script>

<span
  bind:this={anchorEl}
  class="bc-tooltip-anchor"
  style="display:inline-flex"
  aria-describedby={id}
  onpointerenter={show}
  onpointerleave={hide}
  onfocus={show}
  onblur={hide}
  onclick={toggle}
>
  {@render children?.()}
  <div
    bind:this={tipEl}
    {id}
    role="tooltip"
    popover="manual"
    class="bc-tooltip"
  >{label}</div>
</span>
