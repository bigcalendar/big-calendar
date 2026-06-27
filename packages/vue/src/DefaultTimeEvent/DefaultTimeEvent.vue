<script setup lang="ts" generic="TEvent = unknown">
defineProps<{ event: TEvent; title: string; time: string }>()
</script>
<template>
  <span class="bc-event-title">{{ title }}</span>
  <span class="bc-event-time">{{ time }}</span>
</template>
