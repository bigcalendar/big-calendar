<script setup lang="ts" generic="TEvent = unknown">
import EventButton from '../EventButton/EventButton.vue'
import { useTimeGridView } from '../useTimeGridView'

const {
  grid,
  announcement,
  announcer,
  root,
  getRootStyle,
  header,
  body,
} = useTimeGridView<TEvent>()

const hdr = header
const bdy = body
</script>

<template>
  <template v-if="grid !== null">

    <!-- ── day-major resource grid ───────────────────────────────────── -->
    <template v-if="grid.dayGroups !== null">
      <div
        :ref="root.ref"
        :class="root.class"
        :style="getRootStyle(grid.dayGroups.length * (grid.dayGroups[0]?.cells.length ?? 0))"
        @keydown="root.onKeydown"
        @keydown.capture="root.onKeydownCapture"
        @focus.capture="root.onFocusCapture"
      >
        <div v-bind="announcer">{{ announcement }}</div>

        <div v-bind="hdr.timeHead">
          <div v-bind="hdr.timeHeader">
            <div v-bind="hdr.timeHeaderGutter" />
            <template v-for="dayGroup in grid.dayGroups" :key="dayGroup.key">
              <div v-bind="{ class: 'bc-header bc-day-major-header', role: 'columnheader' }">
                <component
                  :is="hdr.components.DayHeading"
                  v-bind="hdr.getHeadingProps({ day: dayGroup.date, label: dayGroup.label, isToday: dayGroup.isToday })"
                />
              </div>
              <div
                v-for="cell in dayGroup.cells"
                :key="cell.key"
                class="bc-resource-day-head"
              >
                <span v-bind="hdr.resourceHeaderLabel">{{ cell.resourceTitle }}</span>
              </div>
            </template>
          </div>

          <div v-bind="hdr.resourceAllDayRow">
            <div v-bind="hdr.allDayLabel">{{ hdr.messages.allDay }}</div>
            <template v-for="(dayGroup, di) in grid.dayGroups" :key="dayGroup.key">
              <template v-for="cell in dayGroup.cells" :key="cell.key">
                <div
                  class="bc-allday-resource"
                  :class="dayGroup.isToday ? 'bc-today' : undefined"
                  :data-bc-resource="String(cell.resourceId)"
                >
                  <div v-bind="hdr.getResourceAllDaySlotProps(dayGroup.date, di)" />
                  <div class="bc-allday-resource-stack">
                    <EventButton
                      v-for="segment in cell.allDay.segments"
                      :key="segment.key"
                      v-bind="hdr.getStackedSegmentProps(segment)"
                    >
                      <component :is="hdr.components.AllDayEvent" :event="segment.event" :title="segment.title" />
                    </EventButton>
                    <template v-if="cell.allDay.extra !== null">
                      <component
                        v-for="item in cell.allDay.extra"
                        :is="hdr.components.ShowMore"
                        :key="`extra-${item.col}`"
                        :count="item.count"
                        :label="hdr.messages.showMore(item.count)"
                        :events="item.events"
                        :event-slot="hdr.components.AllDayEvent"
                      />
                    </template>
                  </div>
                </div>
              </template>
            </template>
          </div>
        </div>

        <div v-bind="bdy.resourceBody">
          <div v-bind="bdy.gutter">
            <component
              v-for="label in grid.gutter"
              :is="bdy.components.TimeLabel"
              :key="label.key"
              :time="label.time"
              :label="label.label"
            />
          </div>
          <template v-for="dayGroup in grid.dayGroups" :key="dayGroup.key">
            <template v-for="cell in dayGroup.cells" :key="cell.column.key">
              <div
                v-bind="bdy.getColumnProps(cell.column)"
                :data-bc-resource="String(cell.resourceId)"
              >
                <div v-bind="bdy.timeSlotsContainer">
                  <div
                    v-for="(_, slotIndex) in Array.from({ length: grid.slotCount })"
                    :key="slotIndex"
                    v-bind="bdy.getResourceSlotProps(dayGroup.date, slotIndex, cell.column.slots[slotIndex] ?? '')"
                  />
                </div>
                <div
                  v-for="bg in cell.column.backgroundEvents"
                  :key="bg.key"
                  v-bind="bdy.getBgEventProps(bg)"
                >
                  <component :is="bdy.components.BgEventSlot" :event="bg.event" :title="bg.title" />
                </div>
                <EventButton
                  v-for="event in cell.column.events"
                  :key="event.key"
                  v-bind="bdy.getEventProps(event)"
                >
                  <component :is="bdy.components.EventSlot" :event="event.event" :title="event.title" :time="event.time" />
                </EventButton>
                <div
                  v-if="bdy.getResourceSelectionDivProps(cell.resourceId, dayGroup.date) !== null"
                  v-bind="bdy.getResourceSelectionDivProps(cell.resourceId, dayGroup.date)!"
                />
                <div
                  v-if="bdy.getPreviewDivProps(cell.column) !== null"
                  v-bind="bdy.getPreviewDivProps(cell.column)!"
                />
              </div>
            </template>
          </template>
          <div v-if="bdy.bodyNowIndicatorProps !== null" v-bind="bdy.bodyNowIndicatorProps" />
        </div>
      </div>
    </template>

    <!-- ── resource-major grid ────────────────────────────────────────── -->
    <template v-else-if="grid.resources !== null">
      <div
        :ref="root.ref"
        :class="root.class"
        :style="getRootStyle(grid.resources.reduce((n, g) => n + g.columns.length, 0))"
        @keydown="root.onKeydown"
        @keydown.capture="root.onKeydownCapture"
        @focus.capture="root.onFocusCapture"
      >
        <div v-bind="announcer">{{ announcement }}</div>

        <div v-bind="hdr.timeHead">
          <div v-bind="hdr.timeHeader">
            <div v-bind="hdr.timeHeaderGutter" />
            <!-- resource-week: tiered headers -->
            <template v-if="grid.headings.length > 1">
              <template v-for="group in grid.resources" :key="`${group.key}-title`">
                <div class="bc-header bc-resource-header" role="columnheader">
                  {{ group.resourceTitle }}
                </div>
                <div
                  v-for="(column, di) in group.columns"
                  :key="`${column.key}-head`"
                  class="bc-resource-day-head"
                >
                  <component
                    :is="hdr.components.DayHeading"
                    :day="column.day"
                    :label="grid.headings[di]?.label ?? ''"
                    :is-today="column.isToday"
                    :on-drill-down="() => hdr.drilldown(column.day)"
                  />
                </div>
              </template>
            </template>
            <!-- resource-day: single heading per resource -->
            <template v-else>
              <div
                v-for="group in grid.resources"
                :key="group.key"
                class="bc-resource-single-head"
              >
                {{ group.resourceTitle }}
              </div>
            </template>
          </div>

          <div v-bind="hdr.resourceAllDayRow">
            <div v-bind="hdr.allDayLabel">{{ hdr.messages.allDay }}</div>
            <template v-if="grid.headings.length > 1">
              <!-- resource-week allday -->
              <div
                v-for="group in grid.resources"
                :key="group.key"
                class="bc-allday-resource bc-allday-resource-week"
                :data-bc-resource="String(group.resourceId)"
              >
                <div class="bc-allday-resource-slots">
                  <div
                    v-for="(column, di) in group.columns"
                    :key="column.key"
                    v-bind="hdr.getResourceAllDaySlotProps(column.day, di, column.isToday)"
                  />
                </div>
                <div class="bc-allday-resource-segments" data-bc-allday-segments="">
                  <EventButton
                    v-for="segment in group.allDay.segments"
                    :key="segment.key"
                    v-bind="hdr.getAllDaySegmentProps(segment)"
                  >
                    <component :is="hdr.components.AllDayEvent" :event="segment.event" :title="segment.title" />
                  </EventButton>
                  <template v-if="group.allDay.extra !== null">
                    <component
                      v-for="item in group.allDay.extra"
                      :is="hdr.components.ShowMore"
                      :key="`extra-${item.col}`"
                      :count="item.count"
                      :label="hdr.messages.showMore(item.count)"
                      :events="item.events"
                      :event-slot="hdr.components.AllDayEvent"
                    />
                  </template>
                </div>
              </div>
            </template>
            <template v-else>
              <!-- resource-day allday -->
              <div
                v-for="group in grid.resources"
                :key="group.key"
                class="bc-allday-resource"
                :class="group.columns[0]?.isToday ? 'bc-today' : undefined"
                :data-bc-resource="String(group.resourceId)"
              >
                <div v-bind="hdr.getResourceAllDaySlotProps(group.columns[0]?.day ?? '', 0)" />
                <div class="bc-allday-resource-stack">
                  <EventButton
                    v-for="segment in group.allDay.segments"
                    :key="segment.key"
                    v-bind="hdr.getStackedSegmentProps(segment)"
                  >
                    <component :is="hdr.components.AllDayEvent" :event="segment.event" :title="segment.title" />
                  </EventButton>
                  <template v-if="group.allDay.extra !== null">
                    <component
                      v-for="item in group.allDay.extra"
                      :is="hdr.components.ShowMore"
                      :key="`extra-${item.col}`"
                      :count="item.count"
                      :label="hdr.messages.showMore(item.count)"
                      :events="item.events"
                      :event-slot="hdr.components.AllDayEvent"
                    />
                  </template>
                </div>
              </div>
            </template>
          </div>
        </div>

        <div v-bind="bdy.resourceBody">
          <div v-bind="bdy.gutter">
            <component
              v-for="label in grid.gutter"
              :is="bdy.components.TimeLabel"
              :key="label.key"
              :time="label.time"
              :label="label.label"
            />
          </div>
          <template v-for="group in grid.resources" :key="group.key">
            <div
              v-for="column in group.columns"
              :key="column.key"
              v-bind="bdy.getColumnProps(column)"
              :data-bc-resource="String(group.resourceId)"
            >
              <div v-bind="bdy.timeSlotsContainer">
                <div
                  v-for="(_, slotIndex) in Array.from({ length: grid.slotCount })"
                  :key="slotIndex"
                  v-bind="bdy.getResourceSlotProps(column.day, slotIndex, column.slots[slotIndex] ?? '')"
                />
              </div>
              <div
                v-for="bg in column.backgroundEvents"
                :key="bg.key"
                v-bind="bdy.getBgEventProps(bg)"
              >
                <component :is="bdy.components.BgEventSlot" :event="bg.event" :title="bg.title" />
              </div>
              <EventButton
                v-for="event in column.events"
                :key="event.key"
                v-bind="bdy.getEventProps(event)"
              >
                <component :is="bdy.components.EventSlot" :event="event.event" :title="event.title" :time="event.time" />
              </EventButton>
              <div
                v-if="bdy.getResourceSelectionDivProps(group.resourceId, column.day) !== null"
                v-bind="bdy.getResourceSelectionDivProps(group.resourceId, column.day)!"
              />
            </div>
          </template>
          <div v-if="bdy.bodyNowIndicatorProps !== null" v-bind="bdy.bodyNowIndicatorProps" />
        </div>
      </div>
    </template>

    <!-- ── plain grid ─────────────────────────────────────────────────── -->
    <template v-else>
      <div
        :ref="root.ref"
        :class="root.class"
        :style="getRootStyle(grid.headings.length)"
        @keydown="root.onKeydown"
        @keydown.capture="root.onKeydownCapture"
        @focus.capture="root.onFocusCapture"
      >
        <div v-bind="announcer">{{ announcement }}</div>

        <div v-bind="hdr.timeHead">
          <div v-bind="hdr.timeHeader">
            <div v-bind="hdr.timeHeaderGutter" />
            <component
              v-for="heading in grid.headings"
              :is="hdr.components.DayHeading"
              :key="heading.day"
              v-bind="hdr.getHeadingProps(heading)"
            />
          </div>

          <div
            :ref="hdr.allDayRow.ref"
            :class="hdr.allDayRow.class"
            @pointerdown="hdr.allDayRow.onPointerdown"
            @keydown="hdr.allDayRow.onKeydown"
            @focus.capture="hdr.allDayRow.onFocusCapture"
          >
            <div v-bind="hdr.allDayLabel">{{ hdr.messages.allDay }}</div>
            <div v-bind="hdr.allDaySlots">
              <div
                v-for="(column, colIndex) in grid.columns"
                :key="column.key"
                v-bind="hdr.getAllDaySlotProps(column, colIndex)"
              />
            </div>
            <div v-if="hdr.allDaySelectionBand !== null" class="bc-allday-selection">
              <div v-bind="hdr.allDaySelectionBand!" />
            </div>
            <div v-bind="hdr.allDaySegments">
              <EventButton
                v-for="segment in grid.allDay.segments"
                :key="segment.key"
                v-bind="hdr.getAllDaySegmentProps(segment)"
              >
                <component :is="hdr.components.AllDayEvent" :event="segment.event" :title="segment.title" />
              </EventButton>
              <template v-if="grid.allDay.extra !== null">
                <div
                  v-for="item in grid.allDay.extra"
                  :key="`extra-${item.col}`"
                  :style="{ gridColumn: item.col, position: 'relative', pointerEvents: 'none' }"
                >
                  <component
                    :is="hdr.components.ShowMore"
                    :count="item.count"
                    :label="hdr.messages.showMore(item.count)"
                    :events="item.events"
                    :event-slot="hdr.components.AllDayEvent"
                  />
                </div>
              </template>
            </div>
          </div>
        </div>

        <div
          :ref="bdy.body.ref"
          :class="bdy.body.class"
          :style="bdy.body.style"
          @pointerdown="bdy.body.onPointerdown"
          @keydown="bdy.body.onKeydown"
          @focus.capture="bdy.body.onFocusCapture"
        >
          <div v-bind="bdy.gutter">
            <component
              v-for="label in grid.gutter"
              :is="bdy.components.TimeLabel"
              :key="label.key"
              :time="label.time"
              :label="label.label"
            />
          </div>
          <div
            v-for="(column, colIndex) in grid.columns"
            :key="column.key"
            v-bind="bdy.getColumnProps(column)"
          >
            <div v-bind="bdy.timeSlotsContainer">
              <div
                v-for="(_, slotIndex) in Array.from({ length: grid.slotCount })"
                :key="slotIndex"
                v-bind="bdy.getSlotProps(column, colIndex, slotIndex)"
              />
            </div>
            <div
              v-for="bg in column.backgroundEvents"
              :key="bg.key"
              v-bind="bdy.getBgEventProps(bg)"
            >
              <component :is="bdy.components.BgEventSlot" :event="bg.event" :title="bg.title" />
            </div>
            <EventButton
              v-for="event in column.events"
              :key="event.key"
              v-bind="bdy.getEventProps(event)"
            >
              <component :is="bdy.components.EventSlot" :event="event.event" :title="event.title" :time="event.time" />
            </EventButton>
            <div
              v-if="bdy.getTimeSelectionDivProps(colIndex) !== null"
              v-bind="bdy.getTimeSelectionDivProps(colIndex)!"
            />
            <div
              v-if="bdy.getPreviewDivProps(column) !== null"
              v-bind="bdy.getPreviewDivProps(column)!"
            />
            <div
              v-if="bdy.getNowIndicatorProps(column) !== null"
              v-bind="bdy.getNowIndicatorProps(column)!"
            />
          </div>
          <div v-if="bdy.bodyNowIndicatorProps !== null" v-bind="bdy.bodyNowIndicatorProps" />
        </div>
      </div>
    </template>

  </template>
</template>
