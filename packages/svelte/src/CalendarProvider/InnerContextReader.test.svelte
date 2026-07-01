<script lang="ts">
  import type { CalendarContextValue } from './calendarContext'
  import { useCalendarContext } from './useCalendarContext'

  let { onContext }: { onContext: (ctx: CalendarContextValue) => void } = $props()
  onContext(useCalendarContext())
</script>
