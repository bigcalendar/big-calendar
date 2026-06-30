/**
 * Each story here replaces one default slot component with a custom `ng-template`.
 * The goal is to show exactly what data each slot receives and how little
 * code it takes to completely change how that part of the calendar looks.
 *
 * In Angular, custom slot components are `ng-template` inputs on the view
 * components (`bc-month-view`, `bc-time-grid-view`, `bc-agenda-view`). Each
 * template receives its context via the `$implicit` variable — destructure it
 * with `let-ctx` or `let-data` in the template tag.
 *
 * Use `bc-month-view` / `bc-time-grid-view` / `bc-agenda-view` directly instead
 * of `bc-calendar` when you need to pass slot templates, since `bc-calendar`
 * dispatches the correct view automatically but does not expose individual slots.
 *
 * All stories use the shared demo events from `harness.ts`.
 */
import { Component, TemplateRef, ViewChild } from '@angular/core'
import type { Meta, StoryObj } from '@storybook/angular'
import { CalendarProviderComponent } from '../src/CalendarProvider/CalendarProviderComponent'
import { MonthViewComponent } from '../src/MonthViewComponent/MonthViewComponent'
import { TimeGridViewComponent } from '../src/TimeGridViewComponent/TimeGridViewComponent'
import { AgendaViewComponent } from '../src/AgendaViewComponent/AgendaViewComponent'
import { BcPopoverComponent, BcPopoverTriggerDirective } from '@big-calendar/angular'
import { demoEvents, FOCUS, localizer, NOW } from './harness'

const meta: Meta = {
  title: 'Calendar/Custom Rendering',
}
export default meta

// ─── Month view ───────────────────────────────────────────────────────────────

@Component({
  selector: 'story-month-weekday',
  standalone: true,
  imports: [CalendarProviderComponent, MonthViewComponent],
  template: `
    <div style="block-size: 100dvh; inline-size: 100%">
      <bc-calendar-provider [localizer]="loc" [events]="events" [defaultDate]="FOCUS" [getNow]="getNow" defaultView="month">
        <div class="bc-calendar">
          <bc-month-view [bcMonthWeekday]="boldWeekday" />
        </div>
      </bc-calendar-provider>
    </div>
    <ng-template #boldWeekday let-ctx>
      <div style="text-transform:uppercase;letter-spacing:0.08em;font-weight:700;background-color:rebeccapurple;color:white;padding:0.25em 0;text-align:center;">
        {{ ctx.long }}
      </div>
    </ng-template>
  `,
})
class MonthWeekdayComponent {
  readonly loc = localizer
  readonly events = demoEvents
  readonly FOCUS = FOCUS
  readonly getNow = () => NOW
  @ViewChild('boldWeekday') boldWeekday!: TemplateRef<unknown>
}

/** Replace `bcMonthWeekday` with a custom column heading that renders the full
 * weekday name in uppercase purple. */
export const MonthWeekday = {
  name: 'Custom Month Weekday',
  render: () => ({
    template: '<story-month-weekday></story-month-weekday>',
    moduleMetadata: { imports: [MonthWeekdayComponent] },
  }),
}

// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'story-month-datecell',
  standalone: true,
  imports: [CalendarProviderComponent, MonthViewComponent],
  template: `
    <div style="block-size: 100dvh; inline-size: 100%">
      <bc-calendar-provider [localizer]="loc" [events]="events" [defaultDate]="FOCUS" [getNow]="getNow" defaultView="month">
        <div class="bc-calendar">
          <bc-month-view [bcMonthDateCell]="highlightedCell" />
        </div>
      </bc-calendar-provider>
    </div>
    <ng-template #highlightedCell let-ctx let-onDrillDown="onDrillDown">
      <div
        class="bc-date-cell"
        [class.bc-today]="ctx.isToday"
        [class.bc-off-range]="ctx.isOffRange"
      >
        <button
          type="button"
          (click)="onDrillDown()"
          [style.background]="ctx.isToday ? 'rebeccapurple' : 'none'"
          [style.color]="ctx.isToday ? 'white' : ctx.isOffRange ? '#aaa' : 'inherit'"
          style="border:none;border-radius:50%;width:2em;height:2em;cursor:pointer"
          [style.fontWeight]="ctx.isToday ? 700 : 400"
        >{{ ctx.label }}</button>
      </div>
    </ng-template>
  `,
})
class MonthDateCellComponent {
  readonly loc = localizer
  readonly events = demoEvents
  readonly FOCUS = FOCUS
  readonly getNow = () => NOW
  @ViewChild('highlightedCell') highlightedCell!: TemplateRef<unknown>
}

/** Replace `bcMonthDateCell` to give today a filled circle treatment.
 * Click any date to drill down into the day view. */
