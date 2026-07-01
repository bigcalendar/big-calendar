# Big Calendar

Big Calendar is a set of components for building event calendar interfaces in your web application — the kind you see in Google Calendar or Outlook. You give it a list of events, and it renders a fully interactive calendar with month, week, day, and agenda views built in.

**Big Calendar is the next generation of [`react-big-calendar`](https://github.com/jquense/react-big-calendar).** It's a ground-up rewrite with a framework-agnostic engine at the center, so the same calendar logic can power UIs in React, Vue, Angular, and more — all from one shared core.

> **Status:** Early development on `feat/initial`. Not yet published to npm.

---

## How it's organized

Big Calendar is a monorepo — one repository made up of several smaller packages that each do one specific job. You install only the pieces you need.

| Package | What it does |
|---|---|
| [`@big-calendar/core`](packages/core) | The engine. All calendar logic, date math, view models, and state management live here. No framework required. |
| [`@big-calendar/localizer`](packages/localizer) | The base class for date/time formatting. Defines how the calendar reads, formats, and compares dates. |
| [`@big-calendar/localizer-temporal`](packages/localizer-temporal) | The recommended localizer, built on the browser's built-in Temporal API. |
| [`@big-calendar/localizer-luxon`](packages/localizer-luxon) | An alternative localizer for teams already using Luxon. |
| [`@big-calendar/styles`](packages/styles) | All the CSS — design tokens, layout, and component styles. |
| [`@big-calendar/dnd`](packages/dnd) | Optional drag-and-drop support for moving and resizing events. |
| [`@big-calendar/react`](packages/react) | The React UI package. Built with standard React hooks and component composition. |
| [`@big-calendar/vue`](packages/vue) | The Vue 3 UI package. Uses Vue's `provide`/`inject` for context and composables for headless access. |
| [`@big-calendar/angular`](packages/angular) | The Angular 21+ UI package. Uses Angular's `InjectionToken` for context and inject composables for headless access. |
| [`@big-calendar/lit`](packages/lit) | The Lit v3 UI package. Delivers the calendar as standard web components — works in any framework or vanilla HTML. |
| [`@big-calendar/svelte`](packages/svelte) | The Svelte 5 UI package. Uses Svelte's context system for state sharing and rune-based composables for headless access. |
| [`@big-calendar/codemods`](packages/codemods) | A CLI tool that automatically updates your code when migrating from `react-big-calendar`. |
| [`@big-calendar/mcp`](packages/mcp) | An MCP server that gives AI coding assistants direct knowledge of the Big Calendar API and your project's configuration. |

---

## Why the rewrite?

`react-big-calendar` worked well for years, but its architecture had some hard limits that couldn't be fixed without starting over.

**It was React-only by design.** Every piece of calendar logic — date math, event layout, state management — was wired directly into React components. There was no way to share that logic with a Vue or Angular project without duplicating it.

**It used JavaScript `Date` objects at its boundaries.** `Date` objects carry no time zone information and behave differently depending on the local machine's clock. This caused subtle bugs that were hard to trace and nearly impossible to test reliably. Big Calendar uses plain ISO date strings everywhere instead — serializable, portable, and unambiguous.

**It required you to install a third-party date library.** Moment, Luxon, date-fns, or Day.js — you had to pick one and wire it in before the calendar would work. Big Calendar recommends the Temporal API, which is built into modern browsers and needs no extra installation.

**Its styles were hard to customize.** One flat CSS file with no design tokens meant any override required fighting specificity or using `!important`. Big Calendar uses CSS custom properties (`--bc-*`) as the customization API and CSS `@layer` for a predictable specificity order where your styles always win.

The rewrite addresses all of this: a framework-agnostic core, string-only date boundaries, the platform's own date APIs, and CSS built for customization from the start.

---

## Getting started (React)

Install the React package, a localizer, and the styles:

```bash
pnpm add @big-calendar/react @big-calendar/localizer-temporal @big-calendar/styles
```

Set up a localizer and drop the calendar into your app:

```jsx
import { CalendarProvider, Calendar } from '@big-calendar/react'
import { createTemporalLocalizer } from '@big-calendar/localizer-temporal'
import '@big-calendar/styles/index.css'

const localizer = await createTemporalLocalizer()

const events = [
  {
    id: '1',
    title: 'Team standup',
    start: '2025-09-01T09:00:00Z',
    end: '2025-09-01T09:30:00Z',
  },
]

function MyCalendar() {
  return (
    <CalendarProvider localizer={localizer} events={events}>
      <Calendar />
    </CalendarProvider>
  )
}
```

See the [`@big-calendar/react` README](packages/react) for the full prop reference and customization options.

---

## Getting started (Vue 3)

```bash
pnpm add @big-calendar/vue @big-calendar/localizer-temporal @big-calendar/styles
```

```vue
<script setup>
import { CalendarProvider, Calendar } from '@big-calendar/vue'
import { createTemporalLocalizer } from '@big-calendar/localizer-temporal'
import '@big-calendar/styles/index.css'

const localizer = await createTemporalLocalizer()
const events = [
  { id: '1', title: 'Team standup', start: '2025-09-01T09:00:00Z', end: '2025-09-01T09:30:00Z' }
]
</script>

<template>
  <CalendarProvider :localizer="localizer" :events="events">
    <Calendar />
  </CalendarProvider>
</template>
```

See the [`@big-calendar/vue` README](packages/vue) for the full API reference.

---

## Getting started (Angular)

```bash
npm install @big-calendar/angular @big-calendar/localizer-temporal @big-calendar/styles
```

```ts
// app.component.ts
import { Component } from '@angular/core'
import { CalendarProviderComponent, CalendarComponent } from '@big-calendar/angular'
import { createTemporalLocalizer } from '@big-calendar/localizer-temporal'
import '@big-calendar/styles/index.css'

const localizer = await createTemporalLocalizer()

@Component({
  standalone: true,
  imports: [CalendarProviderComponent, CalendarComponent],
  template: `
    <bc-calendar-provider [localizer]="loc" [events]="events">
      <bc-calendar />
    </bc-calendar-provider>
  `,
})
export class AppComponent {
  readonly loc = localizer
  readonly events = [
    { id: '1', title: 'Team standup', start: '2025-09-01T09:00:00Z', end: '2025-09-01T09:30:00Z' }
  ]
}
```

See the [`@big-calendar/angular` README](packages/angular) for the full API reference.

---

## Getting started (Lit / Web Components)

```bash
npm install @big-calendar/lit @big-calendar/localizer-temporal @big-calendar/styles
```

```ts
import { html, LitElement } from 'lit'
import { customElement } from 'lit/decorators.js'
import '@big-calendar/lit'
import '@big-calendar/styles/index.css'
import { createTemporalLocalizer } from '@big-calendar/localizer-temporal'

const localizer = await createTemporalLocalizer()
const events = [
  { id: '1', title: 'Team standup', start: '2025-09-01T09:00:00Z', end: '2025-09-01T09:30:00Z' }
]

@customElement('my-calendar')
class MyCalendar extends LitElement {
  override createRenderRoot() { return this }
  override render() {
    return html`
      <bc-calendar .localizer=${localizer} .events=${events}>
        <div class="bc-calendar">
          <bc-default-toolbar></bc-default-toolbar>
          <bc-month-view></bc-month-view>
          <bc-time-grid-view></bc-time-grid-view>
          <bc-agenda-view></bc-agenda-view>
        </div>
      </bc-calendar>
    `
  }
}
```

Because `@big-calendar/lit` exports standard web components, you can also use it in any other framework (Svelte, Solid, vanilla HTML) or in a plain `<script type="module">` tag.

See the [`@big-calendar/lit` README](packages/lit) for the full API reference.

---

## Getting started (Svelte 5)

```bash
yarn add @big-calendar/svelte @big-calendar/localizer-temporal @big-calendar/styles
```

```svelte
<!-- MyCalendar.svelte -->
<script>
  import { CalendarProvider, Calendar } from '@big-calendar/svelte'
  import { createTemporalLocalizer } from '@big-calendar/localizer-temporal'
  import '@big-calendar/styles/index.css'

  const localizer = await createTemporalLocalizer()
  let events = $state([
    { id: '1', title: 'Team standup', start: '2025-09-01T09:00:00Z', end: '2025-09-01T09:30:00Z' }
  ])
</script>

<div style="height: 600px">
  <CalendarProvider {localizer} {events}>
    <Calendar />
  </CalendarProvider>
</div>
```

See the [`@big-calendar/svelte` README](packages/svelte) for the full API reference.

---

## AI-assisted development

`@big-calendar/mcp` is an optional dev dependency that adds an [MCP server](https://modelcontextprotocol.io) to your project. It gives AI coding assistants (Claude Code, Cursor, VS Code Copilot, JetBrains AI) direct knowledge of the Big Calendar API — so they can scaffold components, add features, generate sample events, and answer integration questions without guessing at the API surface.

```bash
pnpm add --save-dev @big-calendar/mcp
```

See the [MCP server README](packages/mcp) for client setup instructions.

---

## Migrating from react-big-calendar

If you are upgrading from `react-big-calendar`, the `@big-calendar/codemods` package can handle most of the mechanical changes automatically. See the [codemods README](packages/codemods) for instructions.

---

## Toolchain

Nx · pnpm workspaces · TypeScript (ESNext → ES2024, ESM only) · Vite (library mode) · Vitest · Playwright · ESLint + Prettier · Nx Release (conventional commits, synced versions).

---

## Common commands

```bash
pnpm install                                        # install the workspace
pnpm exec nx run-many -t build                      # build all packages
pnpm exec nx run-many -t test                       # run all tests
pnpm exec nx run-many -t lint                       # lint all packages
pnpm exec nx run-many -t typecheck                  # type-check all packages
pnpm exec nx affected -t lint typecheck test        # only run what changed
```

---

## License

MIT
