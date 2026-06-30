import { ChangeDetectorRef, Component, inject, Input } from '@angular/core'
import type { OnChanges, SimpleChanges } from '@angular/core'
import { Views } from '@big-calendar/core'
import type { DayLayoutAlgorithmKey, ViewKey } from '@big-calendar/core'
import type { Meta, StoryObj } from '@storybook/angular'
import { moduleMetadata } from '@storybook/angular'
import { CalendarProviderComponent } from '../src/CalendarProvider/CalendarProviderComponent'
import { CalendarComponent } from '../src/CalendarComponent/CalendarComponent'
import { demoEvents, FOCUS, localizer, NOW } from './harness'

@Component({
  selector: 'story-scroll-to-time',
  standalone: true,
  imports: [CalendarProviderComponent, CalendarComponent],
  template: `
    @if (mounted) {
      <div style="block-size: 100dvh; inline-size: 100%">
        <bc-calendar-provider
          [localizer]="loc"
          [events]="events"
          [defaultDate]="FOCUS"
          [getNow]="getNow"
          defaultView="week"
          [scrollToTime]="scrollToTime"
        >
          <bc-calendar />
        </bc-calendar-provider>
      </div>
    }
  `,
})
class ScrollToTimeStoryComponent implements OnChanges {
  private readonly cdr = inject(ChangeDetectorRef)

  @Input() scrollToHour = new Date().getHours()

  readonly loc = localizer
  readonly FOCUS = FOCUS
  readonly events = demoEvents
  readonly getNow = () => NOW

  scrollToTime = { hour: this.scrollToHour }
  mounted = true

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['scrollToHour']) return
    this.scrollToTime = { hour: this.scrollToHour }
    if (!changes['scrollToHour'].firstChange) {
      this.mounted = false
      this.cdr.detectChanges()
      queueMicrotask(() => {
        this.mounted = true
        this.cdr.detectChanges()
      })
    }
  }
}

@Component({
  selector: 'story-time-window',
  standalone: true,
  imports: [CalendarProviderComponent, CalendarComponent],
  template: `
    @if (mounted) {
      <div style="block-size: 100dvh; inline-size: 100%">
        <bc-calendar-provider
          [localizer]="loc"
          [events]="events"
          [defaultDate]="FOCUS"
          [getNow]="getNow"
          defaultView="week"
          [min]="min"
          [max]="max"
        >
          <bc-calendar />
        </bc-calendar-provider>
      </div>
    }
  `,
})
class TimeWindowStoryComponent implements OnChanges {
  private readonly cdr = inject(ChangeDetectorRef)

  @Input() minHour = 8
  @Input() maxHour = 18

  readonly loc = localizer
  readonly FOCUS = FOCUS
  readonly events = demoEvents
  readonly getNow = () => NOW

  min = { hour: this.minHour }
  max = { hour: this.maxHour }
  mounted = true

  ngOnChanges(changes: SimpleChanges): void {
    const minChanged = changes['minHour']
    const maxChanged = changes['maxHour']
    if (!minChanged && !maxChanged) return
    this.min = { hour: this.minHour }
    this.max = { hour: this.maxHour }
    if (!(minChanged?.firstChange ?? maxChanged?.firstChange)) {
      this.mounted = false
      this.cdr.detectChanges()
      queueMicrotask(() => {
        this.mounted = true
        this.cdr.detectChanges()
      })
    }
  }
}

const meta: Meta = {
  title: 'Calendar/Standard',
  decorators: [
    moduleMetadata({
      imports: [CalendarProviderComponent, CalendarComponent],
    }),
  ],
}
export default meta

/**
 * The full calendar with toolbar and all five views. Use the **Controls** panel
 * to choose which view opens first, then switch between views using the toolbar.
 *
 * `weekEventLimit` controls the month view's show-more threshold. `showAllEvents`
 * controls the all-day strip height cap in the week / work-week / day views.
 * `dayLayoutAlgorithm` controls how overlapping timed events are packed
 * horizontally in the time-grid views (Week / Work Week / Day).
 */
