<script setup lang="ts" generic="TEvent = unknown">
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

<template>
  <div v-if="rows !== null" v-bind="root">
    <div v-bind="header">
      <span v-bind="headingCell">{{ messages.date }}</span>
      <span v-bind="headingCell">{{ messages.time }}</span>
      <span v-bind="headingCell">{{ messages.event }}</span>
    </div>
    <component
      :is="EmptySlot"
      v-if="rows.length === 0"
      :message="messages.noEventsInRange"
    />
    <div v-else v-bind="body">
      <div
        v-for="row in rows"
        :key="row.day"
        v-bind="getRowProps(row)"
      >
        <component :is="DateSlot" :day="row.day" :label="row.label" />
        <component
          v-for="item in row.events"
          :is="EventSlot"
          :key="item.key"
          :event="item.event"
          :title="item.title"
          :time="item.time"
          :all-day="item.allDay"
        />
      </div>
    </div>
  </div>
</template>