export const MonthDateCell = {
  name: 'Custom Month Date Cell',
  render: () => ({
    template: '<story-month-datecell></story-month-datecell>',
    moduleMetadata: { imports: [MonthDateCellComponent] },
  }),
}

// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'story-month-event',
  standalone: true,
  imports: [CalendarProviderComponent, MonthViewComponent],
  template: `
    <div style="block-size: 100dvh; inline-size: 100%">
      <bc-calendar-provider [localizer]="loc" [events]="events" [defaultDate]="FOCUS" [getNow]="getNow" defaultView="month">
        <div class="bc-calendar">
          <bc-month-view [bcMonthEvent]="pillEvent" />
        </div>
      </bc-calendar-provider>
    </div>
    <ng-template #pillEvent let-ctx>
      <span style="display:flex;align-items:center;gap:0.35em;font-style:italic">
        <span style="display:inline-block;width:0.5em;height:0.5em;border-radius:50%;background:currentColor;flex-shrink:0"></span>
        {{ ctx.title }}
      </span>
    </ng-template>
  `,
})
class MonthEventComponent {
  readonly loc = localizer
  readonly events = demoEvents
  readonly FOCUS = FOCUS
  readonly getNow = () => NOW
  @ViewChild('pillEvent') pillEvent!: TemplateRef<unknown>
}

/** Replace `bcMonthEvent` to render a small dot before each event title. */
export const MonthEvent = {
  name: 'Custom Month Event',
  render: () => ({
    template: '<story-month-event></story-month-event>',
    moduleMetadata: { imports: [MonthEventComponent] },
  }),
}

// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'story-month-showmore',
  standalone: true,
  imports: [CalendarProviderComponent, MonthViewComponent, BcPopoverComponent, BcPopoverTriggerDirective],
  template: `
    <div style="block-size: 100dvh; inline-size: 100%">
      <bc-calendar-provider [localizer]="loc" [events]="events" [defaultDate]="FOCUS" [getNow]="getNow" defaultView="month">
        <div class="bc-calendar">
          <bc-month-view [bcMonthShowMore]="minimalShowMore" />
        </div>
      </bc-calendar-provider>
    </div>
    <ng-template #minimalShowMore let-ctx>
      <bc-popover placement="bottom-start" [sameWidth]="true" className="bc-popover bc-show-more-popover">
        <button
          type="button"
          bcPopoverTrigger
          style="display:flex;align-items:center;justify-content:flex-end;inline-size:100%;block-size:100%;font-size:0.75em;color:rebeccapurple;text-decoration:underline;cursor:pointer;padding-inline:3px;background:none;border:none;font:inherit"
        >{{ ctx.count }} more &rsaquo;</button>
        @for (item of ctx.events; track item.key) {
          <div class="bc-segment" style="position:static;display:block;margin:2px 0">
            <span class="bc-event-title">{{ item.title }}</span>
          </div>
        }
      </bc-popover>
    </ng-template>
  `,
})
class MonthShowMoreComponent {
  readonly loc = localizer
  readonly events = demoEvents
  readonly FOCUS = FOCUS
  readonly getNow = () => NOW
  @ViewChild('minimalShowMore') minimalShowMore!: TemplateRef<unknown>
}

/** Replace `bcMonthShowMore` with a custom trigger that opens a popover listing
 * overflow events as plain segments. Overflow is determined by auto-measurement
 * of available cell height. */
export const MonthShowMore = {
  name: 'Custom Month Show More',
  render: () => ({
    template: '<story-month-showmore></story-month-showmore>',
    moduleMetadata: { imports: [MonthShowMoreComponent] },
  }),
}

// ─── Time grid view ──────────────────────────────────────────────────────────

@Component({
  selector: 'story-time-dayheading',
  standalone: true,
  imports: [CalendarProviderComponent, TimeGridViewComponent],
  template: `
    <div style="block-size: 100dvh; inline-size: 100%">
      <bc-calendar-provider [localizer]="loc" [events]="events" [defaultDate]="FOCUS" [getNow]="getNow" defaultView="week">
        <div class="bc-calendar">
          <bc-time-grid-view [bcTimeDayHeading]="accentedHeading" />
        </div>
      </bc-calendar-provider>
    </div>
    <ng-template #accentedHeading let-ctx>
      <button
        type="button"
        (click)="ctx.onDrillDown()"
        [style.background]="ctx.isToday ? 'rebeccapurple' : 'transparent'"
        [style.color]="ctx.isToday ? 'white' : 'inherit'"
        style="border:none;border-radius:0.25em;padding:0.2em 0.6em;cursor:pointer;width:100%"
        [style.fontWeight]="ctx.isToday ? 700 : 400"
      >{{ ctx.label }}</button>
    </ng-template>
  `,
})
class TimeDayHeadingComponent {
  readonly loc = localizer
  readonly events = demoEvents
  readonly FOCUS = FOCUS
  readonly getNow = () => NOW
  @ViewChild('accentedHeading') accentedHeading!: TemplateRef<unknown>
}

