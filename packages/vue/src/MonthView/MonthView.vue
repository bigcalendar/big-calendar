<script setup lang="ts" generic="TEvent = unknown">
import EventButton from '../EventButton/EventButton.vue'
import { useMonthView } from '../useMonthView'

const {
  grid,
  components: { Weekday, DateCell, EventSlot, ShowMore },
  announcement,
  announcer,
  drilldown,
  root,
  monthHeader,
  monthGrid,
  weekRow,
  slotsContainer,
  backgroundsContainer,
  eventsContainer,
  getDaySlotProps,
  getWeekSelectionBand,
  getWeekPreviewBand,
  getSegmentProps,
  getShowMoreCellProps,
} = useMonthView<TEvent>()
</script>

<template>
  <div
    v-if="grid !== null"
    :ref="root.ref"
    :class="root.class"
    @keydown="root.onKeydown"
    @keydown.capture="root.onKeydownCapture"
    @focus.capture="root.onFocusCapture"
  >
    <div v-bind="announcer">{{ announcement }}</div>

    <div v-bind="monthHeader">
      <component
        v-for="weekday in grid.weekdays"
        :is="Weekday"
        :key="weekday.day"
        :day="weekday.day"
        :long="weekday.long"
        :short="weekday.short"
      />
    </div>

    <div
      :ref="monthGrid.ref"
      :class="monthGrid.class"
      :style="monthGrid.style"
      @pointerdown="monthGrid.onPointerdown"
      @keydown="monthGrid.onKeydown"
      @focus.capture="monthGrid.onFocusCapture"
    >
      <div
        v-for="(week, weekIndex) in grid.weeks"
        :key="week.key"
        v-bind="weekRow"
      >
        <!-- Hit-targets for slot selection -->
        <div v-bind="slotsContainer">
          <div
            v-for="(cell, dayIndex) in week.days"
            :key="cell.day"
            v-bind="getDaySlotProps(cell, weekIndex, dayIndex)"
          />
        </div>

        <!-- Date cell backgrounds -->
        <div v-bind="backgroundsContainer">
          <div
            v-for="cell in week.days"
            :key="cell.day"
            :class="['bc-date-cell', cell.isToday && 'bc-today', cell.isOffRange && 'bc-off-range']"
          >
            <component
              :is="DateCell"
              :day="cell.day"
              :label="cell.label"
              :is-today="cell.isToday"
              :is-off-range="cell.isOffRange"
              :on-drill-down="() => drilldown(cell.day)"
            />
          </div>
        </div>

        <!-- Selection band (stub until 10-8) -->
        <div
          v-if="getWeekSelectionBand(weekIndex) !== null"
          :class="getWeekSelectionBand(weekIndex)!.class"
          :style="getWeekSelectionBand(weekIndex)!.style"
        />
        <!-- Drag-preview band -->
        <div
          v-if="getWeekPreviewBand(week) !== null"
          :class="getWeekPreviewBand(week)!.class"
          :style="getWeekPreviewBand(week)!.style"
        />

        <!-- Event segments and overflow cells -->
        <div v-bind="eventsContainer">
          <EventButton
            v-for="segment in week.segments"
            :key="segment.key"
            :class="getSegmentProps(segment).class"
            :style="getSegmentProps(segment).style"
            :event="segment.event"
            :title="segment.title"
            :resize-edges="getSegmentProps(segment).resizeEdges"
          >
            <component :is="EventSlot" :event="segment.event" :title="segment.title" />
          </EventButton>

          <template v-for="(cell, dayIndex) in week.days" :key="`more-${cell.day}`">
            <template v-if="getShowMoreCellProps(cell, dayIndex, week.moreRow) !== null">
              <div
                :class="getShowMoreCellProps(cell, dayIndex, week.moreRow)!.class"
                :style="getShowMoreCellProps(cell, dayIndex, week.moreRow)!.style"
              >
                <component
                  :is="ShowMore"
                  :count="getShowMoreCellProps(cell, dayIndex, week.moreRow)!.count"
                  :label="getShowMoreCellProps(cell, dayIndex, week.moreRow)!.label"
                  :day="getShowMoreCellProps(cell, dayIndex, week.moreRow)!.day"
                  :events="getShowMoreCellProps(cell, dayIndex, week.moreRow)!.events"
                  :event-slot="EventSlot"
                />
              </div>
            </template>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>
