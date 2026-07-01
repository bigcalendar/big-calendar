export const URI = 'bc://recipes/basic-setup-angular'

export const CONTENT = `# Recipe: Basic Calendar Setup (Angular)

A minimal working Big Calendar integration in Angular 17+.

## Prerequisites

\`\`\`bash
yarn add @big-calendar/angular @big-calendar/localizer-temporal @big-calendar/styles
\`\`\`

> **Luxon user?** If your project already depends on Luxon, use \`@big-calendar/localizer-luxon\`
> and \`luxon\` instead. The TemporalLocalizer is preferred for new projects because it uses
> the browser's built-in Temporal API with no extra dependency.

## Step 1 — Import the styles

In your app entry point (e.g. \`main.ts\`):

\`\`\`typescript
import '@big-calendar/styles/index.css'
\`\`\`

## Step 2 — Create the component

\`\`\`typescript
// my-calendar.component.ts
import { Component } from '@angular/core'
import { CalendarProviderComponent, MonthViewComponent } from '@big-calendar/angular'
import { createTemporalLocalizer } from '@big-calendar/localizer-temporal'

// Define your event shape
interface CalendarEvent {
  id: string
  title: string
  start: string  // ISO 8601 datetime string
  end: string
}

// createTemporalLocalizer is async — call it once at module level
const localizer = await createTemporalLocalizer()

@Component({
  standalone: true,
  selector: 'app-my-calendar',
  imports: [CalendarProviderComponent, MonthViewComponent],
  template: \`
    <bc-calendar-provider
      [localizer]="localizer"
      [events]="events"
      defaultView="month"
      defaultDate="2026-06-25"
    >
      <bc-month-view></bc-month-view>
    </bc-calendar-provider>
  \`,
})
export class MyCalendarComponent {
  localizer = localizer
  events: CalendarEvent[] = [
    {
      id: '1',
      title: 'Team Standup',
      start: '2026-06-25T09:00:00',
      end: '2026-06-25T09:30:00',
    },
  ]
}
\`\`\`

## Step 3 — Use it in your app

\`\`\`html
<!-- app.component.html -->
<div style="height: 600px">
  <app-my-calendar></app-my-calendar>
</div>
\`\`\`

> **Height required.** The calendar fills its container. Give the container an explicit height.

## Step 4 — Add a localizer with time zone (optional)

Pass a \`timeZone\` to the localizer so the calendar formats and places events in the right
local time. The default is UTC.

\`\`\`typescript
const localizer = await createTemporalLocalizer({ locale: 'en-US', timeZone: 'America/New_York' })
\`\`\`

## Angular-specific notes

- **Standalone components** — All \`@big-calendar/angular\` components are standalone. List them in the \`imports\` array of your component decorator — no NgModule required.
- **\`@ViewChild\` for template slots** — When passing an \`ng-template\` to a slot input (e.g. \`[bcMonthEvent]="myTpl"\`), always use \`@ViewChild\` to reference the template ref. Direct inline binding fails because the template is not yet available at construction time.
- **Reactive events with signals** — Use Angular \`signal<T>()\` for reactive event arrays so Angular's change detection tracks updates automatically.

## Next steps

- Add \`[selectable]="true"\` and a \`(slotSelect)\` handler to let users create events by clicking
- Install \`@big-calendar/dnd\` and add the \`calendarDnd\` directive to enable drag-and-drop
- Bind \`(eventClick)\` to open an edit panel when a user clicks an existing event
- Bind \`(rangeChange)\` to fetch events from your API as the user navigates
`
