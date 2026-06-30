import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  Input,
  ViewChild,
} from '@angular/core'
import type { ElementRef, TemplateRef } from '@angular/core'
import { NgStyle, NgTemplateOutlet } from '@angular/common'
import { injectTimeGridView } from '../injectTimeGridView'
import type { TimeDayHeading, TimeGutterLabel, TimePositionedEvent } from '../injectTimeGridView'
import { injectCalendar } from '../CalendarProvider/injectCalendar'

/**
 * Renders the time-grid calendar view (week, work_week, day). Must be a
 * descendant of `<bc-calendar-provider>`. When the active view is not a
 * time-grid view, renders nothing.
 *
 * Provide `ng-template` inputs to override any slot:
 * - `[bcTimeDayHeading]` — day-column header cell (`$implicit: TimeDayHeading`)
 * - `[bcTimeGutterLabel]` — gutter time-label (`$implicit: TimeGutterLabel`)
 * - `[bcTimeEvent]` — timed event button content (`$implicit: TimePositionedEvent`)
 * - `[bcTimeAllDayEvent]` — all-day segment content (`$implicit: { event; title: string }`)
 *
 * @example
 * ```html
 * <bc-calendar-provider [localizer]="localizer" [defaultView]="'week'" [events]="events">
 *   <bc-time-grid-view />
 * </bc-calendar-provider>
 * ```
 */
