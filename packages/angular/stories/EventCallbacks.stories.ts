import { Views } from '@big-calendar/core'
import type { ViewKey } from '@big-calendar/core'
import { Component, Input } from '@angular/core'
import type { Meta, StoryObj } from '@storybook/angular'
import { CalendarProviderComponent } from '../src/CalendarProvider/CalendarProviderComponent'
import { CalendarComponent } from '../src/CalendarComponent/CalendarComponent'
import { demoEvents, FOCUS, localizer, NOW } from './harness'

@Component({
  selector: 'story-event-callbacks',
  standalone: true,
  imports: [CalendarProviderComponent, CalendarComponent],
  template: `
    <div style="block-size: 100dvh; inline-size: 100%">
      <bc-calendar-provider
        [localizer]="loc"
        [events]="events"
        [defaultDate]="FOCUS"
        [getNow]="getNow"
        [defaultView]="view"
        [onEventClick]="onEventClick"
        [onEventDoubleClick]="onEventDoubleClick"
        [onEventRightClick]="onEventRightClick"
        [onEventMiddleClick]="onEventMiddleClick"
        [onRangeChange]="onRangeChange"
      >
        <bc-calendar />
      </bc-calendar-provider>
    </div>
  `,
})
export class EventCallbacksWrapperComponent {
  readonly loc = localizer
  readonly events = demoEvents
  readonly FOCUS = FOCUS
  readonly getNow = () => NOW

  @Input() view: ViewKey = Views.WEEK
  @Input() onEventClick?: (event: unknown, domEvent: MouseEvent | KeyboardEvent) => void
  @Input() onEventDoubleClick?: (event: unknown, domEvent: MouseEvent | KeyboardEvent) => void
  @Input() onEventRightClick?: (event: unknown, domEvent: MouseEvent) => void
  @Input() onEventMiddleClick?: (event: unknown, domEvent: MouseEvent) => void
  @Input() onRangeChange?: (args: unknown) => void
}

const meta: Meta<EventCallbacksWrapperComponent> = {
  title: 'Events/Event Callbacks',
  component: EventCallbacksWrapperComponent,
  argTypes: {
    onEventClick: { action: 'onEventClick' },
    onEventDoubleClick: { action: 'onEventDoubleClick' },
    onEventRightClick: { action: 'onEventRightClick' },
    onEventMiddleClick: { action: 'onEventMiddleClick' },
    onRangeChange: { action: 'onRangeChange' },
  },
}
export default meta

/**
 * All four event callbacks wired to the **Actions** panel. Click, double-click,
 * right-click, or middle-click any event block to see the full event object logged.
 *
 * These callbacks fire whether or not `selectable` is enabled — they are
 * completely independent of slot selection.
 *
 * **Tip:** Right-click fires `onEventRightClick` with the DOM `MouseEvent` as a
 * second argument. The browser's native context menu still appears unless you call
 * `e.preventDefault()` in your handler. Middle-click (scroll-wheel click) fires
 * `onEventMiddleClick` — some browsers suppress middle-click inside iframes, so
 * test it in your own app if it does not trigger here.
 */
export const EventCallbacks: StoryObj<EventCallbacksWrapperComponent> = {
  args: { view: Views.WEEK },
  argTypes: {
    view: {
      control: 'select',
      options: [Views.MONTH, Views.WEEK, Views.WORK_WEEK, Views.DAY, Views.AGENDA],
      description: 'Switch views to explore how event callbacks behave across different layouts.',
    },
  },
}
