/**
 * Demonstrates the `resourceType` accessor: assign a type string to each
 * resource object, configure `[accessors]="{ resourceType: 'resourceType' }"`
 * (the default field name), then target the rendered `data-bc-resource-type`
 * attribute with CSS to colour each lane.
 *
 * The selector pattern is:
 *   `.bc-day-column[data-bc-resource-type="conference"] { background-color: …; }`
 *
 * Because `data-bc-resource-type` sits directly on the `.bc-day-column` element,
 * no `:has()` indirection is needed — you can target the column background
 * straight from the attribute selector.
 */
import { Views } from '@big-calendar/core'
import { Component } from '@angular/core'
import type { OnDestroy, OnInit } from '@angular/core'
import type { Meta, StoryObj } from '@storybook/angular'
import { CalendarProviderComponent } from '../src/CalendarProvider/CalendarProviderComponent'
import { CalendarComponent } from '../src/CalendarComponent/CalendarComponent'
import { demoEvents } from './demoEvents'
import { localizer, NOW, FOCUS } from './harness'

type RoomType = 'conference' | 'training' | 'meeting' | 'executive'

interface Room {
  id: string
  title: string
  resourceType: RoomType
}

const rooms: Room[] = [
  { id: 'board',    title: 'Board room',      resourceType: 'conference' },
  { id: 'training', title: 'Training room',   resourceType: 'training'   },
  { id: 'mtg1',     title: 'Meeting room 1',  resourceType: 'meeting'    },
  { id: 'mtg2',     title: 'Meeting room 2',  resourceType: 'meeting'    },
  { id: 'mtg3',     title: 'Meeting room 3',  resourceType: 'meeting'    },
  { id: 'exec',     title: 'Executive suite', resourceType: 'executive'  },
]

const TYPE_COLORS: Record<RoomType, string> = {
  conference: '#d4e8f5',
  training:   '#d4f5e8',
  meeting:    '#f5f0d4',
  executive:  '#ead4f5',
}

const ROOM_TYPES: RoomType[] = ['conference', 'training', 'meeting', 'executive']

const TYPE_STYLES_CSS = ROOM_TYPES.map(
  (type) => [
    `.bc-day-column[data-bc-resource-type="${type}"]:not(.bc-today) { background-color: ${TYPE_COLORS[type]}; }`,
    `.bc-allday-resource[data-bc-resource-type="${type}"]:not(.bc-today) { background-color: ${TYPE_COLORS[type]}; }`,
    `.bc-day-column[data-bc-resource-type="${type}"].bc-today,`,
    `.bc-allday-resource[data-bc-resource-type="${type}"].bc-today {`,
    `  --bc-color-today-bg: color-mix(in oklab, ${TYPE_COLORS[type]}, CanvasText 5%);`,
    `  background-color: var(--bc-color-today-bg);`,
    `}`,
  ].join('\n'),
).join('\n')

@Component({
  selector: 'story-resource-type-day',
  standalone: true,
  imports: [CalendarProviderComponent, CalendarComponent],
  template: `
    <div style="block-size: 100dvh; inline-size: 100%">
      <bc-calendar-provider
        [localizer]="loc"
        [events]="events"
        [defaultDate]="FOCUS"
        [getNow]="getNow"
        [defaultView]="Views.DAY"
        [views]="[Views.DAY]"
        [resources]="rooms"
      >
        <bc-calendar />
      </bc-calendar-provider>
    </div>
  `,
})
class ResourceTypeDayComponent implements OnInit, OnDestroy {
  readonly loc = localizer
  readonly events = demoEvents
  readonly FOCUS = FOCUS
  readonly getNow = () => NOW
  readonly rooms = rooms
  readonly Views = Views
  private styleEl!: HTMLStyleElement

  ngOnInit() {
    this.styleEl = document.createElement('style')
    this.styleEl.textContent = TYPE_STYLES_CSS
    document.head.appendChild(this.styleEl)
  }
  ngOnDestroy() { document.head.removeChild(this.styleEl) }
}

@Component({
  selector: 'story-resource-type-week',
  standalone: true,
  imports: [CalendarProviderComponent, CalendarComponent],
  template: `
    <div style="block-size: 100dvh; inline-size: 100%">
      <bc-calendar-provider
        [localizer]="loc"
        [events]="events"
        [defaultDate]="FOCUS"
        [getNow]="getNow"
        [defaultView]="Views.WEEK"
        [views]="[Views.WEEK]"
        [resources]="rooms"
      >
        <bc-calendar />
      </bc-calendar-provider>
    </div>
  `,
})
class ResourceTypeWeekComponent implements OnInit, OnDestroy {
  readonly loc = localizer
  readonly events = demoEvents
  readonly FOCUS = FOCUS
  readonly getNow = () => NOW
  readonly rooms = rooms
  readonly Views = Views
  private styleEl!: HTMLStyleElement

  ngOnInit() {
    this.styleEl = document.createElement('style')
    this.styleEl.textContent = TYPE_STYLES_CSS
    document.head.appendChild(this.styleEl)
  }
  ngOnDestroy() { document.head.removeChild(this.styleEl) }
}

@Component({
  selector: 'story-resource-type-daymajor',
  standalone: true,
  imports: [CalendarProviderComponent, CalendarComponent],
  template: `
    <div style="block-size: 100dvh; inline-size: 100%">
      <bc-calendar-provider
        [localizer]="loc"
        [events]="events"
        [defaultDate]="FOCUS"
        [getNow]="getNow"
        [defaultView]="Views.WEEK"
        [views]="[Views.WEEK]"
        [resources]="rooms"
        resourceLayout="day"
      >
        <bc-calendar />
      </bc-calendar-provider>
    </div>
  `,
})
class ResourceTypeDayMajorComponent implements OnInit, OnDestroy {
  readonly loc = localizer
  readonly events = demoEvents
  readonly FOCUS = FOCUS
  readonly getNow = () => NOW
  readonly rooms = rooms
  readonly Views = Views
  private styleEl!: HTMLStyleElement

  ngOnInit() {
    this.styleEl = document.createElement('style')
    this.styleEl.textContent = TYPE_STYLES_CSS
    document.head.appendChild(this.styleEl)
  }
  ngOnDestroy() { document.head.removeChild(this.styleEl) }
}

const meta: Meta = { title: 'Resources/Resource Type Accessor' }
export default meta

export const DayView = {
  name: 'Day View — Resource Lane Colours',
  render: () => ({
    template: '<story-resource-type-day></story-resource-type-day>',
    moduleMetadata: { imports: [ResourceTypeDayComponent] },
  }),
}

export const WeekView = {
  name: 'Week View — Resource Lane Colours',
  render: () => ({
    template: '<story-resource-type-week></story-resource-type-week>',
    moduleMetadata: { imports: [ResourceTypeWeekComponent] },
  }),
}

export const DayMajorView = {
  name: 'Day-Major Week — Resource Lane Colours',
  render: () => ({
    template: '<story-resource-type-daymajor></story-resource-type-daymajor>',
    moduleMetadata: { imports: [ResourceTypeDayMajorComponent] },
  }),
}