@Component({
  selector: 'bc-time-grid-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgStyle, NgTemplateOutlet],
  host: { style: 'display: contents' },
  template: `
    @if (state.grid() !== null) {
      @let grid = state.grid()!;
      <div
        [class]="state.getRootClass(state.grid())"
        [ngStyle]="state.getRootStyle(leafColumnCount())"
      >
        <!-- ── Plain time-grid (no resources) ─────────────────────── -->
        @if (grid.resources === null && grid.dayGroups === null) {
          <!-- Header: day column headings + all-day row -->
          <div class="bc-time-head">
            <div class="bc-time-header">
              <div class="bc-time-header-gutter"></div>
              @for (heading of grid.headings; track heading.day) {
                @if (bcTimeDayHeading) {
                  <ng-template
                    [ngTemplateOutlet]="bcTimeDayHeading"
                    [ngTemplateOutletContext]="{ $implicit: heading }"
                  />
                } @else {
                  <div
                    class="bc-day-heading"
                    role="columnheader"
                    [class.bc-today]="heading.isToday"
                  >{{ heading.label }}</div>
                }
              }
            </div>
            <div class="bc-allday-row">
              <div class="bc-allday-label">{{ state.allDayLabel }}</div>
              <div class="bc-allday-slots" (pointerdown)="state.onAllDayPointerDown($event)">
                @for (heading of grid.headings; track heading.day; let i = $index) {
                  <div
                    class="bc-allday-slot"
                    [attr.data-date]="heading.day"
                    [attr.data-slot-index]="i"
                    tabindex="0"
                  ></div>
                }
                @for (segment of grid.allDay.segments; track segment.key) {
                  <button
                    type="button"
                    class="bc-segment"
                    [class.bc-event-draggable]="state.isDraggable(segment.event)"
                    [ngStyle]="{
                      'grid-column': segment.left + ' / span ' + segment.span,
                      'grid-row': segment.row
                    }"
                    [attr.data-bc-event]="state.getEventId(segment.event)"
                    [attr.aria-selected]="state.isEventSelected(segment.event)"
                    (click)="state.handleEventClick(segment.event, $event)"
                    (dblclick)="state.handleEventDblClick(segment.event, $event)"
                    (keydown)="state.handleEventKeyDown(segment.event, $event)"
                    (contextmenu)="state.handleEventContextMenu(segment.event, $event)"
                    (auxclick)="state.handleEventAuxClick(segment.event, $event)"
                    (pointerdown)="$event.stopPropagation()"
                  >
                    @if (bcTimeAllDayEvent) {
                      <ng-template
                        [ngTemplateOutlet]="bcTimeAllDayEvent"
                        [ngTemplateOutletContext]="{ $implicit: { event: segment.event, title: segment.title } }"
                      />
                    } @else {
                      <span class="bc-event-title">{{ segment.title }}</span>
                    }
                  </button>
                }
              </div>
            </div>
          </div>

          <!-- Body: gutter + day columns -->
          <div #timeBody class="bc-time-body" (pointerdown)="state.onSlotsPointerDown($event)">
            <div class="bc-time-gutter">
              @for (label of grid.gutter; track label.key) {
                @if (bcTimeGutterLabel) {
                  <ng-template
                    [ngTemplateOutlet]="bcTimeGutterLabel"
                    [ngTemplateOutletContext]="{ $implicit: label }"
                  />
                } @else {
                  <div class="bc-time-label">{{ label.label }}</div>
                }
              }
            </div>
            @for (column of grid.columns; track column.key; let colIndex = $index) {
              <div class="bc-day-column" [class.bc-today]="column.isToday">
                <div class="bc-time-slots">
                  @for (slot of column.slots; track $index; let slotIndex = $index) {
                    <div
                      class="bc-time-slot"
                      [attr.data-date]="column.day"
                      [attr.data-slot-index]="colIndex * grid.slotCount + slotIndex"
                      [attr.data-bc-instant]="slot"
                    ></div>
                  }
                </div>
                @for (bg of column.backgroundEvents; track bg.key) {
                  <div
                    class="bc-bg-event"
                    [ngStyle]="{
                      top: bg.top * 100 + '%',
                      height: bg.height * 100 + '%',
                      left: bg.left * 100 + '%',
                      width: bg.width * 100 + '%'
                    }"
                  ></div>
                }
                @for (event of column.events; track event.key) {
                  <button
                    type="button"
                    class="bc-event"
                    [class.bc-event-draggable]="state.isDraggable(event.event)"
                    [ngStyle]="{
                      top: event.top * 100 + '%',
                      height: event.height * 100 + '%',
                      left: event.left * 100 + '%',
                      width: event.width * 100 + '%',
                      'z-index': event.zIndex
                    }"
                    [attr.data-bc-event]="state.getEventId(event.event)"
                    [attr.aria-selected]="state.isEventSelected(event.event)"
                    (click)="state.handleEventClick(event.event, $event)"
                    (dblclick)="state.handleEventDblClick(event.event, $event)"
                    (keydown)="state.handleEventKeyDown(event.event, $event)"
                    (contextmenu)="state.handleEventContextMenu(event.event, $event)"
                    (auxclick)="state.handleEventAuxClick(event.event, $event)"
                    (pointerdown)="$event.stopPropagation()"
                  >
                    @if (bcTimeEvent) {
                      <ng-template
                        [ngTemplateOutlet]="bcTimeEvent"
                        [ngTemplateOutletContext]="{ $implicit: event }"
                      />
                    } @else {
                      <span class="bc-event-title">{{ event.title }}</span>
                      <time class="bc-event-time">{{ event.time }}</time>
                    }
                    @if (state.isResizable(event.event)) {
                      <div class="bc-resize-handle bc-resize-handle-start" data-bc-resize="start"></div>
                      <div class="bc-resize-handle bc-resize-handle-end" data-bc-resize="end"></div>
                    }
                  </button>
                }
                @let selStyle = state.getTimeSelectionStyle(colIndex);
                @if (selStyle !== null) {
                  <div class="bc-selection" [ngStyle]="selStyle"></div>
                }
                @let prevStyle = state.getPreviewStyle(column);
                @if (prevStyle !== null) {
                  <div class="bc-drag-preview" [ngStyle]="prevStyle"></div>
                }
              </div>
            }
            @if (state.bodyNowTop() !== null) {
              <div
                class="bc-now-indicator"
                [ngStyle]="{ '--bc-now-top': state.bodyNowTop() }"
              ></div>
            }
          </div>
        }

        <!-- ── Resource layouts (resource-major) ─────────────────── -->
        @if (grid.resources !== null) {
          @let isWeek = grid.headings.length > 1;
          @let daysPerGroup = grid.headings.length;
          <div class="bc-time-head">
            @if (isWeek) {
              <!-- Week: two-tier header — resource title row + day heading row -->
              <div class="bc-time-header bc-time-header-tiered">
                <div class="bc-time-header-gutter" aria-hidden="true" style="grid-row: 1 / 3"></div>
                @for (group of grid.resources; track group.key; let gi = $index) {
                  <div
                    class="bc-header bc-resource-header"
                    role="columnheader"
                    [ngStyle]="{ 'grid-column': (2 + gi * daysPerGroup) + ' / span ' + daysPerGroup, 'grid-row': 1 }"
                  >{{ group.resourceTitle }}</div>
                  @for (column of group.columns; track column.key; let di = $index) {
                    <div
                      class="bc-resource-day-head"
                      [ngStyle]="{ 'grid-column': 2 + gi * daysPerGroup + di, 'grid-row': 2 }"
                    >
                      @if (bcTimeDayHeading) {
                        <ng-template
                          [ngTemplateOutlet]="bcTimeDayHeading"
                          [ngTemplateOutletContext]="{ $implicit: { day: column.day, label: grid.headings[di]?.label ?? '', isToday: column.isToday } }"
                        />
                      } @else {
                        <div
                          class="bc-day-heading"
                          role="columnheader"
                          [class.bc-today]="column.isToday"
                        >{{ grid.headings[di]?.label ?? '' }}</div>
                      }
                    </div>
                  }
                }
              </div>
            } @else {
              <!-- Day: single-tier header — one resource name per column -->
              <div class="bc-time-header">
                <div class="bc-time-header-gutter"></div>
                @for (group of grid.resources; track group.key) {
                  <div class="bc-header bc-resource-header" role="columnheader">{{ group.resourceTitle }}</div>
                }
              </div>
            }

            <!-- All-day row -->
            <div class="bc-allday-row" (pointerdown)="state.onAllDayPointerDown($event)">
              <div class="bc-allday-label">{{ state.allDayLabel }}</div>
              @if (isWeek) {
                @for (group of grid.resources; track group.key; let gi = $index) {
                  <div
                    class="bc-allday-resource bc-allday-resource-week"
                    [attr.data-bc-resource]="group.resourceId"
                    [attr.data-bc-resource-type]="group.resourceType || null"
                    [ngStyle]="{ 'grid-column': (2 + gi * daysPerGroup) + ' / span ' + daysPerGroup, 'grid-row': 1 }"
                  >
                    <div
                      class="bc-allday-resource-slots"
                      [ngStyle]="{ 'grid-template-columns': 'repeat(' + daysPerGroup + ', minmax(0, 1fr))' }"
                    >
                      @for (column of group.columns; track column.key; let di = $index) {
                        <div
                          [class]="column.isToday ? 'bc-allday-slot bc-today' : 'bc-allday-slot'"
                          [attr.data-date]="column.day"
                          [attr.data-bc-allday]="column.day"
                          [attr.data-slot-index]="di"
                        ></div>
                      }
                    </div>
                    <div class="bc-allday-resource-segments" data-bc-allday-segments="">
                      @for (segment of group.allDay.segments; track segment.key) {
                        <button
                          type="button"
                          class="bc-segment"
                          [class.bc-event-draggable]="state.isDraggable(segment.event)"
                          [ngStyle]="{
                            'grid-column': segment.left + ' / span ' + segment.span,
                            'grid-row': segment.row
                          }"
                          [attr.data-bc-event]="state.getEventId(segment.event)"
                          [attr.aria-selected]="state.isEventSelected(segment.event)"
                          (click)="state.handleEventClick(segment.event, $event)"
                          (dblclick)="state.handleEventDblClick(segment.event, $event)"
                          (keydown)="state.handleEventKeyDown(segment.event, $event)"
                          (contextmenu)="state.handleEventContextMenu(segment.event, $event)"
                          (auxclick)="state.handleEventAuxClick(segment.event, $event)"
                          (pointerdown)="$event.stopPropagation()"
                        >
                          @if (bcTimeAllDayEvent) {
                            <ng-template
                              [ngTemplateOutlet]="bcTimeAllDayEvent"
                              [ngTemplateOutletContext]="{ $implicit: { event: segment.event, title: segment.title } }"
                            />
                          } @else {
                            <span class="bc-event-title">{{ segment.title }}</span>
                          }
                        </button>
                      }
                    </div>
                  </div>
                }
              } @else {
                @for (group of grid.resources; track group.key) {
                  <div
                    [class]="group.columns[0]?.isToday ? 'bc-allday-resource bc-today' : 'bc-allday-resource'"
                    [attr.data-bc-resource]="group.resourceId"
                    [attr.data-bc-resource-type]="group.resourceType || null"
                  >
                    <div
                      [class]="group.columns[0]?.isToday ? 'bc-allday-slot bc-today' : 'bc-allday-slot'"
                      [attr.data-date]="group.columns[0]?.day"
                      [attr.data-bc-allday]="group.columns[0]?.day"
                      data-slot-index="0"
                    ></div>
                    <div class="bc-allday-resource-stack" data-bc-allday-segments="">
                      @for (segment of group.allDay.segments; track segment.key) {
                        <button
                          type="button"
                          class="bc-segment bc-segment-stacked"
                          [class.bc-event-draggable]="state.isDraggable(segment.event)"
                          [attr.data-bc-event]="state.getEventId(segment.event)"
                          [attr.aria-selected]="state.isEventSelected(segment.event)"
                          (click)="state.handleEventClick(segment.event, $event)"
                          (dblclick)="state.handleEventDblClick(segment.event, $event)"
                          (keydown)="state.handleEventKeyDown(segment.event, $event)"
                          (contextmenu)="state.handleEventContextMenu(segment.event, $event)"
                          (auxclick)="state.handleEventAuxClick(segment.event, $event)"
                          (pointerdown)="$event.stopPropagation()"
                        >
                          @if (bcTimeAllDayEvent) {
                            <ng-template
                              [ngTemplateOutlet]="bcTimeAllDayEvent"
                              [ngTemplateOutletContext]="{ $implicit: { event: segment.event, title: segment.title } }"
                            />
                          } @else {
                            <span class="bc-event-title">{{ segment.title }}</span>
                          }
                        </button>
                      }
                    </div>
                  </div>
                }
              }
            </div>
          </div>

          <div #timeBody class="bc-time-body" (pointerdown)="state.onSlotsPointerDown($event)">
            <div class="bc-time-gutter">
              @for (label of grid.gutter; track label.key) {
                <div class="bc-time-label">{{ label.label }}</div>
              }
            </div>
            @for (group of grid.resources; track group.key) {
              @for (column of group.columns; track column.key; let colIndex = $index) {
                <div
                  class="bc-day-column"
                  [class.bc-today]="column.isToday"
                  [attr.data-bc-resource]="group.resourceId"
                  [attr.data-bc-resource-type]="group.resourceType || null"
                >
                  <div class="bc-time-slots">
                    @for (slot of column.slots; track $index; let slotIndex = $index) {
                      <div
                        class="bc-time-slot"
                        [attr.data-date]="column.day"
                        [attr.data-slot-index]="colIndex * grid.slotCount + slotIndex"
                        [attr.data-bc-instant]="slot"
                        [attr.data-bc-resource]="group.resourceId"
                      ></div>
                    }
                  </div>
                  @for (event of column.events; track event.key) {
                    <button
                      type="button"
                      class="bc-event"
                      [class.bc-event-draggable]="state.isDraggable(event.event)"
                      [ngStyle]="{
                        top: event.top * 100 + '%',
                        height: event.height * 100 + '%',
                        left: event.left * 100 + '%',
                        width: event.width * 100 + '%'
                      }"
                      [attr.data-bc-event]="state.getEventId(event.event)"
                      [attr.aria-selected]="state.isEventSelected(event.event)"
                      (click)="state.handleEventClick(event.event, $event)"
                      (dblclick)="state.handleEventDblClick(event.event, $event)"
                      (keydown)="state.handleEventKeyDown(event.event, $event)"
                      (contextmenu)="state.handleEventContextMenu(event.event, $event)"
                      (auxclick)="state.handleEventAuxClick(event.event, $event)"
                      (pointerdown)="$event.stopPropagation()"
                    >
                      @if (bcTimeEvent) {
                        <ng-template
                          [ngTemplateOutlet]="bcTimeEvent"
                          [ngTemplateOutletContext]="{ $implicit: event }"
                        />
                      } @else {
                        <span class="bc-event-title">{{ event.title }}</span>
                      }
                      @if (state.isResizable(event.event)) {
                        <div class="bc-resize-handle bc-resize-handle-start" data-bc-resize="start"></div>
                        <div class="bc-resize-handle bc-resize-handle-end" data-bc-resize="end"></div>
                      }
                    </button>
                  }
                  @let selStyle = state.getResourceSelectionStyle(group.resourceId, column.day);
                  @if (selStyle !== null) {
                    <div class="bc-selection" [ngStyle]="selStyle"></div>
                  }
                  @let prevStyle = state.getPreviewStyle(column);
                  @if (prevStyle !== null) {
                    <div class="bc-drag-preview" [ngStyle]="prevStyle"></div>
                  }
                </div>
              }
            }
            @if (state.bodyNowTop() !== null) {
              <div
                class="bc-now-indicator"
                [ngStyle]="{ '--bc-now-top': state.bodyNowTop() }"
              ></div>
            }
          </div>
        }

        <!-- ── Day-major resource layout ─────────────────────────── -->
        @if (grid.dayGroups !== null) {
          @let numResources = grid.dayGroups[0]?.cells?.length ?? 0;
          <div class="bc-time-head">
            <div class="bc-time-header bc-time-header-tiered">
              <div class="bc-time-header-gutter" aria-hidden="true" style="grid-row: 1 / 3"></div>
              @for (dayGroup of grid.dayGroups; track dayGroup.key; let di = $index) {
                <div
                  class="bc-header bc-day-major-header"
                  role="columnheader"
                  [class.bc-today]="dayGroup.isToday"
                  [ngStyle]="{ 'grid-column': (2 + di * numResources) + ' / span ' + numResources, 'grid-row': 1 }"
                >{{ dayGroup.label }}</div>
                @for (cell of dayGroup.cells; track cell.key; let ri = $index) {
                  <div
                    class="bc-resource-day-head"
                    [ngStyle]="{ 'grid-column': 2 + di * numResources + ri, 'grid-row': 2 }"
                  >
                    <span class="bc-resource-header-label">{{ cell.resourceTitle }}</span>
                  </div>
                }
              }
            </div>
            <div class="bc-allday-row" (pointerdown)="state.onAllDayPointerDown($event)">
              <div class="bc-allday-label">{{ state.allDayLabel }}</div>
              @for (dayGroup of grid.dayGroups; track dayGroup.key; let di = $index) {
                @for (cell of dayGroup.cells; track cell.key) {
                  <div
                    class="bc-allday-resource"
                    [class.bc-today]="dayGroup.isToday"
                    [attr.data-bc-resource]="cell.resourceId"
                    [attr.data-bc-resource-type]="cell.resourceType || null"
                  >
                    <div
                      class="bc-allday-slot"
                      [class.bc-today]="dayGroup.isToday"
                      [attr.data-date]="dayGroup.date"
                      [attr.data-bc-allday]="dayGroup.date"
                      [attr.data-slot-index]="di"
                    ></div>
                    <div class="bc-allday-resource-stack" data-bc-allday-segments="">
                      @for (segment of cell.allDay.segments; track segment.key) {
                        <button
                          type="button"
                          class="bc-segment bc-segment-stacked"
                          [class.bc-event-draggable]="state.isDraggable(segment.event)"
                          [attr.data-bc-event]="state.getEventId(segment.event)"
                          [attr.aria-selected]="state.isEventSelected(segment.event)"
                          (click)="state.handleEventClick(segment.event, $event)"
                          (dblclick)="state.handleEventDblClick(segment.event, $event)"
                          (keydown)="state.handleEventKeyDown(segment.event, $event)"
                          (contextmenu)="state.handleEventContextMenu(segment.event, $event)"
                          (auxclick)="state.handleEventAuxClick(segment.event, $event)"
                          (pointerdown)="$event.stopPropagation()"
                        >
                          @if (bcTimeAllDayEvent) {
                            <ng-template
                              [ngTemplateOutlet]="bcTimeAllDayEvent"
                              [ngTemplateOutletContext]="{ $implicit: { event: segment.event, title: segment.title } }"
                            />
                          } @else {
                            <span class="bc-event-title">{{ segment.title }}</span>
                          }
                        </button>
                      }
                    </div>
                  </div>
                }
              }
            </div>
          </div>
          <div #timeBody class="bc-time-body" (pointerdown)="state.onSlotsPointerDown($event)">
            <div class="bc-time-gutter">
              @for (label of grid.gutter; track label.key) {
                <div class="bc-time-label">{{ label.label }}</div>
              }
            </div>
            @for (dayGroup of grid.dayGroups; track dayGroup.key) {
              @for (cell of dayGroup.cells; track cell.key; let colIndex = $index) {
                <div class="bc-day-column" [class.bc-today]="cell.column.isToday" [attr.data-bc-resource-type]="cell.resourceType || null">
                  <div class="bc-time-slots">
                    @for (slot of cell.column.slots; track $index; let slotIndex = $index) {
                      <div
                        class="bc-time-slot"
                        [attr.data-date]="cell.column.day"
                        [attr.data-slot-index]="colIndex * grid.slotCount + slotIndex"
                        [attr.data-bc-instant]="slot"
                        [attr.data-bc-resource]="cell.resourceId"
                      ></div>
                    }
                  </div>
                  @for (event of cell.column.events; track event.key) {
                    <button
                      type="button"
                      class="bc-event"
                      [class.bc-event-draggable]="state.isDraggable(event.event)"
                      [ngStyle]="{
                        top: event.top * 100 + '%',
                        height: event.height * 100 + '%',
                        left: event.left * 100 + '%',
                        width: event.width * 100 + '%'
                      }"
                      [attr.data-bc-event]="state.getEventId(event.event)"
                      [attr.aria-selected]="state.isEventSelected(event.event)"
                      (click)="state.handleEventClick(event.event, $event)"
                      (dblclick)="state.handleEventDblClick(event.event, $event)"
                      (keydown)="state.handleEventKeyDown(event.event, $event)"
                      (contextmenu)="state.handleEventContextMenu(event.event, $event)"
                      (auxclick)="state.handleEventAuxClick(event.event, $event)"
                      (pointerdown)="$event.stopPropagation()"
                    >
                      @if (bcTimeEvent) {
                        <ng-template
                          [ngTemplateOutlet]="bcTimeEvent"
                          [ngTemplateOutletContext]="{ $implicit: event }"
                        />
                      } @else {
                        <span class="bc-event-title">{{ event.title }}</span>
                      }
                      @if (state.isResizable(event.event)) {
                        <div class="bc-resize-handle bc-resize-handle-start" data-bc-resize="start"></div>
                        <div class="bc-resize-handle bc-resize-handle-end" data-bc-resize="end"></div>
                      }
                    </button>
                  }
                  @let selStyle = state.getResourceSelectionStyle(cell.resourceId, cell.column.day);
                  @if (selStyle !== null) {
                    <div class="bc-selection" [ngStyle]="selStyle"></div>
                  }
                  @let prevStyle = state.getPreviewStyle(cell.column);
                  @if (prevStyle !== null) {
                    <div class="bc-drag-preview" [ngStyle]="prevStyle"></div>
                  }
                </div>
              }
            }
            @if (state.bodyNowTop() !== null) {
              <div
                class="bc-now-indicator"
                [ngStyle]="{ '--bc-now-top': state.bodyNowTop() }"
              ></div>
            }
          </div>
        }
      </div>
    }
  `,
})
export class TimeGridViewComponent<TEvent = unknown> {
  @ViewChild('timeBody') private timeBodyRef?: ElementRef<HTMLElement>

