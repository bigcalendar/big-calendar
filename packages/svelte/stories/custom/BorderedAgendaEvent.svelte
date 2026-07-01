<script lang="ts">
  import AgendaEventButton from '../../src/AgendaEventButton/AgendaEventButton.svelte'

  let { event, title, time, allDay }: { event: unknown; title: string; time: string; allDay: boolean } = $props()
</script>

<div style="display:grid;grid-template-columns:6rem 1fr;gap:0.5rem;align-items:baseline;border-left:3px solid rebeccapurple;padding:0.25rem 0 0.25rem 0.75rem;">
  <span style="color:gray;font-size:0.8em;">{allDay ? 'all day' : time}</span>
  <AgendaEventButton {event} {title} />
</div>
