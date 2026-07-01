import { ChangeDetectionStrategy, Component, effect, Input, viewChild } from '@angular/core'
import type { ElementRef, TemplateRef } from '@angular/core'
import { NgStyle, NgTemplateOutlet } from '@angular/common'
import { injectMonthView } from '../injectMonthView'
import type { MonthDayCell, MonthWeekday } from '../injectMonthView'
import { injectCalendar } from '../CalendarProvider/injectCalendar'

/**
 * Renders the month calendar grid. Must be a descendant of
 * `<bc-calendar-provider>`. When the active view is not `month`, renders nothing.
 *
 * Provide `ng-template` inputs to override any slot:
 * - `[bcMonthWeekday]` — column-heading cells (`$implicit: MonthWeekday`)
 * - `[bcMonthDateCell]` — date-header cells inside each day (`$implicit: MonthDayCell, onDrillDown: () => void`)
 * - `[bcMonthEvent]` — event segments (`$implicit: { event; title: string }`)
 * - `[bcMonthShowMore]` — overflow "show N more" cells (`$implicit: { count; label; day; events }`)
 *
 * @example
 * ```html
 * <bc-calendar-provider [localizer]="localizer" [defaultView]="'month'" [events]="events">
 *   <bc-month-view>
 *     <ng-template #myEvent let-ctx>
 *       <strong>{{ ctx.title }}</strong>
 *     </ng-template>
 *   </bc-month-view>
 * </bc-calendar-provider>
 * ```
 */
@Component({
  selector: 'bc-month-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgStyle, NgTemplateOutlet],
  host: { style: 'display: contents' },
  template: `
    @if (state.grid() !== null) {
      <div [class]="state.root.class">
        <!-- Weekday column headings -->
        <div [class]="state.monthHeader.class">
          @for (weekday of state.grid()!.weekdays; track weekday.day) {
            @if (bcMonthWeekday) {
              <ng-template
                [ngTemplateOutlet]="bcMonthWeekday"
                [ngTemplateOutletContext]="{ $implicit: weekday }"
              />
            } @else {
              <span class="bc-weekday" role="columnheader">
                <span class="bc-weekday-long">{{ weekday.long }}</span>
                <span class="bc-weekday-short" aria-hidden="true">{{ weekday.short }}</span>
              </span>
            }
          }
        </div>

        <!-- Grid body: week rows -->
        <div
          #monthGridEl
          [class]="state.monthGrid().class"
          [ngStyle]="state.monthGrid().style"
        >
          @for (week of state.grid()!.weeks; track week.key; let weekIndex = $index) {
            <div [class]="state.weekRow.class">

              <!-- Transparent hit-targets for slot selection -->
              <div [class]="state.slotsContainer.class" (pointerdown)="state.onSlotsPointerDown($event)">
                @for (cell of week.days; track cell.day; let dayIndex = $index) {
                  <div
                    class="bc-month-slot"
                    [attr.data-date]="cell.day"
                    [attr.data-slot-index]="weekIndex * 7 + dayIndex"
                    [attr.aria-describedby]="state.getDaySlotProps(cell, weekIndex, dayIndex)['aria-describedby']"
                    tabindex="0"
                  ></div>
                }
              </div>

              <!-- Date-cell backgrounds -->
              <div [class]="state.backgroundsContainer.class">
                @for (cell of week.days; track cell.day) {
                  <div
                    class="bc-date-cell"
                    [class.bc-today]="cell.isToday"
                    [class.bc-off-range]="cell.isOffRange"
                  >
                    @if (bcMonthDateCell) {
                      <ng-template
                        [ngTemplateOutlet]="bcMonthDateCell"
                        [ngTemplateOutletContext]="{ $implicit: cell, onDrillDown: drilldownFn(cell.day) }"
                      />
                    } @else {
                      <button
                        type="button"
                        class="bc-date-number"
                        (click)="state.drilldown(cell.day)"
                      >{{ cell.label }}</button>
                    }
                  </div>
                }
              </div>

              <!-- Live selection highlight -->
              @if (state.getWeekSelectionBand(weekIndex) !== null) {
                <div
                  [class]="state.getWeekSelectionBand(weekIndex)!.class"
                  [ngStyle]="state.getWeekSelectionBand(weekIndex)!.style"
                ></div>
              }

              <!-- Drag-move preview band -->
              @if (state.getWeekPreviewBand(week) !== null) {
                <div
                  [class]="state.getWeekPreviewBand(week)!.class"
                  [ngStyle]="state.getWeekPreviewBand(week)!.style"
                ></div>
              }

              <!-- Event segments + show-more cells -->
              <div [class]="state.eventsContainer.class">
                @for (segment of week.segments; track segment.key) {
                  <button
                    type="button"
                    [class]="state.getSegmentProps(segment).class"
                    [class.bc-event-draggable]="state.isDraggable(segment.event)"
                    [ngStyle]="state.getSegmentProps(segment).style"
                    [attr.data-bc-event]="state.getEventId(segment.event)"
                    [attr.aria-selected]="state.isEventSelected(segment.event)"
                    (click)="state.handleSegmentClick(segment.event, $event)"
                    (dblclick)="state.handleSegmentDblClick(segment.event, $event)"
                    (keydown)="state.handleSegmentKeyDown(segment.event, $event)"
                    (contextmenu)="state.handleSegmentContextMenu(segment.event, $event)"
                    (auxclick)="state.handleSegmentAuxClick(segment.event, $event)"
                    (pointerdown)="$event.stopPropagation()"
                  >
                    @if (bcMonthEvent) {
                      <ng-template
                        [ngTemplateOutlet]="bcMonthEvent"
                        [ngTemplateOutletContext]="{ $implicit: { event: segment.event, title: segment.title } }"
                      />
                    } @else {
                      <span class="bc-event-title">{{ segment.title }}</span>
                    }
                    @if (state.isResizable(segment.event)) {
                      @for (edge of state.getSegmentProps(segment).resizeEdges; track edge) {
                        <div [class]="'bc-resize-handle bc-resize-handle-' + edge" [attr.data-bc-resize]="edge"></div>
                      }
                    }
                  </button>
                }

                @for (cell of week.days; track cell.day; let dayIndex = $index) {
                  @if (state.getShowMoreCellProps(cell, dayIndex, week.moreRow) !== null) {
                    <div
                      [class]="state.getShowMoreCellProps(cell, dayIndex, week.moreRow)!.class"
                      [ngStyle]="state.getShowMoreCellProps(cell, dayIndex, week.moreRow)!.style"
                    >
                      @if (bcMonthShowMore) {
                        <ng-template
                          [ngTemplateOutlet]="bcMonthShowMore"
                          [ngTemplateOutletContext]="{ $implicit: state.getShowMoreCellProps(cell, dayIndex, week.moreRow)! }"
                        />
                      } @else {
                        <button type="button" class="bc-show-more">
                          {{ state.getShowMoreCellProps(cell, dayIndex, week.moreRow)!.label }}
                        </button>
                      }
                    </div>
                  }
                }
              </div>
            </div>
          }
        </div>
      </div>
    }
  `,
})
export class MonthViewComponent<TEvent = unknown> {
  private readonly monthGridRef = viewChild<ElementRef<HTMLElement>>('monthGridEl')

