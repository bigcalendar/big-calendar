<script lang="ts">
  import Calendar from '../src/Calendar/Calendar.svelte'
  import { useCalendarDnd } from '../src/useCalendarDnd/useCalendarDnd.svelte'

  let containerEl = $state<HTMLElement | null>(null)
  useCalendarDnd(() => containerEl)
</script>

<div bind:this={containerEl} style="display: contents">
  <Calendar />
</div>
