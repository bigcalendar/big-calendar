<template>
  <p :id="descriptionIds.selection" class="bc-sr-only">
    {{ messages.selectionInstructions }}
  </p>
  <p :id="descriptionIds.event" class="bc-sr-only">
    {{ messages.eventInstructions }}
  </p>
  <slot />
</template>

<script setup lang="ts" generic="TEvent = unknown, TResource = unknown">
import { computed, provide, useAttrs, useId } from 'vue'
import { resolveMessages } from '@big-calendar/core'
import type { Messages } from '@big-calendar/core'
import type { CalendarProps } from '../useCalendarStore'
import { useCalendarStore } from '../useCalendarStore'
import type { CalendarComponents, CalendarContextValue } from './calendarContext'
import { CalendarKey } from './calendarContext'

export interface CalendarProviderProps<TEventP = unknown, TResourceP = unknown>
  extends CalendarProps<TEventP, TResourceP> {
  /** Per-slot component overrides (§10-5). */
  components?: CalendarComponents | undefined
  /** UI string overrides, merged over the English defaults. */
  messages?: Partial<Messages> | undefined
}

// @vue/compiler-sfc cannot resolve CalendarProps<TEvent, TResource> through the
// generic Omit<CalendarConfig<...>, ...> chain at compile time. If declared via
// defineProps, those fields are silently absent from the runtime props list and
// the store never receives them. The workaround:
//   • only the two CalendarProvider-specific props are declared (Vue can resolve
//     these inline types);
//   • all CalendarProps fields (localizer, events, onEventDrop, …) flow in via
//     attrs, which we forward to useCalendarStore.
defineOptions({ inheritAttrs: false })
const props = defineProps<{
  components?: CalendarComponents | undefined
  messages?: Partial<Messages> | undefined
}>()

// attrs carries every CalendarProps field passed by the caller.
const attrs = useAttrs()
const store = useCalendarStore<TEvent, TResource>(attrs as unknown as CalendarProps<TEvent, TResource>)

const messages = computed(() => resolveMessages(props.messages))

// Stable per-instance ids for the two visually-hidden instruction elements so
// slot cells and event buttons can point `aria-describedby` at shared text.
const baseId = useId()
const descriptionIds = computed(() => ({
  selection: `${baseId}selection`,
  event: `${baseId}event`,
}))

// Cast to the base (unknown, unknown) context type — the generic params are
// erased at the injection boundary and re-cast on the consumer side.
provide(CalendarKey, {
  get store() { return store },
  get components() { return props.components ?? {} },
  get messages() { return messages.value },
  get descriptionIds() { return descriptionIds.value },
} as CalendarContextValue)
</script>
