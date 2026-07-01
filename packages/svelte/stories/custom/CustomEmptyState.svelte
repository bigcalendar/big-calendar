<script lang="ts">
  let { message }: { message: string } = $props()
</script>

<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:4rem 2rem;gap:0.75rem;color:#888;">
  <div style="font-size:2rem;line-height:1;">(  )</div>
  <p style="margin:0;font-size:0.9em;">{message}</p>
</div>
