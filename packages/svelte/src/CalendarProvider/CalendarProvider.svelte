<script lang="ts" generics="TEvent = unknown, TResource = unknown">
  import { setContext } from 'svelte'
  import { resolveMessages } from '@big-calendar/core'
  import type { Messages } from '@big-calendar/core'
  import type { CalendarComponents } from '../components.type'
  import { useCalendarStore } from '../useCalendarStore/useCalendarStore.svelte'
  import type { CalendarProps } from '../useCalendarStore/calendarProps.type'
  import type { CalendarContextValue } from './calendarContext'
  import { CALENDAR_CONTEXT_KEY } from './calendarContext'

  let { components = {}, messages: messageProp, children, ...calendarProps }: CalendarProps<TEvent, TResource> & {
    components?: CalendarComponents | undefined
    messages?: Partial<Messages> | undefined
    children?: import('svelte').Snippet
  } = $props()

  const store = useCalendarStore<TEvent, TResource>(() => calendarProps as CalendarProps<TEvent, TResource>)

  const resolvedMessages = $derived(resolveMessages(messageProp))

  // Generate stable per-instance ids for the visually-hidden instruction elements.
  const instanceId = Math.random().toString(36).slice(2)
  const descriptionIds = $derived({
    selection: `bc-sel-${instanceId}`,
    event: `bc-evt-${instanceId}`,
  })

  setContext<CalendarContextValue<TEvent, TResource>>(CALENDAR_CONTEXT_KEY, {
    get store() { return store },
    get components() { return components },
    get messages() { return resolvedMessages },
    get descriptionIds() { return descriptionIds },
  })
</script>

<p id={descriptionIds.selection} class="bc-sr-only">
  {resolvedMessages.selectionInstructions}
</p>
<p id={descriptionIds.event} class="bc-sr-only">
  {resolvedMessages.eventInstructions}
</p>

{@render children?.()}
