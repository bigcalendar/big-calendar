<script lang="ts">
  import type { Component } from 'svelte'
  import type { ShowMoreEvent } from '../../src/components.type'
  import Popover from '../../src/Popover/Popover.svelte'
  import EventButton from '../../src/EventButton/EventButton.svelte'

  let { count, events, eventSlot: EventSlot }: {
    count: number
    label: string
    events: ReadonlyArray<ShowMoreEvent<unknown>>
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
      style="display:flex;align-items:center;justify-content:flex-end;inline-size:100%;block-size:100%;font-size:0.7em;font-weight:700;color:rebeccapurple;padding-inline:3px;background:none;border:none;cursor:pointer;pointer-events:auto;"
    >
      +{count}
    </button>
  {/snippet}
  {#snippet children()}
    {#each events as item (item.key)}
      <EventButton class="bc-segment" event={item.event} title={item.title} resizeEdges={[]}>
        <svelte:component this={EventSlot} event={item.event} title={item.title} />
      </EventButton>
    {/each}
  {/snippet}
</Popover>
