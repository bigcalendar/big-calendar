<script lang="ts">
import clsx from 'clsx'
let { label, isToday, isOffRange, onDrillDown }: {
  day: string
  label: string
  isToday: boolean
  isOffRange: boolean
  onDrillDown: () => void
} = $props()
const cls = $derived(clsx('bc-date-cell', isToday && 'bc-today', isOffRange && 'bc-off-range'))
</script>
<div class={cls}>
  <button type="button" class="bc-date-number" onclick={onDrillDown}>{label}</button>
</div>
