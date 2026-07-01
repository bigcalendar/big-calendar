<script lang="ts">
  import type { CalendarStore } from '@big-calendar/core'
  import { useMonthRowMeasure } from './useMonthRowMeasure.svelte'

  let { store, weekCount }: {
    store: CalendarStore<unknown>
    weekCount: number
  } = $props()

  let gridEl = $state<HTMLElement | null>(null)

  useMonthRowMeasure({
    getGrid: () => gridEl,
    getWeekCount: () => weekCount,
    store,
  })
</script>

<div bind:this={gridEl} data-testid="grid">
  {#each Array(weekCount) as _, i (i)}
    <div class="bc-month-week">
      <div class="bc-week-events"></div>
    </div>
  {/each}
</div>
