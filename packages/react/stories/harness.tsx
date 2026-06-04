import { createTemporalLocalizer } from '@big-calendar/localizer-temporal'
import type { ReactNode } from 'react'
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
export function CalendarStage({ children, height = 640, rows = 'auto 1fr', ...props }: CalendarStageProps) {
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
