<script setup lang="ts">
defineProps<{ time: string; label: string }>()
</script>
<template>
  <span class="bc-time-label">{{ label }}</span>
</template>
