<script setup lang="ts">
defineProps<{ day: string; label: string }>()
</script>
<template>
  <div class="bc-agenda-date">{{ label }}</div>
</template>
