<script lang="ts" generics="TEvent = unknown">
import type { Component } from 'svelte'
import EventButton from '../EventButton/EventButton.svelte'
import Popover from '../Popover/Popover.svelte'
import type { ShowMoreEvent } from '../components.type'

let {
  count: _count,
  label,
  day: _day,
  events,
  eventSlot: EventSlot,
}: {
  count: number
  label: string
  day: string
  events: ReadonlyArray<ShowMoreEvent<TEvent>>
  eventSlot: Component
} = $props()
</script>

<Popover placement="bottom-start" sameWidth className="bc-popover bc-show-more-popover">
  {#snippet trigger({ bindAnchor, popoverTarget, ariaHaspopup, ariaExpanded, ariaControls })}
    <button
      use:bindAnchor
      popovertarget={popoverTarget}
      aria-haspopup={ariaHaspopup}
      aria-expanded={ariaExpanded}
      aria-controls={ariaControls}
      type="button"
      class="bc-show-more"
    >{label}</button>
  {/snippet}
  {#each events as item (item.key)}
    <EventButton class="bc-segment" event={item.event} title={item.title} resizeEdges={[]}>
      <svelte:component this={EventSlot} event={item.event} title={item.title} />
    </EventButton>
  {/each}
</Popover>