/** Replace `bcTimeDayHeading` to highlight today's column with a filled purple
 * background. Click a heading to drill into the day view. */
export const TimeDayHeading = {
  name: 'Custom Time Day Heading',
  render: () => ({
    template: '<story-time-dayheading></story-time-dayheading>',
    moduleMetadata: { imports: [TimeDayHeadingComponent] },
  }),
}

// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'story-time-label',
  standalone: true,
  imports: [CalendarProviderComponent, TimeGridViewComponent],
  template: `
    <div style="block-size: 100dvh; inline-size: 100%">
      <bc-calendar-provider [localizer]="loc" [events]="events" [defaultDate]="FOCUS" [getNow]="getNow" defaultView="week">
        <div class="bc-calendar">
          <bc-time-grid-view [bcTimeGutterLabel]="italicLabel" />
        </div>
      </bc-calendar-provider>
    </div>
    <ng-template #italicLabel let-ctx>
      <span style="font-style:italic;color:darkcyan;font-size:0.8em">{{ ctx.label }}</span>
    </ng-template>
  `,
})
class TimeLabelComponent {
  readonly loc = localizer
  readonly events = demoEvents
  readonly FOCUS = FOCUS
  readonly getNow = () => NOW
  @ViewChild('italicLabel') italicLabel!: TemplateRef<unknown>
}

/** Replace `bcTimeGutterLabel` to render gutter labels in italic teal. */
export const TimeLabel = {
  name: 'Custom Time Label',
  render: () => ({
    template: '<story-time-label></story-time-label>',
    moduleMetadata: { imports: [TimeLabelComponent] },
  }),
}

// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'story-time-event',
  standalone: true,
  imports: [CalendarProviderComponent, TimeGridViewComponent],
  template: `
    <div style="block-size: 100dvh; inline-size: 100%">
      <bc-calendar-provider [localizer]="loc" [events]="events" [defaultDate]="FOCUS" [getNow]="getNow" defaultView="week">
        <div class="bc-calendar">
          <bc-time-grid-view [bcTimeEvent]="stackedEvent" />
        </div>
      </bc-calendar-provider>
    </div>
    <ng-template #stackedEvent let-ctx>
      <div style="display:flex;flex-direction:column;gap:0.1em;padding:0.1em 0">
        <span style="font-weight:700;font-size:0.85em;line-height:1.2">{{ ctx.title }}</span>
        <span style="font-size:0.7em;opacity:0.75">{{ ctx.time }}</span>
      </div>
    </ng-template>
  `,
})
class TimeEventComponent {
  readonly loc = localizer
  readonly events = demoEvents
  readonly FOCUS = FOCUS
  readonly getNow = () => NOW
  @ViewChild('stackedEvent') stackedEvent!: TemplateRef<unknown>
}

/** Replace `bcTimeEvent` to render the title and time on separate lines inside
 * the event box, with the title bold. */
export const TimeEvent = {
  name: 'Custom Time Event',
  render: () => ({
    template: '<story-time-event></story-time-event>',
    moduleMetadata: { imports: [TimeEventComponent] },
  }),
}

// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'story-time-allday',
  standalone: true,
  imports: [CalendarProviderComponent, TimeGridViewComponent],
  template: `
    <div style="block-size: 100dvh; inline-size: 100%">
      <bc-calendar-provider [localizer]="loc" [events]="events" [defaultDate]="FOCUS" [getNow]="getNow" defaultView="week">
        <div class="bc-calendar">
          <bc-time-grid-view [bcTimeAllDayEvent]="taggedEvent" />
        </div>
      </bc-calendar-provider>
    </div>
    <ng-template #taggedEvent let-ctx>
      <span style="display:flex;align-items:center;gap:0.25em;font-style:italic;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
        <span style="display:inline-block;width:0.4em;height:0.4em;border-radius:50%;background:currentColor;flex-shrink:0"></span>
        {{ ctx.title }}
      </span>
    </ng-template>
  `,
})
class TimeAllDayEventComponent {
  readonly loc = localizer
  readonly events = demoEvents
  readonly FOCUS = FOCUS
  readonly getNow = () => NOW
  @ViewChild('taggedEvent') taggedEvent!: TemplateRef<unknown>
}

/** Replace `bcTimeAllDayEvent` to add a small dot before each all-day event
 * title in the time-grid header strip. */
