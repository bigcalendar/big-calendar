<script setup lang="ts">
import clsx from 'clsx'
import { computed } from 'vue'
const props = defineProps<{
  day: string
  label: string
  isToday: boolean
  onDrillDown: () => void
}>()
const cls = computed(() => clsx('bc-day-heading', props.isToday && 'bc-today'))
</script>
<template>
  <button type="button" :class="cls" @click="onDrillDown">{{ label }}</button>
</template>
