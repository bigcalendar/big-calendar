<script lang="ts">
import type { Snippet } from 'svelte'
import type { FloatingPlacement } from '@big-calendar/core/utils'
import { useFloatingAnchor } from '../internal/useFloatingAnchor.svelte'

interface TriggerSlotProps {
  bindAnchor: (node: HTMLElement) => { destroy: () => void }
  popoverTarget: string
  ariaHaspopup: 'dialog'
  ariaExpanded: boolean
  ariaControls: string
}

let {
  placement = 'bottom-start',
  className = 'bc-popover',
  sameWidth,
  trigger,
  children,
}: {
  placement?: FloatingPlacement
  className?: string
  sameWidth?: boolean
  trigger: Snippet<[TriggerSlotProps]>
  children?: Snippet
} = $props()

const id = `bc-pop-${Math.random().toString(36).slice(2)}`
let open = $state(false)
let anchorEl: HTMLElement | null = $state(null)
let panelEl: HTMLDivElement | null = $state(null)

function bindAnchor(node: HTMLElement) {
  anchorEl = node
  return { destroy() { anchorEl = null } }
}

function handleToggle(e: Event) {
  open = (e as Event & { newState: string }).newState === 'open'
}

useFloatingAnchor(
  () => open,
  () => anchorEl,
  () => panelEl,
  placement,
  sameWidth,
)
</script>

{@render trigger({ bindAnchor, popoverTarget: id, ariaHaspopup: 'dialog', ariaExpanded: open, ariaControls: id })}
<div
  bind:this={panelEl}
  {id}
  popover="auto"
  class={className}
  ontoggle={handleToggle}
>
  {#if open}
    {@render children?.()}
  {/if}
</div>
