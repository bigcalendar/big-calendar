export const URI = 'bc://recipes/basic-setup-lit'

export const CONTENT = `# Recipe: Basic Calendar Setup (Lit)

A minimal working Big Calendar integration using Lit web components.

## Prerequisites

\`\`\`bash
yarn add @big-calendar/lit @big-calendar/localizer-temporal @big-calendar/styles lit @lit/context
\`\`\`

> **Luxon user?** If your project already depends on Luxon, use \`@big-calendar/localizer-luxon\`
> and \`luxon\` instead. The TemporalLocalizer is preferred for new projects because it uses
> the browser's built-in Temporal API with no extra dependency.

## Step 1 — Import the styles

In your app entry point:

\`\`\`typescript
import '@big-calendar/styles/index.css'
\`\`\`

## Step 2 — Import the elements

Import the custom elements to register them. You only need to import the ones you use:

\`\`\`typescript
import '@big-calendar/lit' // registers all bc-* elements
// or individually:
// import '@big-calendar/lit/CalendarElement'
// import '@big-calendar/lit/MonthViewElement'
\`\`\`

## Step 3 — Use in HTML or a Lit component

### Plain HTML usage

\`\`\`html
<div style="height: 600px">
  <bc-calendar id="my-calendar">
    <bc-default-toolbar></bc-default-toolbar>
    <bc-month-view></bc-month-view>
    <bc-time-grid-view></bc-time-grid-view>
    <bc-agenda-view></bc-agenda-view>
  </bc-calendar>
</div>

<script type="module">
  import '@big-calendar/lit'
  import { createTemporalLocalizer } from '@big-calendar/localizer-temporal'

  const localizer = await createTemporalLocalizer({ locale: 'en-US', timeZone: 'UTC' })
  const calendar = document.getElementById('my-calendar')
  calendar.localizer = localizer
  calendar.events = [
    {
      id: '1',
      title: 'Team Standup',
      start: '2026-06-25T09:00:00',
      end: '2026-06-25T09:30:00',
    },
  ]
  calendar.defaultDate = '2026-06-25'
</script>
\`\`\`

### Inside a Lit component

\`\`\`typescript
import { LitElement, html } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { createTemporalLocalizer } from '@big-calendar/localizer-temporal'
import type { LocalizerContract } from '@big-calendar/localizer'
import '@big-calendar/lit'

@customElement('my-calendar-app')
export class MyCalendarApp extends LitElement {
  override createRenderRoot() { return this } // light DOM

  @state() private _localizer: LocalizerContract | null = null

  override async connectedCallback() {
    super.connectedCallback()
    this._localizer = await createTemporalLocalizer({ locale: 'en-US', timeZone: 'UTC' })
  }

  override render() {
    if (!this._localizer) return html\`<p>Loading…</p>\`
    return html\`
      <bc-calendar
        .localizer=\${this._localizer}
        .events=\${this._events}
        .defaultDate=\${'2026-06-25'}
      >
        <bc-default-toolbar></bc-default-toolbar>
        <bc-month-view></bc-month-view>
        <bc-time-grid-view></bc-time-grid-view>
        <bc-agenda-view></bc-agenda-view>
      </bc-calendar>
    \`
  }

  private _events = [
    { id: '1', title: 'Team Standup', start: '2026-06-25T09:00:00', end: '2026-06-25T09:30:00' },
  ]
}
\`\`\`

## Step 4 — Add a localizer with time zone (optional)

\`\`\`typescript
const localizer = await createTemporalLocalizer({ locale: 'en-US', timeZone: 'America/New_York' })
\`\`\`

## Lit-specific notes

- **Light DOM** — All \`@big-calendar/lit\` elements use light DOM (\`createRenderRoot() { return this }\`).
  The shared \`@big-calendar/styles/index.css\` stylesheet applies directly without Shadow DOM
  piercing. Import the stylesheet once in your entry point.
- **Property binding** — Use \`.prop=\${value}\` syntax in Lit templates (or set properties
  imperatively with \`element.prop = value\`) to pass objects and functions. HTML attribute
  binding (\`attr="string"\`) only works for primitive string values.
- **Context** — \`bc-calendar\` provides a \`@lit/context\` context that all child view elements
  (\`bc-month-view\`, \`bc-time-grid-view\`, etc.) consume automatically. Keep them as descendants
  of \`bc-calendar\` — no extra wiring required.
- **Reactive controllers** — \`CalendarController\` and \`CalendarDndController\` are Lit
  \`ReactiveController\` implementations you can compose into your own custom elements if you
  need a fully headless setup.

## Next steps

- Add \`.selectable=\${true}\` and an \`onSlotSelect\` property callback to let users create events
- Import \`CalendarDndController\` from \`@big-calendar/lit\` and install \`@big-calendar/dnd\` to
  enable drag-and-drop
- Pass \`.onEventClick=\${handler}\` to open an edit panel when a user clicks an existing event
- Pass \`.onRangeChange=\${handler}\` to fetch events from your API as the user navigates
`
