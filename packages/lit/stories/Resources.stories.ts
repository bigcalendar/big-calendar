import { html } from 'lit'
import { LitElement } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { Views } from '@big-calendar/core'
import type { ViewKey } from '@big-calendar/core'
import type { Meta, StoryObj } from '@storybook/web-components-vite'
import { fn } from 'storybook/test'
import '@big-calendar/lit'
import { CalendarDndController } from '@big-calendar/lit'
import { demoEvents, type DemoEvent, FOCUS, litLocalizer, NOW } from './harness'

type Resource = { id: string; title: string }

const rooms: Resource[] = [
  { id: 'board',    title: 'Board room' },
  { id: 'training', title: 'Training room' },
  { id: 'mtg1',    title: 'Meeting room 1' },
  { id: 'mtg2',    title: 'Meeting room 2' },
  { id: 'mtg3',    title: 'Meeting room 3' },
  { id: 'exec',    title: 'Executive suite' },
]

@customElement('bc-story-resource-demo')
class ResourceDemoElement extends LitElement {
  override createRenderRoot() { return this }

  @property({ attribute: false }) layout: 'day' | 'week' | 'week-day-major' = 'week'
  @property({ attribute: false }) onRangeChange?: (a: unknown) => void

  private _events: DemoEvent[] = [...demoEvents]
  private _dnd = new CalendarDndController(this)

  override render() {
    const l = this.layout
    const defaultView = l === 'day' ? Views.DAY : Views.WEEK
    const views = l === 'day' ? [Views.DAY] : [Views.WEEK, Views.WORK_WEEK]
    const resourceLayout = l === 'week-day-major' ? 'day' : undefined

    const apply = (a: {
      event: DemoEvent
      start: string
      end: string
      allDay: boolean
      resourceId?: string
    }) => {
      this._events = this._events.map((e) =>
        e.id === a.event.id
          ? { ...e, start: a.start, end: a.end, allDay: a.allDay, resourceId: a.resourceId ?? e.resourceId }
          : e,
      )
      this.requestUpdate()
    }

    return html`
      <bc-calendar
        .localizer=${litLocalizer.current}
        .events=${this._events}
        .defaultDate=${FOCUS}
        .getNow=${() => NOW}
        .defaultView=${defaultView}
        .views=${views}
        .resources=${rooms}
        .resourceLayout=${resourceLayout}
        .selectable=${true}
        .onRangeChange=${this.onRangeChange}
        .onEventDrop=${apply}
        .onEventResize=${apply}
      >
        <div class="bc-calendar">
          <bc-default-toolbar></bc-default-toolbar>
          <bc-month-view></bc-month-view>
          <bc-time-grid-view></bc-time-grid-view>
          <bc-agenda-view></bc-agenda-view>
        </div>
      </bc-calendar>
    `
  }
}

type ResourceArgs = {
  layout: 'day' | 'week' | 'week-day-major'
  onRangeChange: (a: { range: { start: string; end: string }; view: ViewKey }) => void
}

const meta: Meta = {
  title: 'Resources/With Resources',
  args: { onRangeChange: fn() },
}
export default meta

/**
 * A resource calendar where each resource (room) gets its own column. Selection
 * and drag-and-drop both work exactly as in the standard calendar — the difference
 * is that the slot and drop callbacks also report the `resourceId` of the column
 * the user interacted with, so you can assign or reassign events to resources.
 *
 * Use the **Controls** panel to switch between layout modes:
 * - **day** — one column per resource under a single day header.
 * - **week** — resource-major: all days for one resource, then all days for the next.
 * - **week-day-major** — day-major: all resources for Monday, then all for Tuesday, etc.
 *
 * Drag an event into a different resource's column — `onEventDrop` reports the new
 * `resourceId` and your state update moves it there.
 */
export const WithResources: StoryObj<ResourceArgs> = {
  args: { layout: 'week' },
  argTypes: {
    layout: {
      control: 'select',
      options: ['day', 'week', 'week-day-major'],
      description:
        'Column ordering. "day" = one column per resource; "week" = resource-major; "week-day-major" = day-major.',
    },
  },
  render: (args) => html`
    <div style="block-size:100dvh;inline-size:100%">
      <bc-story-resource-demo
        .layout=${args.layout}
        .onRangeChange=${args.onRangeChange}
      ></bc-story-resource-demo>
    </div>
  `,
}
