<script lang="ts">
  import { useCalendarDnd } from './useCalendarDnd.svelte'

  let { onSetContainer }: {
    onSetContainer: (setter: (el: HTMLElement | null) => void) => void
  } = $props()

  let containerEl = $state<HTMLElement | null>(null)

  useCalendarDnd<unknown, unknown>(() => containerEl)

  onSetContainer((el) => {
    containerEl = el
  })
</script>
