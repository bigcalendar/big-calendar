<script lang="ts">
  let { event, title, time }: { event: unknown; title: string; time: string } = $props()
  const type = (event as { type?: string })?.type
</script>

<span
  class={type ? `bc-event-type-${type}` : ''}
  style="display:flex;flex-direction:column;gap:0.1em;overflow:hidden;"
>
  <strong style="font-size:0.85em;line-height:1.2;">{title}</strong>
  <span style="font-size:0.7em;opacity:0.75;">{time}</span>
</span>
