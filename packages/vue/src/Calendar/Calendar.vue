<script setup lang="ts">
import type { Component } from 'vue'
import { computed } from 'vue'
import AgendaView from '../AgendaView/AgendaView.vue'
import { useCalendarContext } from '../CalendarProvider'
import { useSignalRef } from '../internal/useSignalRef'
import MonthView from '../MonthView/MonthView.vue'
import TimeGridView from '../TimeGridView/TimeGridView.vue'
import Toolbar from '../Toolbar/Toolbar.vue'

withDefaults(defineProps<{ toolbar?: boolean }>(), { toolbar: true })

const { store, components } = useCalendarContext()
const viewModel = useSignalRef(store.viewModel)

const overrideView = computed<Component | null>(
  () => (components.views?.[viewModel.value.view] as Component | undefined) ?? null,
)

const overrideModel = computed<unknown>(() => {
  const vm = viewModel.value
  if (vm.kind === 'month') return vm.month
  if (vm.kind === 'time') return vm.timeGrid
  if (vm.kind === 'agenda') return vm.agenda
  return (vm as unknown as { model?: unknown }).model ?? null
})
</script>

<template>
  <Toolbar v-if="toolbar" />
  <div class="bc-calendar">
    <component
      v-if="overrideView !== null"
      :is="overrideView"
      :view="viewModel.view"
      :model="overrideModel"
    />
    <template v-else>
      <MonthView v-if="viewModel.kind === 'month'" />
      <TimeGridView v-else-if="viewModel.kind === 'time'" />
      <AgendaView v-else-if="viewModel.kind === 'agenda'" />
    </template>
  </div>
</template>