export const TimeAllDayEvent = {
  name: 'Custom Time All-Day Event',
  render: () => ({
    template: '<story-time-allday></story-time-allday>',
    moduleMetadata: { imports: [TimeAllDayEventComponent] },
  }),
}

// ─── Agenda view ─────────────────────────────────────────────────────────────

@Component({
  selector: 'story-agenda-date',
  standalone: true,
  imports: [CalendarProviderComponent, AgendaViewComponent],
  template: `
    <div style="block-size: 100dvh; inline-size: 100%">
      <bc-calendar-provider [localizer]="loc" [events]="events" [defaultDate]="FOCUS" [getNow]="getNow" defaultView="agenda">
        <div class="bc-calendar">
          <bc-agenda-view [bcAgendaDate]="ruledDate" />
        </div>
      </bc-calendar-provider>
    </div>
    <ng-template #ruledDate let-ctx>
      <div style="font-weight:700;text-transform:uppercase;letter-spacing:0.06em;font-size:0.8em;border-bottom:2px solid rebeccapurple;padding-bottom:0.2em;color:rebeccapurple">
        {{ ctx.label }}
      </div>
    </ng-template>
  `,
})
class AgendaDateComponent {
  readonly loc = localizer
  readonly events = demoEvents
  readonly FOCUS = FOCUS
  readonly getNow = () => NOW
  @ViewChild('ruledDate') ruledDate!: TemplateRef<unknown>
}

/** Replace `bcAgendaDate` to render each day heading in uppercase with an
 * underline accent. */
export const AgendaDate = {
  name: 'Custom Agenda Date',
  render: () => ({
    template: '<story-agenda-date></story-agenda-date>',
    moduleMetadata: { imports: [AgendaDateComponent] },
  }),
}

// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'story-agenda-event',
  standalone: true,
  imports: [CalendarProviderComponent, AgendaViewComponent],
  template: `
    <div style="block-size: 100dvh; inline-size: 100%">
      <bc-calendar-provider [localizer]="loc" [events]="events" [defaultDate]="FOCUS" [getNow]="getNow" defaultView="agenda">
        <div class="bc-calendar">
          <bc-agenda-view [bcAgendaEvent]="twoColEvent" />
        </div>
      </bc-calendar-provider>
    </div>
    <ng-template #twoColEvent let-ctx>
      <div style="display:grid;grid-template-columns:7rem 1fr;gap:0.75rem;align-items:baseline;padding:0.3rem 0">
        <span style="color:gray;font-variant-numeric:tabular-nums;font-size:0.85em">
          {{ ctx.allDay ? 'all day' : ctx.time }}
        </span>
        <strong>{{ ctx.title }}</strong>
      </div>
    </ng-template>
  `,
})
class AgendaEventComponent {
  readonly loc = localizer
  readonly events = demoEvents
  readonly FOCUS = FOCUS
  readonly getNow = () => NOW
  @ViewChild('twoColEvent') twoColEvent!: TemplateRef<unknown>
}

/** Replace `bcAgendaEvent` to render a two-column grid row with the time
 * left-aligned and the title bold on the right. */
export const AgendaEvent = {
  name: 'Custom Agenda Event',
  render: () => ({
    template: '<story-agenda-event></story-agenda-event>',
    moduleMetadata: { imports: [AgendaEventComponent] },
  }),
}

// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'story-agenda-empty',
  standalone: true,
  imports: [CalendarProviderComponent, AgendaViewComponent],
  template: `
    <div style="block-size: 100dvh; inline-size: 100%">
      <bc-calendar-provider [localizer]="loc" [events]="[]" [defaultDate]="FOCUS" [getNow]="getNow" defaultView="agenda">
        <div class="bc-calendar">
          <bc-agenda-view [bcAgendaEmpty]="customEmpty" />
        </div>
      </bc-calendar-provider>
    </div>
    <ng-template #customEmpty let-msg>
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:4rem 2rem;gap:0.75rem;color:#888">
        <div style="font-size:2rem;line-height:1">(  )</div>
        <p style="margin:0;font-size:0.9em">{{ msg }}</p>
      </div>
    </ng-template>
  `,
})
class AgendaEmptyComponent {
  readonly loc = localizer
  readonly FOCUS = FOCUS
  readonly getNow = () => NOW
  @ViewChild('customEmpty') customEmpty!: TemplateRef<unknown>
}

/** Replace `bcAgendaEmpty` to show a custom empty state. An empty `events`
 * array is passed so the empty state is visible immediately. */
export const AgendaEmpty = {
  name: 'Custom Agenda Empty State',
  render: () => ({
    template: '<story-agenda-empty></story-agenda-empty>',
    moduleMetadata: { imports: [AgendaEmptyComponent] },
  }),
}
