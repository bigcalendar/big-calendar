<script setup lang="ts">
defineProps<{
  day: string
  label: string
  isToday: boolean
  isOffRange: boolean
  onDrillDown: () => void
}>()
</script>
<template>
  <button type="button" class="bc-date-number" @click="onDrillDown">
    {{ label }}
  </button>
</template>
