<script lang="ts">
  let { title }: { title: string; event: unknown } = $props()
</script>

<span style="display:flex;align-items:center;gap:0.25em;font-style:italic;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
  <span style="display:inline-block;width:0.4em;height:0.4em;border-radius:50%;background:currentColor;flex-shrink:0;"></span>
  {title}
</span>
