<script lang="ts" generics="TEvent = unknown">
let { title }: { event: TEvent; title: string } = $props()
</script>
<span class="bc-event-title">{title}</span>
