<script lang="ts">
import clsx from 'clsx'
let { label, isToday, onDrillDown }: { day: string; label: string; isToday: boolean; onDrillDown: () => void } = $props()
const cls = $derived(clsx('bc-day-heading', isToday && 'bc-today'))
</script>
<button type="button" class={cls} onclick={onDrillDown}>{label}</button>
