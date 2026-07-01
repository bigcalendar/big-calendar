import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import type { TemplateRef } from '@angular/core'
import { NgStyle, NgTemplateOutlet } from '@angular/common'
import { injectAgendaView } from '../injectAgendaView'
import type { AgendaRowEvent } from '../injectAgendaView'

/**
 * Renders the agenda calendar view. Must be a descendant of
 * `<bc-calendar-provider>`. When the active view is not `agenda`, renders nothing.
 *
 * Provide `ng-template` inputs to override any slot:
 * - `[bcAgendaDate]` — date column cell (`$implicit: { day: string; label: string }`)
 * - `[bcAgendaEvent]` — event row (`$implicit: AgendaRowEvent`)
 * - `[bcAgendaEmpty]` — empty-state message (`$implicit: string`)
 *
 * @example
 * ```html
 * <bc-calendar-provider [localizer]="localizer" [defaultView]="'agenda'" [events]="events">
 *   <bc-agenda-view />
 * </bc-calendar-provider>
 * ```
 */
@Component({
  selector: 'bc-agenda-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgStyle, NgTemplateOutlet],
  host: { style: 'display: contents' },
  template: `
    @if (state.rows() !== null) {
      <div [class]="state.root.class">
        <!-- Column headings -->
        <div [class]="state.header.class">
          <span [class]="state.headingCell.class">{{ state.messages().date }}</span>
          <span [class]="state.headingCell.class">{{ state.messages().time }}</span>
          <span [class]="state.headingCell.class">{{ state.messages().event }}</span>
        </div>

        <!-- Empty state -->
        @if (state.rows()!.length === 0) {
          @if (bcAgendaEmpty) {
            <ng-template
              [ngTemplateOutlet]="bcAgendaEmpty"
              [ngTemplateOutletContext]="{ $implicit: state.messages().noEventsInRange }"
            />
          } @else {
            <div class="bc-agenda-empty">{{ state.messages().noEventsInRange }}</div>
          }
        } @else {
          <!-- Day-grouped event rows -->
          <div [class]="state.body.class">
            @for (row of state.rows()!; track row.day) {
              <div
                [class]="state.getRowProps(row).class"
                [ngStyle]="state.getRowProps(row).style"
              >
                <!-- Date column -->
                @if (bcAgendaDate) {
                  <ng-template
                    [ngTemplateOutlet]="bcAgendaDate"
                    [ngTemplateOutletContext]="{ $implicit: { day: row.day, label: row.label } }"
                  />
                } @else {
                  <div class="bc-agenda-date">{{ row.label }}</div>
                }

                <!-- Event rows: time and event are sibling grid cells -->
                @for (item of row.events; track item.key) {
                  @if (bcAgendaEvent) {
                    <ng-template
                      [ngTemplateOutlet]="bcAgendaEvent"
                      [ngTemplateOutletContext]="{ $implicit: item }"
                    />
                  } @else {
                    <time class="bc-agenda-time">{{ item.time }}</time>
                    @if (state.eventHas()) {
                      <button
                        type="button"
                        class="bc-agenda-event"
                        [attr.data-bc-event]="state.getEventId(item.event)"
                        (click)="state.handleEventClick(item.event, $event)"
                        (dblclick)="state.handleEventDblClick(item.event, $event)"
                        (keydown)="state.handleEventKeyDown(item.event, $event)"
                        (contextmenu)="state.handleEventContextMenu(item.event, $event)"
                        (auxclick)="state.handleEventAuxClick(item.event, $event)"
                      >{{ item.title }}</button>
                    } @else {
                      <div class="bc-agenda-event">{{ item.title }}</div>
                    }
                  }
                }
              </div>
            }
          </div>
        }
      </div>
    }
  `,
})
export class AgendaViewComponent<TEvent = unknown> {
  /** Custom date column template. Context: `{ $implicit: { day: string, label: string } }`. */
  @Input() bcAgendaDate?: TemplateRef<{ $implicit: { day: string; label: string } }>
  /** Custom event row template. Context: `{ $implicit: AgendaRowEvent }`. */
  @Input() bcAgendaEvent?: TemplateRef<{ $implicit: AgendaRowEvent<TEvent> }>
  /** Custom empty-state template. Context: `{ $implicit: string }` (the message text). */
  @Input() bcAgendaEmpty?: TemplateRef<{ $implicit: string }>

  readonly state = injectAgendaView<TEvent>()
}
