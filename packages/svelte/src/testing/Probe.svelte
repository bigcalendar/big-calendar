<script lang="ts">
  /**
   * Generic test probe: calls `run` synchronously during component setup,
   * which means $effect, $state, and $derived in any invoked composable are
   * registered under this component's reactive owner.
   */
  let { run }: { run: () => void } = $props()
  run()
</script>
