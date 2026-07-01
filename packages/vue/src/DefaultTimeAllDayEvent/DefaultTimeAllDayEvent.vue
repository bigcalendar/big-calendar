<script setup lang="ts" generic="TEvent = unknown">
defineProps<{ event: TEvent; title: string }>()
</script>
<template>
  <span class="bc-event-title">{{ title }}</span>
</template>
