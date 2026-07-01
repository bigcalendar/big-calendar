<script lang="ts" generics="TEvent = unknown">
import AgendaEventButton from '../AgendaEventButton/AgendaEventButton.svelte'
let { event, title, time }: { event: TEvent; title: string; time: string; allDay: boolean } = $props()
</script>
<div class="bc-agenda-row">
  <span class="bc-agenda-time">{time}</span>
  <AgendaEventButton {event} {title} />
</div>
