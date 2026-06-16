import { useLocalizerContext } from '@big-calendar/storybook-shared'
import { createTemporalLocalizer } from '@big-calendar/localizer-temporal'
import type { ReactNode } from 'react'
import { CalendarProvider } from '../src'
import type { CalendarProviderProps } from '../src'
import type { DemoEvent } from './demoEvents'
import { demoEvents } from './demoEvents'
export type { DemoEvent }
export { demoEvents }

/**
 * Shared dev harness for the `@big-calendar/react` stories.
 *
 * The localizer is async (`createTemporalLocalizer`), so it is resolved once at
 * module load via top-level await — every story importing this gets the same
 * ready-to-use instance. Pinned to `en-US`/`UTC` and a fixed `NOW` so the grids,
 * today highlight, and now-indicator render deterministically.
 *
 * Inside Storybook, {@link CalendarStage} prefers the localizer supplied by
 * `withLocalizerDecorator` via {@link useLocalizerContext}, so the toolbar
 * globals (localizer type, locale, time zone) drive the calendar automatically.
 */
export const localizer = await createTemporalLocalizer({ locale: 'en-US', timeZone: 'UTC' })

/** Frozen "now" so today/now-indicator placement is stable across runs. */
export const NOW = '2026-06-15T12:00:00.000Z'
/** Focus date the demo calendar opens on (Mon, Jun 15 2026). */
export const FOCUS = '2026-06-15'

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
export function CalendarStage({ children, height = '100dvh', rows = 'auto 1fr', ...props }: CalendarStageProps) {
  const ctxLocalizer = useLocalizerContext()
  return (
    <div style={{ display: 'grid', gridTemplateRows: rows, rowGap: '0.5rem', blockSize: height, inlineSize: '100%' }}>
      <CalendarProvider<DemoEvent>
        localizer={ctxLocalizer ?? localizer}
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

