import { createTemporalLocalizer } from '@big-calendar/localizer-temporal'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { CalendarProvider } from '../src'
import type { CalendarProviderProps } from '../src'

/**
 * Shared dev harness for the `@big-calendar/react` stories.
 *
 * The localizer is async (`createTemporalLocalizer`), so it is resolved once at
 * module load via top-level await — every story importing this gets the same
 * ready-to-use instance. Pinned to `en-US`/`UTC` and a fixed `NOW` so the grids,
 * today highlight, and now-indicator render deterministically.
 */
export const localizer = await createTemporalLocalizer({ locale: 'en-US', timezone: 'UTC' })

/** Frozen "now" so today/now-indicator placement is stable across runs. */
export const NOW = '2026-06-15T12:00:00.000Z'
/** Focus date the demo calendar opens on (Mon, Jun 15 2026). */
export const FOCUS = '2026-06-15'

/** Minimal event shape used by the demo data. */
export interface DemoEvent {
  id: number
  title: string
  start: string
  end: string
  allDay?: boolean
}

/** A week's worth of sample events around {@link FOCUS}. */
export const demoEvents: DemoEvent[] = [
  { id: 1, title: 'Standup', start: '2026-06-15T09:00:00.000Z', end: '2026-06-15T09:30:00.000Z' },
  { id: 2, title: 'Design review', start: '2026-06-15T11:00:00.000Z', end: '2026-06-15T12:30:00.000Z' },
  { id: 3, title: 'Lunch & learn', start: '2026-06-16T12:00:00.000Z', end: '2026-06-16T13:00:00.000Z' },
  { id: 4, title: 'Offsite', start: '2026-06-17T00:00:00.000Z', end: '2026-06-19T00:00:00.000Z', allDay: true },
  { id: 5, title: '1:1 with Dana', start: '2026-06-18T15:00:00.000Z', end: '2026-06-18T15:30:00.000Z' },
  { id: 6, title: 'Release cut', start: '2026-06-19T16:00:00.000Z', end: '2026-06-19T17:00:00.000Z' },
]

/** Props for {@link CalendarStage}: provider config plus stage sizing. */
export type CalendarStageProps = Partial<CalendarProviderProps<DemoEvent>> & {
  children: ReactNode
  /** Stage height (number → px). Views need real height to lay out / scroll. */
  height?: number | string
  /** Grid rows for the stage box — `'auto 1fr'` for toolbar + view, `'auto'` for a bare toolbar. */
  rows?: string
}

/**
 * Sized stand-in for the app container a developer supplies around the calendar.
 * Lays its children out as a grid (toolbar row `auto`, view row `1fr`) and wraps
 * them in a {@link CalendarProvider} pre-wired with the demo localizer, events,
 * and `getNow`. Stories pass `<Toolbar/>` + a `.bc-calendar` view wrapper as
 * children, mirroring the eventual `<Calendar>` composition.
 */
export function CalendarStage({ children, height = 800, rows = 'auto 1fr', ...props }: CalendarStageProps) {
  return (
    <div style={{ display: 'grid', gridTemplateRows: rows, blockSize: height, inlineSize: '100%' }}>
      <CalendarProvider<DemoEvent>
        localizer={localizer}
        getNow={() => NOW}
        events={demoEvents}
        defaultDate={FOCUS}
        {...props}
      >
        {children}
      </CalendarProvider>
    </div>
  )
}

/**
 * A {@link CalendarStage} pre-wired for exercising slot/event selection:
 * `selectable` is on and the selection callbacks (`onSelectSlot`,
 * `onEventClick`, `onEventDoubleClick`, plus `onEventRightClick` /
 * `onEventMiddleClick`) feed a live read-out below the view so you can see what
 * each gesture emits without opening the console. Switch `view` to **Agenda** to
 * see the same event handlers drive its link-styled title buttons. Pass the
 * `<Toolbar/>` + `.bc-calendar` view as children, like {@link CalendarStage}.
 * Any prop (e.g. `selectable={false}`) can be overridden.
 */
export function SelectionDemo({ children, ...props }: CalendarStageProps) {
  const [log, setLog] = useState(
    'Drag across slots to select a range · click or double-click a slot · click an event.',
  )
  return (
    // The calendar and the read-out are separate siblings, so a growing payload
    // never steals height from the calendar (which keeps its own fixed size).
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <CalendarStage
        selectable
        onSelectSlot={(selection) => setLog(`onSelectSlot · ${selection.action}\n${JSON.stringify(selection, null, 2)}`)}
        onEventClick={(event) => setLog(`onEventClick\n${JSON.stringify(event, null, 2)}`)}
        onEventDoubleClick={(event) => setLog(`onEventDoubleClick\n${JSON.stringify(event, null, 2)}`)}
        onEventRightClick={(event, e) => {
          e.preventDefault() // replace the native context menu with our read-out
          setLog(`onEventRightClick\n${JSON.stringify(event, null, 2)}`)
        }}
        onEventMiddleClick={(event) => setLog(`onEventMiddleClick\n${JSON.stringify(event, null, 2)}`)}
        {...props}
      >
        {children}
      </CalendarStage>
      <pre
        aria-label="Last selection event"
        style={{
          margin: 0,
          padding: '0.5rem 0.75rem',
          border: '1px solid var(--bc-color-border, #d4d4d8)',
          borderRadius: '4px',
          fontSize: '0.75rem',
          lineHeight: 1.4,
          whiteSpace: 'pre-wrap',
          // Fixed height with its own scroll: the read-out never reflows the page.
          blockSize: '9rem',
          overflow: 'auto',
        }}
      >
        {log}
      </pre>
    </div>
  )
}
