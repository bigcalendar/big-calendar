<script lang="ts">
let { label, onDrillDown }: {
  day: string
  label: string
  isToday: boolean
  isOffRange: boolean
  onDrillDown: () => void
} = $props()
</script>
<button type="button" class="bc-date-number" onclick={onDrillDown}>{label}</button>
