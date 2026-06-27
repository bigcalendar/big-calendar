<script setup lang="ts">
defineProps<{ day: string; long: string; short: string }>()
</script>
<template>
  <div class="bc-weekday">
    <span class="bc-weekday-long">{{ long }}</span>
    <span class="bc-weekday-short">{{ short }}</span>
  </div>
</template>
