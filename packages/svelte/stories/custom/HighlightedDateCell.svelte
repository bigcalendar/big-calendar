<script lang="ts">
  let { label, isToday, isOffRange, onDrillDown }: {
    label: string; isToday: boolean; isOffRange: boolean; onDrillDown: () => void; day: string
  } = $props()
</script>

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
