<script lang="ts" generics="TEvent = unknown">
import EventButton from '../EventButton/EventButton.svelte'
import { captureListeners } from '../internal/captureAction'
import { useMonthView } from '../useMonthView'

let rootEl: HTMLElement | null = $state(null)
let gridEl: HTMLElement | null = $state(null)

const mv = useMonthView<TEvent>(() => rootEl, () => gridEl)
const {
  grid,
  components: { Weekday, DateCell, EventSlot, ShowMore },
  drilldown,
  announcer,
  monthHeader,
  weekRow,
  slotsContainer,
  backgroundsContainer,
  eventsContainer,
  getDaySlotProps,
  getWeekSelectionBand,
  getWeekPreviewBand,
  getSegmentProps,
  getShowMoreCellProps,
} = mv

const rootHandlers = $derived(mv.getRootProps())
const gridProps = $derived(mv.getMonthGridProps())
</script>

{#if grid.current !== null}
  <div
    bind:this={rootEl}
    class={rootHandlers.class}
    onkeydown={rootHandlers.onKeydown}
    use:captureListeners={{ keydown: rootHandlers.onKeydownCapture, focus: rootHandlers.onFocusCapture }}
  >
    <div {...announcer}>{mv.announcement()}</div>

    <div {...monthHeader}>
      {#each grid.current.weekdays as weekday (weekday.day)}
        <svelte:component this={Weekday} day={weekday.day} long={weekday.long} short={weekday.short} />
      {/each}
    </div>

    <div
      bind:this={gridEl}
      class={gridProps.class}
      style={gridProps.style}
      onpointerdown={gridProps.onPointerdown}
      onkeydown={gridProps.onKeydown}
      use:captureListeners={{ focus: gridProps.onFocusCapture }}
    >
      {#each grid.current.weeks as week, weekIndex (week.key)}
        <div {...weekRow}>
          <div {...slotsContainer}>
            {#each week.days as cell, dayIndex (cell.day)}
              <div {...getDaySlotProps(cell, weekIndex, dayIndex)}></div>
            {/each}
          </div>

          <div {...backgroundsContainer}>
            {#each week.days as cell (cell.day)}
              <div class:bc-date-cell={true} class:bc-today={cell.isToday} class:bc-off-range={cell.isOffRange}>
                <svelte:component
                  this={DateCell}
                  day={cell.day}
                  label={cell.label}
                  isToday={cell.isToday}
                  isOffRange={cell.isOffRange}
                  onDrillDown={() => drilldown(cell.day)}
                />
              </div>
            {/each}
          </div>

          {#if getWeekSelectionBand(weekIndex) !== null}
            {@const band = getWeekSelectionBand(weekIndex)!}
            <div class={band.class} style={band.style}></div>
          {/if}

          {#if getWeekPreviewBand(week) !== null}
            {@const band = getWeekPreviewBand(week)!}
            <div class={band.class} style={band.style}></div>
          {/if}

          <div {...eventsContainer}>
            {#each week.segments as segment (segment.key)}
              {@const segProps = getSegmentProps(segment)}
              <EventButton
                class={segProps.class}
                style={segProps.style}
                event={segment.event}
                title={segment.title}
                resizeEdges={segProps.resizeEdges}
              >
                <svelte:component this={EventSlot} event={segment.event} title={segment.title} />
              </EventButton>
            {/each}

            {#each week.days as cell, dayIndex (`more-${cell.day}`)}
              {@const moreProps = getShowMoreCellProps(cell, dayIndex, week.moreRow)}
              {#if moreProps !== null}
                <div class={moreProps.class} style={moreProps.style}>
                  <svelte:component
                    this={ShowMore}
                    count={moreProps.count}
                    label={moreProps.label}
                    day={moreProps.day}
                    events={moreProps.events}
                    eventSlot={EventSlot}
                  />
                </div>
              {/if}
            {/each}
          </div>
        </div>
      {/each}
    </div>
  </div>
{/if}
