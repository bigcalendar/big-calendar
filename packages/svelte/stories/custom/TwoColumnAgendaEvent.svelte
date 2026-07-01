<script lang="ts">
  let { title, time, allDay }: { title: string; time: string; allDay: boolean; event: unknown } = $props()
</script>

<div style="display:grid;grid-template-columns:7rem 1fr;gap:0.75rem;align-items:baseline;padding:0.3rem 0;">
  <span style="color:gray;font-variant-numeric:tabular-nums;font-size:0.85em;">{allDay ? 'all day' : time}</span>
  <strong>{title}</strong>
</div>
