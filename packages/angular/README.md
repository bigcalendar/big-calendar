# @big-calendar/angular

The Angular adapter for Big Calendar. Install this package to add a fully interactive event calendar — with month, week, work-week, day, and agenda views — to any Angular 17+ application.

---

## Requirements

- Angular 17 or later

---

## Installation

```bash
yarn add @big-calendar/angular @big-calendar/localizer-temporal @big-calendar/styles
```

For drag-and-drop support, also install the optional DnD package:

```bash
yarn add @big-calendar/dnd
```

---

## Basic usage

```ts
// app.component.ts
import { Component } from '@angular/core'
import { CalendarProviderComponent, MonthViewComponent } from '@big-calendar/angular'
import { createTemporalLocalizer, LocalizerContract } from '@big-calendar/localizer-temporal'
import '@big-calendar/styles/index.css'

// createTemporalLocalizer is async — call it once at module level
const localizer = await createTemporalLocalizer({ locale: 'en-US', timeZone: 'UTC' })

@Component({
  standalone: true,
  selector: 'app-root',
  imports: [CalendarProviderComponent, MonthViewComponent],
  template: `
    <div style="height: 600px">
      <bc-calendar-provider [localizer]="localizer" [events]="events" defaultView="month">
        <bc-month-view></bc-month-view>
      </bc-calendar-provider>
    </div>
  `,
})
export class AppComponent {
  localizer: LocalizerContract = localizer
  events = [
    {
      id: '1',
      title: 'Team standup',
      start: '2026-06-15T09:00:00Z',
      end: '2026-06-15T09:30:00Z',
    },
  ]
}
```

> **Height required.** The calendar fills its container. Give the outer `<div>` an explicit height.

---

## How it works

Big Calendar separates **state** from **rendering**. `CalendarProviderComponent` owns all the calendar state (which view is active, the focus date, the event list). It shares that state via Angular's dependency injection. The view components and inject composables inside it read from that shared state automatically — no prop drilling needed.

```html
<!-- CalendarProvider: owns the state -->
<bc-calendar-provider [localizer]="localizer" [events]="events">
  <!-- Your own toolbar component goes here -->
  <app-my-toolbar></app-my-toolbar>
  <!-- One (or more) view components render the grid -->
  <bc-time-grid-view></bc-time-grid-view>
</bc-calendar-provider>
```

---

## Localizers

A localizer handles all date formatting and arithmetic. Pick one based on what your project already uses.

### Temporal (recommended for new projects)

Uses the browser's built-in Temporal API. No extra dependency beyond the adapter package.

```bash
yarn add @big-calendar/localizer-temporal
```

```ts
import { createTemporalLocalizer } from '@big-calendar/localizer-temporal'
const localizer = await createTemporalLocalizer({ locale: 'en-US', timeZone: 'America/New_York' })
```

### Luxon (for projects already using Luxon)

```bash
yarn add @big-calendar/localizer-luxon luxon
```

```ts
import { createLuxonLocalizer } from '@big-calendar/localizer-luxon'
const localizer = await createLuxonLocalizer({ locale: 'en-US', timeZone: 'America/New_York' })
```

---

## Slot selection

Let users click or drag on empty time to create new events:

```ts
@Component({
  standalone: true,
  imports: [CalendarProviderComponent, TimeGridViewComponent],
  template: `
    <bc-calendar-provider
      [selectable]="true"
      (slotSelect)="handleSlotSelect($event)"
      [localizer]="localizer"
      [events]="events"
    >
      <bc-time-grid-view></bc-time-grid-view>
    </bc-calendar-provider>
  `,
})
export class MyCalendarComponent {
  handleSlotSelect({ start, end, allDay }: SlotSelectResult) {
    console.log('Selected:', start, '→', end)
    // Open a create-event modal here
  }
}
```

---

## Drag and drop

Requires `@big-calendar/dnd`. Apply the `calendarDnd` directive to a wrapper `<div>` inside `<bc-calendar-provider>`:

```ts
import { CalendarProviderComponent, TimeGridViewComponent, CalendarDndDirective } from '@big-calendar/angular'
import { signal } from '@angular/core'
import '@big-calendar/dnd'

@Component({
  standalone: true,
  imports: [CalendarProviderComponent, TimeGridViewComponent, CalendarDndDirective],
  template: `
    <bc-calendar-provider
      [localizer]="localizer"
      [events]="events()"
      (eventDrop)="handleEventDrop($event)"
    >
      <div calendarDnd>
        <bc-time-grid-view></bc-time-grid-view>
      </div>
    </bc-calendar-provider>
  `,
})
export class MyCalendarComponent {
  readonly events = signal(initialEvents)

  handleEventDrop({ event, start, end }: EventDropResult) {
    this.events.update((prev) =>
      prev.map((e) => (e.id === event.id ? { ...e, start, end } : e))
    )
  }
}
```

Mark individual events as draggable and resizable via the `draggable` and `resizable` fields (or override via `accessors`).

---

## Custom event templates

Replace the default event block with your own `ng-template`. Use `@ViewChild` to reference the template after view initialisation:

```ts
import { Component, TemplateRef, ViewChild } from '@angular/core'
import { CalendarProviderComponent, MonthViewComponent, BcMonthEventDirective } from '@big-calendar/angular'

@Component({
  standalone: true,
  imports: [CalendarProviderComponent, MonthViewComponent, BcMonthEventDirective],
  template: `
    <bc-calendar-provider [localizer]="localizer" [events]="events" defaultView="month">
      <bc-month-view [bcMonthEvent]="myEventTpl"></bc-month-view>
    </bc-calendar-provider>

    <ng-template #myEventTpl let-event>
      <span class="my-event">{{ event.title }}</span>
    </ng-template>
  `,
})
export class MyCalendarComponent {
  @ViewChild('myEventTpl') myEventTpl!: TemplateRef<any>
  localizer = localizer
  events = myEvents
}
```

---

## Packages

| Package | Purpose |
|---|---|
| `@big-calendar/angular` | Angular components and inject composables (this package) |
| `@big-calendar/core` | Shared engine — store, view models, layout, selection FSM |
| `@big-calendar/dnd` | Optional drag-and-drop engine |
| `@big-calendar/styles` | CSS custom-property design tokens |
| `@big-calendar/localizer-temporal` | Temporal-backed localizer (recommended) |
| `@big-calendar/localizer-luxon` | Luxon-backed localizer |
| `@big-calendar/mcp` | MCP server for AI-assisted calendar development |
