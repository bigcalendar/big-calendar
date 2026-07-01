<script lang="ts">
  import type { LocalizerContract } from '@big-calendar/core'
  import CalendarProvider from './CalendarProvider.svelte'
  import type { CalendarContextValue } from './calendarContext'
  import InnerContextReader from './InnerContextReader.test.svelte'

  let { localizer, defaultView, onContext }: {
    localizer: LocalizerContract
    defaultView: string
    onContext: (ctx: CalendarContextValue) => void
  } = $props()
</script>

<CalendarProvider {localizer} {defaultView}>
  <InnerContextReader {onContext} />
</CalendarProvider>
