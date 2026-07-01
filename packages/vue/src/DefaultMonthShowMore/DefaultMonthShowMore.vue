<script setup lang="ts" generic="TEvent = unknown">
import type { Component } from 'vue'
import EventButton from '../EventButton/EventButton.vue'
import Popover from '../Popover/Popover.vue'
import type { ShowMoreEvent } from '../components.type'

const props = defineProps<{
  count: number
  label: string
  day: string
  events: ReadonlyArray<ShowMoreEvent<TEvent>>
  eventSlot: Component
}>()
</script>

<template>
  <Popover placement="bottom-start" same-width class-name="bc-popover bc-show-more-popover">
    <template #trigger="{ setAnchor, popoverTarget, ariaHaspopup, ariaExpanded, ariaControls }">
      <button
        :ref="setAnchor"
        :popovertarget="popoverTarget"
        :aria-haspopup="ariaHaspopup"
        :aria-expanded="ariaExpanded"
        :aria-controls="ariaControls"
        type="button"
        class="bc-show-more"
      >{{ label }}</button>
    </template>
    <EventButton
      v-for="item in events"
      :key="item.key"
      class="bc-segment"
      :event="item.event"
      :title="item.title"
      :resize-edges="[]"
    >
      <component :is="props.eventSlot" :event="item.event" :title="item.title" />
    </EventButton>
  </Popover>
</template>
