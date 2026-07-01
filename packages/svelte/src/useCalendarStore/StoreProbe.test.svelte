<script lang="ts">
  import type { CalendarStore } from '@big-calendar/core'
  import type { CalendarProps } from './calendarProps.type'
  import { useCalendarStore } from './useCalendarStore.svelte'

  let { initialProps, onStore, onPatch }: {
    initialProps: CalendarProps<unknown, unknown>
    onStore: (store: CalendarStore<unknown, unknown>) => void
    onPatch: (patcher: (patch: Partial<CalendarProps<unknown, unknown>>) => void) => void
  } = $props()

  let currentProps = $state<CalendarProps<unknown, unknown>>({ ...initialProps })

  const store = useCalendarStore(() => currentProps)
  onStore(store)
  onPatch((patch) => {
    Object.assign(currentProps, patch)
  })
</script>
