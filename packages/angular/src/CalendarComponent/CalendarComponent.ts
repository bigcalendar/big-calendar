import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import { AgendaViewComponent } from '../AgendaViewComponent'
import { DefaultToolbarComponent } from '../DefaultToolbarComponent/DefaultToolbarComponent'
import { MonthViewComponent } from '../MonthViewComponent'
import { TimeGridViewComponent } from '../TimeGridViewComponent'

/**
 * All-in-one calendar shell. Renders the toolbar (unless `[toolbar]="false"`)
 * followed by whichever view component matches the current active view — month,
 * time-grid (week / work_week / day), or agenda.
 *
 * Must be a descendant of `<bc-calendar-provider>`.
 *
 * **Single-import usage (most common):**
 * ```html
 * <bc-calendar-provider [localizer]="localizer" [events]="events" [defaultView]="'week'">
 *   <bc-calendar />
 * </bc-calendar-provider>
 * ```
 *
 * **Disable toolbar:**
 * ```html
 * <bc-calendar [toolbar]="false" />
 * ```
 *
 * **Slot customization** — pass template inputs directly to the embedded view
 * components by wrapping them manually instead of using `<bc-calendar>`:
 * ```html
 * <bc-calendar-provider [localizer]="localizer" [events]="events">
 *   <bc-default-toolbar />
 *   <bc-month-view [bcMonthEvent]="myEventTpl" />
 *   <bc-time-grid-view />
 *   <bc-agenda-view />
 * </bc-calendar-provider>
 * ```
 */
@Component({
  selector: 'bc-calendar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DefaultToolbarComponent,
    MonthViewComponent,
    TimeGridViewComponent,
    AgendaViewComponent,
  ],
  template: `
    @if (toolbar) { <bc-default-toolbar /> }
    <div class="bc-calendar">
      <bc-month-view />
      <bc-time-grid-view />
      <bc-agenda-view />
    </div>
  `,
})
export class CalendarComponent {
  /** Set to `false` to hide the default toolbar. Defaults to `true`. */
  @Input() toolbar = true
}
