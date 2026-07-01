<script lang="ts">
  let { label, isToday, onDrillDown }: {
    label: string; day: string; isToday: boolean; onDrillDown: () => void
  } = $props()
</script>

<button
  type="button"
  onclick={onDrillDown}
  style:background={isToday ? 'rebeccapurple' : 'transparent'}
  style:color={isToday ? 'white' : 'inherit'}
  style:font-weight={isToday ? 700 : 400}
  style="border:none;border-radius:0.25em;padding:0.2em 0.6em;cursor:pointer;width:100%;"
>
  {label}
</button>
