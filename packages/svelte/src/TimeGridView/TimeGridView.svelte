<script lang="ts" generics="TEvent = unknown">
import EventButton from '../EventButton/EventButton.svelte'
import { captureListeners } from '../internal/captureAction'
import { useTimeGridView } from '../useTimeGridView'

let rootEl: HTMLElement | null = $state(null)
let allDayRowEl: HTMLElement | null = $state(null)
let bodyEl: HTMLElement | null = $state(null)

const tgv = useTimeGridView<TEvent>(() => rootEl, () => allDayRowEl, () => bodyEl)
const { grid, announcer, getRootHandlers, getRootStyle, header: hdr, body: bdy } = tgv

const numResources = $derived(grid.current?.dayGroups?.[0]?.cells.length ?? 0)
const daysPerGroup = $derived(grid.current?.headings.length ?? 0)
</script>

{#if grid.current !== null}

  {#if grid.current.dayGroups !== null}
    <!-- Day-major resource grid -->
    {@const g = grid.current}
    {@const rootH = getRootHandlers()}
    {@const bodyProps = bdy.resourceBody()}
    {@const bodyNow = bdy.getBodyNowIndicatorProps()}
    <div
      bind:this={rootEl}
      class={tgv.getRootClass()}
      style={getRootStyle(g.dayGroups!.length * numResources)}
      onkeydown={rootH.onKeydown}
      use:captureListeners={{ keydown: rootH.onKeydownCapture, focus: rootH.onFocusCapture }}
    >
      <div {...announcer}>{tgv.getAnnouncement()}</div>

      <div {...hdr.timeHead}>
        <div {...hdr.timeHeader()}>
          <div {...hdr.timeHeaderGutter()}></div>
          {#each g.dayGroups! as dayGroup, di (dayGroup.key)}
            <div
              class="bc-header bc-day-major-header"
              role="columnheader"
              style="grid-column: {2 + di * numResources} / span {numResources}; grid-row: 1"
            >
              <svelte:component this={hdr.components.DayHeading} {...hdr.getHeadingProps({ day: dayGroup.date, label: dayGroup.label, isToday: dayGroup.isToday })} />
            </div>
            {#each dayGroup.cells as cell, ri (cell.key)}
              <div class="bc-resource-day-head" style="grid-column: {2 + di * numResources + ri}; grid-row: 2">
                <span {...hdr.resourceHeaderLabel}>{cell.resourceTitle}</span>
              </div>
            {/each}
          {/each}
        </div>

        <div class={hdr.resourceAllDayRowClass} onpointerdown={hdr.onAllDayPointerdown}>
          <div {...hdr.allDayLabel}>{hdr.messages.allDay}</div>
          {#each g.dayGroups! as dayGroup, di (dayGroup.key)}
            {#each dayGroup.cells as cell (cell.key)}
              <div
                class="bc-allday-resource{dayGroup.isToday ? ' bc-today' : ''}"
                data-bc-resource={String(cell.resourceId)}
                data-bc-resource-type={cell.resourceType ?? undefined}
              >
                <div {...hdr.getResourceAllDaySlotProps(dayGroup.date, di)}></div>
                <div class="bc-allday-resource-stack">
                  {#each cell.allDay.segments as segment (segment.key)}
                    <EventButton {...hdr.getStackedSegmentProps(segment)}>
                      <svelte:component this={hdr.components.AllDayEvent} event={segment.event} title={segment.title} />
                    </EventButton>
                  {/each}
                  {#if cell.allDay.extra !== null}
                    {#each cell.allDay.extra as item (`extra-${item.col}`)}
                      <svelte:component this={hdr.components.ShowMore} count={item.count} label={hdr.messages.showMore(item.count)} events={item.events} eventSlot={hdr.components.AllDayEvent} />
                    {/each}
                  {/if}
                </div>
              </div>
            {/each}
          {/each}
        </div>
      </div>

      <div {...bodyProps}>
        <div {...bdy.gutter}>
          {#each g.gutter as label (label.key)}
            <svelte:component this={bdy.components.TimeLabel} time={label.time} label={label.label} />
          {/each}
        </div>
        {#each g.dayGroups! as dayGroup (dayGroup.key)}
          {#each dayGroup.cells as cell (cell.column.key)}
            {@const resSel = bdy.getResourceSelectionDivProps(cell.resourceId, dayGroup.date)}
            <div {...bdy.getColumnProps(cell.column)} data-bc-resource={String(cell.resourceId)} data-bc-resource-type={cell.resourceType ?? undefined}>
              <div {...bdy.timeSlotsContainer}>
                {#each { length: g.slotCount } as _, slotIndex}
                  <div {...bdy.getResourceSlotProps(dayGroup.date, slotIndex, cell.column.slots[slotIndex] ?? '')}></div>
                {/each}
              </div>
              {#each cell.column.backgroundEvents as bg (bg.key)}
                <div {...bdy.getBgEventProps(bg)}>
                  <svelte:component this={bdy.components.BgEventSlot} event={bg.event} title={bg.title} />
                </div>
              {/each}
              {#each cell.column.events as event (event.key)}
                <EventButton {...bdy.getEventProps(event)}>
                  <svelte:component this={bdy.components.EventSlot} event={event.event} title={event.title} time={event.time} />
                </EventButton>
              {/each}
              {#if resSel !== null}<div {...resSel}></div>{/if}
            </div>
          {/each}
        {/each}
        {#if bodyNow !== null}<div {...bodyNow}></div>{/if}
      </div>
    </div>

  {:else if grid.current.resources !== null}
    <!-- Resource-major grid -->
    {@const g = grid.current}
    {@const rootH = getRootHandlers()}
    {@const bodyProps = bdy.resourceBody()}
    {@const bodyNow = bdy.getBodyNowIndicatorProps()}
    <div
      bind:this={rootEl}
      class={tgv.getRootClass()}
      style={getRootStyle(g.resources!.reduce((n, r) => n + r.columns.length, 0))}
      onkeydown={rootH.onKeydown}
      use:captureListeners={{ keydown: rootH.onKeydownCapture, focus: rootH.onFocusCapture }}
    >
      <div {...announcer}>{tgv.getAnnouncement()}</div>

      <div {...hdr.timeHead}>
        <div {...hdr.timeHeader()}>
          <div {...hdr.timeHeaderGutter()}></div>
          {#if g.headings.length > 1}
            {#each g.resources! as group, gi (group.key)}
              <div class="bc-header bc-resource-header" role="columnheader" style="grid-column: {2 + gi * daysPerGroup} / span {daysPerGroup}; grid-row: 1">{group.resourceTitle}</div>
              {#each group.columns as column, di (`${column.key}-head`)}
                <div class="bc-resource-day-head" style="grid-column: {2 + gi * daysPerGroup + di}; grid-row: 2">
                  <svelte:component this={hdr.components.DayHeading} day={column.day} label={g.headings[di]?.label ?? ''} isToday={column.isToday} onDrillDown={() => hdr.drilldown(column.day)} />
                </div>
              {/each}
            {/each}
          {:else}
            {#each g.resources! as group (group.key)}
              <div class="bc-resource-single-head">{group.resourceTitle}</div>
            {/each}
          {/if}
        </div>

        <div class={hdr.resourceAllDayRowClass} onpointerdown={hdr.onAllDayPointerdown}>
          <div {...hdr.allDayLabel}>{hdr.messages.allDay}</div>
          {#if g.headings.length > 1}
            {#each g.resources! as group, gi (group.key)}
              <div
                class="bc-allday-resource bc-allday-resource-week"
                data-bc-resource={String(group.resourceId)}
                data-bc-resource-type={group.resourceType ?? undefined}
                style="grid-area: 1 / {2 + gi * daysPerGroup} / auto / span {daysPerGroup}"
              >
                <div class="bc-allday-resource-slots" style="grid-template-columns: repeat({daysPerGroup}, minmax(0, 1fr))">
                  {#each group.columns as column, di (column.key)}
                    <div {...hdr.getResourceAllDaySlotProps(column.day, di, column.isToday)}></div>
                  {/each}
                </div>
                <div class="bc-allday-resource-segments" data-bc-allday-segments="" style="grid-template-columns: repeat({daysPerGroup}, minmax(0, 1fr))">
                  {#each group.allDay.segments as segment (segment.key)}
                    <EventButton {...hdr.getAllDaySegmentProps(segment)}>
                      <svelte:component this={hdr.components.AllDayEvent} event={segment.event} title={segment.title} />
                    </EventButton>
                  {/each}
                  {#if group.allDay.extra !== null}
                    {#each group.allDay.extra as item (`extra-${item.col}`)}
                      <svelte:component this={hdr.components.ShowMore} count={item.count} label={hdr.messages.showMore(item.count)} events={item.events} eventSlot={hdr.components.AllDayEvent} />
                    {/each}
                  {/if}
                </div>
              </div>
            {/each}
          {:else}
            {#each g.resources! as group (group.key)}
              <div
                class="bc-allday-resource{group.columns[0]?.isToday ? ' bc-today' : ''}"
                data-bc-resource={String(group.resourceId)}
                data-bc-resource-type={group.resourceType ?? undefined}
              >
                <div {...hdr.getResourceAllDaySlotProps(group.columns[0]?.day ?? '', 0)}></div>
                <div class="bc-allday-resource-stack">
                  {#each group.allDay.segments as segment (segment.key)}
                    <EventButton {...hdr.getStackedSegmentProps(segment)}>
                      <svelte:component this={hdr.components.AllDayEvent} event={segment.event} title={segment.title} />
                    </EventButton>
                  {/each}
                  {#if group.allDay.extra !== null}
                    {#each group.allDay.extra as item (`extra-${item.col}`)}
                      <svelte:component this={hdr.components.ShowMore} count={item.count} label={hdr.messages.showMore(item.count)} events={item.events} eventSlot={hdr.components.AllDayEvent} />
                    {/each}
                  {/if}
                </div>
              </div>
            {/each}
          {/if}
        </div>
      </div>

      <div {...bodyProps}>
        <div {...bdy.gutter}>
          {#each g.gutter as label (label.key)}
            <svelte:component this={bdy.components.TimeLabel} time={label.time} label={label.label} />
          {/each}
        </div>
        {#each g.resources! as group (group.key)}
          {#each group.columns as column (column.key)}
            {@const resSel = bdy.getResourceSelectionDivProps(group.resourceId, column.day)}
            <div {...bdy.getColumnProps(column)} data-bc-resource={String(group.resourceId)} data-bc-resource-type={group.resourceType ?? undefined}>
              <div {...bdy.timeSlotsContainer}>
                {#each { length: g.slotCount } as _, slotIndex}
                  <div {...bdy.getResourceSlotProps(column.day, slotIndex, column.slots[slotIndex] ?? '')}></div>
                {/each}
              </div>
              {#each column.backgroundEvents as bg (bg.key)}
                <div {...bdy.getBgEventProps(bg)}>
                  <svelte:component this={bdy.components.BgEventSlot} event={bg.event} title={bg.title} />
                </div>
              {/each}
              {#each column.events as event (event.key)}
                <EventButton {...bdy.getEventProps(event)}>
                  <svelte:component this={bdy.components.EventSlot} event={event.event} title={event.title} time={event.time} />
                </EventButton>
              {/each}
              {#if resSel !== null}<div {...resSel}></div>{/if}
            </div>
          {/each}
        {/each}
        {#if bodyNow !== null}<div {...bodyNow}></div>{/if}
      </div>
    </div>

  {:else}
    <!-- Plain time grid -->
    {@const g = grid.current}
    {@const rootH = getRootHandlers()}
    {@const selBand = hdr.getAllDaySelectionBand()}
    {@const bodyProps = bdy.getBody()}
    {@const bodyNow = bdy.getBodyNowIndicatorProps()}
    <div
      bind:this={rootEl}
      class={tgv.getRootClass()}
      style={getRootStyle(g.headings.length)}
      onkeydown={rootH.onKeydown}
      use:captureListeners={{ keydown: rootH.onKeydownCapture, focus: rootH.onFocusCapture }}
    >
      <div {...announcer}>{tgv.getAnnouncement()}</div>

      <div {...hdr.timeHead}>
        <div {...hdr.timeHeader()}>
          <div {...hdr.timeHeaderGutter()}></div>
          {#each g.headings as heading (heading.day)}
            <svelte:component this={hdr.components.DayHeading} {...hdr.getHeadingProps(heading)} />
          {/each}
        </div>

        <div
          bind:this={allDayRowEl}
          class={hdr.allDayRowClass}
          onpointerdown={hdr.onAllDayPointerdown}
          onkeydown={hdr.onAllDayKeydown}
          use:captureListeners={{ focus: hdr.onAllDayFocusCapture }}
        >
          <div {...hdr.allDayLabel}>{hdr.messages.allDay}</div>
          <div {...hdr.allDaySlots}>
            {#each g.columns as column, colIndex (column.key)}
              <div {...hdr.getAllDaySlotProps(column, colIndex)}></div>
            {/each}
          </div>
          {#if selBand !== null}
            <div class="bc-allday-selection">
              <div class={selBand.class} style={selBand.style}></div>
            </div>
          {/if}
          <div {...hdr.allDaySegments}>
            {#each g.allDay.segments as segment (segment.key)}
              <EventButton {...hdr.getAllDaySegmentProps(segment)}>
                <svelte:component this={hdr.components.AllDayEvent} event={segment.event} title={segment.title} />
              </EventButton>
            {/each}
            {#if g.allDay.extra !== null}
              {#each g.allDay.extra as item (`extra-${item.col}`)}
                <div style="grid-column: {item.col}; position: relative; pointer-events: none">
                  <svelte:component this={hdr.components.ShowMore} count={item.count} label={hdr.messages.showMore(item.count)} events={item.events} eventSlot={hdr.components.AllDayEvent} />
                </div>
              {/each}
            {/if}
          </div>
        </div>
      </div>

      <div
        bind:this={bodyEl}
        class={bodyProps.class}
        style={bodyProps.style}
        onpointerdown={bodyProps.onPointerdown}
        onkeydown={bodyProps.onKeydown}
        use:captureListeners={{ focus: bodyProps.onFocusCapture }}
      >
        <div {...bdy.gutter}>
          {#each g.gutter as label (label.key)}
            <svelte:component this={bdy.components.TimeLabel} time={label.time} label={label.label} />
          {/each}
        </div>
        {#each g.columns as column, colIndex (column.key)}
          {@const timeSel = bdy.getTimeSelectionDivProps(colIndex)}
          <div {...bdy.getColumnProps(column)}>
            <div {...bdy.timeSlotsContainer}>
              {#each { length: g.slotCount } as _, slotIndex}
                <div {...bdy.getSlotProps(column, colIndex, slotIndex)}></div>
              {/each}
            </div>
            {#each column.backgroundEvents as bg (bg.key)}
              <div {...bdy.getBgEventProps(bg)}>
                <svelte:component this={bdy.components.BgEventSlot} event={bg.event} title={bg.title} />
              </div>
            {/each}
            {#each column.events as event (event.key)}
              <EventButton {...bdy.getEventProps(event)}>
                <svelte:component this={bdy.components.EventSlot} event={event.event} title={event.title} time={event.time} />
              </EventButton>
            {/each}
            {#if timeSel !== null}<div {...timeSel}></div>{/if}
          </div>
        {/each}
        {#if bodyNow !== null}<div {...bodyNow}></div>{/if}
      </div>
    </div>
  {/if}

{/if}
