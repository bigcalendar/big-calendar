<script lang="ts" generics="TEvent = unknown">
let { title, time }: { event: TEvent; title: string; time: string } = $props()
</script>
<span class="bc-event-title">{title}</span>
<span class="bc-event-time">{time}</span>
