<script lang="ts" generics="TEvent = unknown">
import { useAgendaView } from '../useAgendaView'

const {
  rows,
  components: { DateSlot, EventSlot, EmptySlot },
  messages,
  root,
  header,
  headingCell,
  body,
  getRowProps,
} = useAgendaView<TEvent>()
</script>

{#if rows.current !== null}
  <div {...root}>
    <div {...header}>
      <span {...headingCell}>{messages.date}</span>
      <span {...headingCell}>{messages.time}</span>
      <span {...headingCell}>{messages.event}</span>
    </div>
    {#if rows.current.length === 0}
      <svelte:component this={EmptySlot} message={messages.noEventsInRange} />
    {:else}
      <div {...body}>
        {#each rows.current as row (row.day)}
          <div {...getRowProps(row)}>
            <svelte:component this={DateSlot} day={row.day} label={row.label} />
            {#each row.events as item (item.key)}
              <svelte:component this={EventSlot} event={item.event} title={item.title} time={item.time} allDay={item.allDay} />
            {/each}
          </div>
        {/each}
      </div>
    {/if}
  </div>
{/if}
