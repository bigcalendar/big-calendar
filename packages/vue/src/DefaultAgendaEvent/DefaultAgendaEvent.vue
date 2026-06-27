<script setup lang="ts" generic="TEvent = unknown">
import AgendaEventButton from '../AgendaEventButton/AgendaEventButton.vue'
defineProps<{ event: TEvent; title: string; time: string; allDay: boolean }>()
</script>
<template>
  <div class="bc-agenda-row">
    <span class="bc-agenda-time">{{ time }}</span>
    <AgendaEventButton :event="event" :title="title" />
  </div>
</template>