  /** Custom day-column header template. Context: `{ $implicit: TimeDayHeading }`. */
  @Input() bcTimeDayHeading?: TemplateRef<{ $implicit: TimeDayHeading }>
  /** Custom gutter time-label template. Context: `{ $implicit: TimeGutterLabel }`. */
  @Input() bcTimeGutterLabel?: TemplateRef<{ $implicit: TimeGutterLabel }>
  /** Custom timed event template. Context: `{ $implicit: TimePositionedEvent }`. */
  @Input() bcTimeEvent?: TemplateRef<{ $implicit: TimePositionedEvent<TEvent> }>
  /** Custom all-day event template. Context: `{ $implicit: { event: TEvent, title: string } }`. */
  @Input() bcTimeAllDayEvent?: TemplateRef<{ $implicit: { event: TEvent; title: string } }>

  readonly state = injectTimeGridView<TEvent>()

  constructor() {
    const cal = injectCalendar()
    let scrolled = false

    afterNextRender(() => {
      if (scrolled) return
      const bodyEl = this.timeBodyRef?.nativeElement
      if (!bodyEl) return
      const colEl = bodyEl.querySelector<HTMLElement>('.bc-day-column')
      if (!colEl || colEl.offsetHeight === 0) return
      const store = cal.storeSignal()
      if (!store) return
      const grid = this.state.grid()
      if (!grid) return

      const firstCol =
        grid.columns[0] ??
        grid.resources?.[0]?.columns[0] ??
        grid.dayGroups?.[0]?.cells[0]?.column
      if (!firstCol) return

      const colHeight = colEl.offsetHeight
      const { localizer, scrollToTime, getNow } = store
      const dayStartMin = localizer.getMinutesFromMidnight(firstCol.min)
      const totalMin = localizer.getTotalMin({ start: firstCol.min, end: firstCol.max })
      if (totalMin === 0) return

      const targetMin =
        scrollToTime != null
          ? scrollToTime.hour * 60 + (scrollToTime.minute ?? 0)
          : localizer.getMinutesFromMidnight(getNow())

      const fraction = Math.max(0, Math.min(1, (targetMin - dayStartMin) / totalMin))
      bodyEl.scrollTo({ top: Math.round(fraction * colHeight), behavior: 'instant' })
      scrolled = true
    })
  }

  leafColumnCount(): number {
    const g = this.state.grid()
    if (!g) return 1
    if (g.dayGroups !== null) return g.dayGroups.reduce((n, dg) => n + dg.cells.length, 0)
    if (g.resources !== null) return g.resources.reduce((n, r) => n + r.columns.length, 0)
    return g.columns.length
  }
}
