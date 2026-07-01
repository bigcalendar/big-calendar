<script lang="ts">
let { long, short }: { day: string; long: string; short: string } = $props()
</script>
<div class="bc-weekday">
  <span class="bc-weekday-long">{long}</span>
  <span class="bc-weekday-short">{short}</span>
</div>
