<script setup lang="ts">
import type { NavigateDirection, ViewKey } from '@big-calendar/core'
import { BUILTIN_VIEWS, Navigate } from '@big-calendar/core'
import type { Messages } from '@big-calendar/core'

const props = defineProps<{
  label: string
  view: ViewKey
  views: ViewKey[]
  messages: Messages
  onNavigate: (direction: NavigateDirection) => void
  onView: (view: ViewKey) => void
}>()

const BUILTIN = new Set<string>(BUILTIN_VIEWS)

function viewButtonLabel(key: ViewKey): string {
  return BUILTIN.has(key) ? (props.messages[key as keyof Messages] as string) ?? key : key
}
</script>

<template>
  <div class="bc-toolbar">
    <div class="bc-toolbar-group">
      <button type="button" @click="onNavigate(Navigate.PREVIOUS)">
        {{ messages.previous }}
      </button>
      <button type="button" @click="onNavigate(Navigate.TODAY)">
        {{ messages.today }}
      </button>
      <button type="button" @click="onNavigate(Navigate.NEXT)">
        {{ messages.next }}
      </button>
    </div>
    <span class="bc-toolbar-label">{{ label }}</span>
    <div class="bc-toolbar-group">
      <button
        v-for="option in views"
        :key="option"
        type="button"
        :aria-pressed="option === view"
        @click="onView(option)"
      >
        {{ viewButtonLabel(option) }}
      </button>
    </div>
  </div>
</template>