  /** Custom column-heading cell template. Context: `{ $implicit: MonthWeekday }`. */
  @Input() bcMonthWeekday?: TemplateRef<{ $implicit: MonthWeekday }>
  /** Custom date-header template. Context: `{ $implicit: MonthDayCell, onDrillDown: () => void }`. */
  @Input() bcMonthDateCell?: TemplateRef<{ $implicit: MonthDayCell<TEvent>; onDrillDown: () => void }>
  /** Custom event segment template. Context: `{ $implicit: { event: TEvent, title: string } }`. */
  @Input() bcMonthEvent?: TemplateRef<{ $implicit: { event: TEvent; title: string } }>
  /** Custom show-more cell template. Context: `{ $implicit: { count, label, day, events } }`. */
  @Input() bcMonthShowMore?: TemplateRef<{
    $implicit: {
      count: number
      label: string
      day: string
      events: ReadonlyArray<{ key: string; event: TEvent; title: string }>
    }
  }>

  readonly state = injectMonthView<TEvent>()

  constructor() {
    const cal = injectCalendar()

    effect((onCleanup) => {
      const elRef = this.monthGridRef()
      const store = cal.storeSignal()

      if (!elRef || !store) return

      const gridEl = elRef.nativeElement

      const measure = (): void => {
        const grid = this.state.grid()
        if (!grid || grid.weeks.length === 0) {
          store.measuredWeekLimit.value = Infinity
          return
        }
        const rowHeight = gridEl.getBoundingClientRect().height / grid.weeks.length
        const eventsEl = gridEl.querySelector<HTMLElement>('.bc-week-events')
        if (!eventsEl) { store.measuredWeekLimit.value = Infinity; return }
        const style = getComputedStyle(eventsEl)
        const segmentHeight = parseFloat(style.gridAutoRows)
        const headerHeight = parseFloat(style.paddingBlockStart)
        if (!isFinite(segmentHeight) || segmentHeight <= 0) {
          store.measuredWeekLimit.value = Infinity
          return
        }
        store.measuredWeekLimit.value = Math.max(
          1,
          Math.floor((rowHeight - headerHeight) / segmentHeight),
        )
      }

      const observer = new ResizeObserver(measure)
      observer.observe(gridEl)

      onCleanup(() => {
        observer.disconnect()
        store.measuredWeekLimit.value = Infinity
      })
    })
  }

  drilldownFn(day: string): () => void {
    return () => this.state.drilldown(day)
  }
}
