<script lang="ts">
  let { title, time }: { title: string; time: string; event: unknown } = $props()
</script>

<div style="display:flex;flex-direction:column;gap:0.1em;padding:0.1em 0;">
  <span style="font-weight:700;font-size:0.85em;line-height:1.2;">{title}</span>
  <span style="font-size:0.7em;opacity:0.75;">{time}</span>
</div>
