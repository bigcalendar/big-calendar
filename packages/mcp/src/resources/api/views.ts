export const URI = 'bc://api/views'

export const CONTENT = `# Views — Built-in Calendar Views

Big Calendar ships five built-in views. Pass a subset to \`enabledViews\` to show
only the ones your app needs. The active view is controlled via the \`view\` prop.

## Built-in view keys

| Key | Display | Description |
|-----|---------|-------------|
| \`'month'\` | Month | Traditional month grid. Events that don't fit collapse into "+N more". |
| \`'week'\` | Week | 7-column time grid. Each day gets a column; multi-day events appear in the all-day row. |
| \`'work_week'\` | Work Week | Same as \`week\` but shows Mon–Fri only. |
| \`'day'\` | Day | Single-day time grid. Used for detail view or resource layouts. |
| \`'agenda'\` | Agenda | Scrollable list of upcoming events across a configurable date range. |

## Controlling views

\`\`\`tsx
<CalendarProvider
  view="month"              // initial view
  enabledViews={['month', 'week', 'day']}  // toolbar options
  onView={({ view }) => {
    // Fired when the user switches views
    saveViewPreference(view)
  }}
>
\`\`\`

## Drilldown

Clicking a date cell in the month view navigates to the day view by default.
Override or disable it:

\`\`\`tsx
// Navigate to week view instead of day
<CalendarProvider drilldownView="week">

// Disable drilldown entirely
<CalendarProvider drilldownView={null}>

// Custom action
<CalendarProvider
  drilldownView={null}
  onDrillDown={({ date, view }) => {
    // Open a custom modal instead
    openDateModal(date)
  }}
>
\`\`\`

## Agenda view options

\`\`\`tsx
<CalendarProvider
  agendaDaysRange={30}    // number of days the agenda spans per page (default: 30)
>
\`\`\`

## Custom views

You can register custom views in the \`viewDefinitions\` prop.
See the Big Calendar docs for the custom-view API.
`
