<script setup lang="ts">
import clsx from 'clsx'
import { computed } from 'vue'
const props = defineProps<{
  day: string
  label: string
  isToday: boolean
  isOffRange: boolean
  onDrillDown: () => void
}>()
const cls = computed(() =>
  clsx('bc-date-cell', props.isToday && 'bc-today', props.isOffRange && 'bc-off-range'),
)
</script>
<template>
  <div :class="cls">
    <button type="button" class="bc-date-number" @click="onDrillDown">
      {{ label }}
    </button>
  </div>
</template>
