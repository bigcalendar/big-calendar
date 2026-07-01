import { Views } from '@big-calendar/core'
import type { ViewKey } from '@big-calendar/core'
import { Component, signal } from '@angular/core'
import type { Meta, StoryObj } from '@storybook/angular'
import { CalendarProviderComponent } from '../src/CalendarProvider/CalendarProviderComponent'
import { CalendarComponent } from '../src/CalendarComponent/CalendarComponent'
import { CalendarDndDirective } from '../src/CalendarDnd/CalendarDndDirective'
import { demoEvents, type DemoEvent, FOCUS, localizer, NOW } from './harness'

type Resource = { id: string; title: string }

const rooms: Resource[] = [
  { id: 'board',    title: 'Board room' },
  { id: 'training', title: 'Training room' },
  { id: 'mtg1',    title: 'Meeting room 1' },
  { id: 'mtg2',    title: 'Meeting room 2' },
  { id: 'mtg3',    title: 'Meeting room 3' },
  { id: 'exec',    title: 'Executive suite' },
]

type ResourcePayload = {
  event: DemoEvent
  start: string
  end: string
  allDay: boolean
  resourceId?: string
}

@Component({
  selector: 'story-resource-week',
  standalone: true,
  imports: [CalendarProviderComponent, CalendarComponent, CalendarDndDirective],
  template: `
    <div style="block-size: 100dvh; inline-size: 100%">
      <bc-calendar-provider
        [localizer]="loc"
        [events]="events()"
        [defaultDate]="FOCUS"
        [getNow]="getNow"
        [defaultView]="defaultView"
        [views]="views"
        [resources]="rooms"
        [resourceLayout]="resourceLayout"
        [selectable]="true"
        [onEventDrop]="apply"
        [onEventResize]="apply"
      >
        <div calendarDnd style="display: contents">
          <bc-calendar />
        </div>
      </bc-calendar-provider>
    </div>
  `,
})
class ResourceWeekComponent {
  readonly loc = localizer
  readonly FOCUS = FOCUS
  readonly getNow = () => NOW
  readonly rooms = rooms
  readonly defaultView = Views.WEEK
  readonly views = [Views.WEEK, Views.WORK_WEEK]
  readonly resourceLayout = undefined
  readonly events = signal<DemoEvent[]>([...demoEvents])

  apply({ event, start, end, allDay, resourceId }: ResourcePayload) {
    this.events.update((list) =>
      list.map((e) =>
        e.id === event.id
          ? { ...e, start, end, allDay, resourceId: resourceId ?? e.resourceId } as DemoEvent
          : e,
      ),
    )
  }
}

@Component({
  selector: 'story-resource-day',
  standalone: true,
  imports: [CalendarProviderComponent, CalendarComponent, CalendarDndDirective],
  template: `
    <div style="block-size: 100dvh; inline-size: 100%">
      <bc-calendar-provider
        [localizer]="loc"
        [events]="events()"
        [defaultDate]="FOCUS"
        [getNow]="getNow"
        defaultView="day"
        [views]="[Views.DAY]"
        [resources]="rooms"
        [selectable]="true"
        [onEventDrop]="apply"
        [onEventResize]="apply"
      >
        <div calendarDnd style="display: contents">
          <bc-calendar />
        </div>
      </bc-calendar-provider>
    </div>
  `,
})
class ResourceDayComponent {
  readonly loc = localizer
  readonly FOCUS = FOCUS
  readonly getNow = () => NOW
  readonly rooms = rooms
  readonly Views = Views
  readonly events = signal<DemoEvent[]>([...demoEvents])

  apply({ event, start, end, allDay, resourceId }: ResourcePayload) {
    this.events.update((list) =>
      list.map((e) =>
        e.id === event.id
          ? { ...e, start, end, allDay, resourceId: resourceId ?? e.resourceId } as DemoEvent
          : e,
      ),
    )
  }
}

@Component({
  selector: 'story-resource-daymajor',
  standalone: true,
  imports: [CalendarProviderComponent, CalendarComponent, CalendarDndDirective],
  template: `
    <div style="block-size: 100dvh; inline-size: 100%">
      <bc-calendar-provider
        [localizer]="loc"
        [events]="events()"
        [defaultDate]="FOCUS"
        [getNow]="getNow"
        defaultView="week"
        [views]="[Views.WEEK, Views.WORK_WEEK]"
        [resources]="rooms"
        resourceLayout="day"
        [selectable]="true"
        [onEventDrop]="apply"
        [onEventResize]="apply"
      >
        <div calendarDnd style="display: contents">
          <bc-calendar />
        </div>
      </bc-calendar-provider>
    </div>
  `,
})
class ResourceDayMajorComponent {
  readonly loc = localizer
  readonly FOCUS = FOCUS
  readonly getNow = () => NOW
  readonly rooms = rooms
  readonly Views = Views
  readonly events = signal<DemoEvent[]>([...demoEvents])

  apply({ event, start, end, allDay, resourceId }: ResourcePayload) {
    this.events.update((list) =>
      list.map((e) =>
        e.id === event.id
          ? { ...e, start, end, allDay, resourceId: resourceId ?? e.resourceId } as DemoEvent
          : e,
      ),
    )
  }
}

const meta: Meta = {
  title: 'Resources/With Resources',
  argTypes: { onRangeChange: { action: 'onRangeChange' } },
}
export default meta

/**
 * A resource calendar where each resource (room) gets its own column. Selection
 * and drag-and-drop both work exactly as in the standard calendar — the difference
 * is that the slot and drop callbacks also report the `resourceId` of the column
 * the user interacted with, so you can assign or reassign events to resources.
 *
 * Use the story variants below to compare layout modes:
 * - **Week (resource-major)** — all days for one resource, then all days for the next.
 * - **Day (resource per column)** — one column per resource under a single day header.
 * - **Day-major** — all resources for Monday, then all for Tuesday, etc.
 *
 * Drag an event into a different resource's column — the `onEventDrop` payload
 * reports the new `resourceId` and your state update moves it there.
 */
export const WithResourcesWeek = {
  name: 'Week layout (resource-major)',
  render: () => ({
    template: '<story-resource-week></story-resource-week>',
    moduleMetadata: { imports: [ResourceWeekComponent] },
  }),
}

export const WithResourcesDay = {
  name: 'Day layout (resource columns)',
  render: () => ({
    template: '<story-resource-day></story-resource-day>',
    moduleMetadata: { imports: [ResourceDayComponent] },
  }),
}

export const WithResourcesDayMajor = {
  name: 'Day-major layout',
  render: () => ({
    template: '<story-resource-daymajor></story-resource-daymajor>',
    moduleMetadata: { imports: [ResourceDayMajorComponent] },
  }),
}
