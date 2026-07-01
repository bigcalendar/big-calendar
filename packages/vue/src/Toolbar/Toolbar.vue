<script setup lang="ts">
import type { Component } from 'vue'
import { useCalendarContext } from '../CalendarProvider'
import DefaultToolbar from '../DefaultToolbar/DefaultToolbar.vue'
import { useToolbarProps } from '../useToolbarProps/useToolbarProps'

const { components } = useCalendarContext()
const ToolbarComp = (components.toolbar ?? DefaultToolbar) as Component
const toolbarProps = useToolbarProps()
</script>

<template>
  <component :is="ToolbarComp" v-bind="toolbarProps" />
</template>
