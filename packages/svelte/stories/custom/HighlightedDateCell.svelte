<script lang="ts">
  import clsx from 'clsx'
  let { label, isToday, isOffRange, onDrillDown }: {
    label: string; isToday: boolean; isOffRange: boolean; onDrillDown: () => void; day: string
  } = $props()
  const cls = $derived(clsx('bc-date-cell', isToday && 'bc-today', isOffRange && 'bc-off-range'))
</script>

<div class={cls}>
  <button
    type="button"
    class="bc-date-number"
    onclick={onDrillDown}
    style:background={isToday ? 'rebeccapurple' : undefined}
    style:color={isToday ? 'white' : isOffRange ? '#aaa' : undefined}
    style:font-weight={isToday ? 700 : undefined}
    style:border-radius="50%"
    style:width="2em"
    style:height="2em"
    style:cursor="pointer"
  >
    {label}
  </button>
</div>