export const Standard: StoryObj<{
  defaultView: ViewKey
  weekEventLimit: number | undefined
  showAllEvents: boolean
  dayLayoutAlgorithm: DayLayoutAlgorithmKey
  onRangeChange: (e: unknown) => void
}> = {
  args: {
    defaultView: Views.MONTH,
    weekEventLimit: undefined,
    showAllEvents: false,
    dayLayoutAlgorithm: 'overlap',
  },
  argTypes: {
    onRangeChange: { action: 'onRangeChange' },
    defaultView: {
      control: 'select',
      options: [Views.MONTH, Views.WEEK, Views.WORK_WEEK, Views.DAY, Views.AGENDA],
      description:
        'The view the calendar opens on. Use the toolbar to switch between views once it loads.',
    },
    weekEventLimit: {
      control: { type: 'number', min: 1 },
      description:
        'Month view only. Fix the number of visible event rows per week cell before the "+ N more" button appears. When unset, the cell height is measured automatically.',
    },
    showAllEvents: {
      control: 'boolean',
      description:
        'Week / Work Week / Day views only. Remove the default 2-row cap on the all-day strip so every all-day and multi-day event is always visible.',
    },
    dayLayoutAlgorithm: {
      control: 'select',
      options: ['overlap', 'no-overlap'] as DayLayoutAlgorithmKey[],
      description:
        'Week / Work Week / Day views only. `overlap` packs concurrent events into side-by-side columns that share the full width. `no-overlap` stacks events that touch in time into narrower independent columns so nothing overlaps visually.',
    },
  },
  render: (args) => ({
    props: {
      localizer,
      events: demoEvents,
      FOCUS,
      getNow: () => NOW,
      ...args,
    },
    template: `
      <div style="block-size: 100dvh; inline-size: 100%">
        <bc-calendar-provider
          [localizer]="localizer"
          [events]="events"
          [defaultDate]="FOCUS"
          [getNow]="getNow"
          [defaultView]="defaultView"
          [weekEventLimit]="weekEventLimit"
          [showAllEvents]="showAllEvents"
          [dayLayoutAlgorithm]="dayLayoutAlgorithm"
          [onRangeChange]="onRangeChange"
        >
          <bc-calendar />
        </bc-calendar-provider>
      </div>
    `,
  }),
}

/**
 * The time grid scrolls to a specific time on load. When `scrollToTime` is
 * omitted the calendar defaults to the **current time** in the configured
 * time zone — the behavior you see here. Pass a fixed value like
 * `{ hour: 8 }` to always open at the same hour regardless of when the page
 * loads.
 *
 * Use the **Controls** panel to change the hour and observe the grid jumping
 * to that position. The calendar remounts on each change because `scrollToTime`
 * is read once at mount and is not reactive.
 */
export const ScrollToTime: StoryObj<{ scrollToHour: number }> = {
  args: { scrollToHour: new Date().getHours() },
  argTypes: {
    scrollToHour: {
      control: { type: 'number', min: 0, max: 23 },
      description:
        'Hour the time grid scrolls to on load (0–23). ' +
        'Passed as `scrollToTime: { hour }`. Defaults to the current hour.',
    },
  },
  render: (args) => ({
    props: { scrollToHour: args.scrollToHour },
    template: `<story-scroll-to-time [scrollToHour]="scrollToHour"></story-scroll-to-time>`,
    moduleMetadata: { imports: [ScrollToTimeStoryComponent] },
  }),
}

/**
 * Use `min` and `max` to restrict the visible time window in the Week, Work
 * Week, and Day views. Both props accept a `{ hour, minute? }` object where
 * `hour` is 0–23 and `minute` defaults to 0.
 *
 * The grid always shows full slots up to (but not including) the `max` boundary
 * — you will never see a label for that hour itself, because it would be the
 * start of the next, invisible slot. Events that fall outside the window are
 * still tracked; they are clipped at the top or bottom edge.
 */
export const TimeWindow: StoryObj<{ minHour: number; maxHour: number }> = {
  args: { minHour: 8, maxHour: 18 },
  argTypes: {
    minHour: {
      control: { type: 'number', min: 0, max: 23 },
      description:
        'Earliest hour shown in the time grid (0–23). Passed as `min: { hour }`. ' +
        '0 = start of day (midnight). Increase to hide early-morning hours.',
    },
    maxHour: {
      control: { type: 'number', min: 1, max: 23 },
      description:
        'Exclusive end hour of the visible window (1–23). Passed as `max: { hour }`. ' +
        'The last visible slot begins just before this boundary. ' +
        '0 = full day (same as omitting max entirely).',
    },
  },
  render: (args) => ({
    props: { minHour: args.minHour, maxHour: args.maxHour },
    template: `<story-time-window [minHour]="minHour" [maxHour]="maxHour"></story-time-window>`,
    moduleMetadata: { imports: [TimeWindowStoryComponent] },
  }),
}
