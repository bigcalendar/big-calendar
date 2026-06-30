import { Views } from '@big-calendar/core'
import type { ViewKey } from '@big-calendar/core'
import { Component, Input } from '@angular/core'
import type { Meta, StoryObj } from '@storybook/angular'
import { CalendarProviderComponent } from '../src/CalendarProvider/CalendarProviderComponent'
import { CalendarComponent } from '../src/CalendarComponent/CalendarComponent'
import { demoEvents, FOCUS, localizer, NOW } from './harness'

@Component({
  selector: 'story-selectable',
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
        [selectable]="selectable"
        [onSlotClick]="onSlotClick"
        [onSlotDoubleClick]="onSlotDoubleClick"
        [onSlotSelect]="onSlotSelect"
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
export class SelectableWrapperComponent {
  readonly loc = localizer
  readonly events = demoEvents
  readonly FOCUS = FOCUS
  readonly getNow = () => NOW

  @Input() view: ViewKey = Views.MONTH
  @Input() selectable = true
  @Input() onSlotClick?: (args: unknown) => void
  @Input() onSlotDoubleClick?: (args: unknown) => void
  @Input() onSlotSelect?: (args: unknown) => void
  @Input() onEventClick?: (event: unknown, domEvent: MouseEvent | KeyboardEvent) => void
  @Input() onEventDoubleClick?: (event: unknown, domEvent: MouseEvent | KeyboardEvent) => void
  @Input() onEventRightClick?: (event: unknown, domEvent: MouseEvent) => void
  @Input() onEventMiddleClick?: (event: unknown, domEvent: MouseEvent) => void
  @Input() onRangeChange?: (args: unknown) => void
}

const meta: Meta<SelectableWrapperComponent> = {
  title: 'Selection/Selectable',
  component: SelectableWrapperComponent,
  argTypes: {
    onSlotClick: { action: 'onSlotClick' },
    onSlotDoubleClick: { action: 'onSlotDoubleClick' },
    onSlotSelect: { action: 'onSlotSelect' },
    onEventClick: { action: 'onEventClick' },
    onEventDoubleClick: { action: 'onEventDoubleClick' },
    onEventRightClick: { action: 'onEventRightClick' },
    onEventMiddleClick: { action: 'onEventMiddleClick' },
    onRangeChange: { action: 'onRangeChange' },
  },
}
export default meta

/**
 * Calendar with slot and event selection enabled. Every gesture — click,
 * double-click, drag-to-select — fires a callback logged in the **Actions**
 * panel below. Switch views with the **Controls** panel to explore how slot
 * payloads differ between the month grid and the time grid.
 */
export const Selectable: StoryObj<SelectableWrapperComponent> = {
  args: { selectable: true, view: Views.MONTH },
  argTypes: {
    selectable: {
      control: 'boolean',
      description:
        'Enable slot and day selection. When off, clicking or dragging the grid produces no slot callbacks.',
    },
    view: {
      control: 'select',
      options: [Views.MONTH, Views.WEEK, Views.WORK_WEEK, Views.DAY, Views.AGENDA],
      description: 'The calendar view to display.',
    },
  },
}
