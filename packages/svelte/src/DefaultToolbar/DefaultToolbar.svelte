<script lang="ts">
import type { Messages, NavigateDirection, ViewKey } from '@big-calendar/core'
import { BUILTIN_VIEWS, Navigate } from '@big-calendar/core'

let {
  label,
  view,
  views,
  messages,
  onNavigate,
  onView,
}: {
  label: string
  view: ViewKey
  views: ViewKey[]
  messages: Messages
  onNavigate: (direction: NavigateDirection) => void
  onView: (view: ViewKey) => void
} = $props()

const BUILTIN = new Set<string>(BUILTIN_VIEWS)
function viewButtonLabel(key: ViewKey): string {
  return BUILTIN.has(key) ? (messages[key as keyof Messages] as string) ?? key : key
}
</script>

<div class="bc-toolbar">
  <div class="bc-toolbar-group">
    <button type="button" onclick={() => onNavigate(Navigate.PREVIOUS)}>{messages.previous}</button>
    <button type="button" onclick={() => onNavigate(Navigate.TODAY)}>{messages.today}</button>
    <button type="button" onclick={() => onNavigate(Navigate.NEXT)}>{messages.next}</button>
  </div>
  <span class="bc-toolbar-label">{label}</span>
  <div class="bc-toolbar-group">
    {#each views as option (option)}
      <button type="button" aria-pressed={option === view} onclick={() => onView(option)}>
        {viewButtonLabel(option)}
      </button>
    {/each}
  </div>
</div>
