<script lang="ts">
  let { title }: { title: string; event: unknown } = $props()
</script>

<span style="display:flex;align-items:center;gap:0.35em;font-style:italic;">
  <span style="display:inline-block;width:0.5em;height:0.5em;border-radius:50%;background:currentColor;flex-shrink:0;"></span>
  {title}
</span>
