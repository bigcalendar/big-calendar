/**
 * Composition-mode localizer bridge for the Vue Storybook ref.
 *
 * Imported as a side effect by `.storybook/preview.ts`. NOT a Storybook
 * decorator — no component wrapping, no lifecycle hooks, no template
 * compilation. Registers a window message listener that fires whenever the
 * hub's `core/preview.ts` broadcasts a `bc-globals-sync` postMessage (which
 * it sends on every `updateGlobals` channel event, i.e. every toolbar change).
 *
 * Updates the shared `localizer` shallowRef in `stories/localizerRef.ts`.
 * Because all Vue stories return that ref from `setup()`, changing its `.value`
 * causes every mounted story to re-render with the new localizer automatically.
 */
import { createLuxonLocalizer } from '@big-calendar/localizer-luxon'
import { createTemporalLocalizer } from '@big-calendar/localizer-temporal'
import { localizer } from '../stories/localizerRef'

function applyLocalizer(type: string, locale: string, tz: string): void {
  const opts = { locale: locale || 'en-US', timeZone: tz || 'UTC' }
  if (type === 'luxon') {
    localizer.value = createLuxonLocalizer(opts)
  } else {
    createTemporalLocalizer(opts)
      .then((l) => { localizer.value = l })
      .catch(() => { localizer.value = createLuxonLocalizer(opts) })
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('message', (event: MessageEvent) => {
    if (!event.data || event.data.type !== 'bc-globals-sync') return
    const g = (event.data.globals ?? {}) as Record<string, string>
    applyLocalizer(g.localizer ?? 'temporal', g.locale ?? '', g.timeZone ?? '')
  })
}
