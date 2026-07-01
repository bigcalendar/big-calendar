<script lang="ts">
  let { event, title }: { event: unknown; title: string } = $props()
  const type = (event as { type?: string })?.type
</script>

<span class={type ? `bc-event-type-${type}` : ''}>{title}</span>
