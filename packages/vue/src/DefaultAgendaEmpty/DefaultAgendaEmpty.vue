<script setup lang="ts">
defineProps<{ message: string }>()
</script>
<template>
  <div class="bc-agenda-empty">{{ message }}</div>
</template>
