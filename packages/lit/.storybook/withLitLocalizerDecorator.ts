/**
 * Localizer bridge for the Lit Storybook.
 *
 * Imported as a side effect by `.storybook/preview.ts`. NOT a Storybook
 * decorator — no component wrapping, no lifecycle hooks. Registers a window
 * message listener that fires whenever the hub's `core/preview.ts` broadcasts
 * a `bc-globals-sync` postMessage (which it sends on every `updateGlobals`
 * channel event, i.e. every toolbar change).
 *
 * Updates the shared `litLocalizer` object in `stories/localizerRef.ts` by
 * calling `setLitLocalizer()` which dispatches a `bc-localizer-change`
 * CustomEvent on `window`. Story wrapper elements that listen for this event
 * call `requestUpdate()` to re-render with the new localizer.
 */
import { createLuxonLocalizer } from '@big-calendar/localizer-luxon'
import { createTemporalLocalizer } from '@big-calendar/localizer-temporal'
import { setLitLocalizer } from '../stories/localizerRef'

function applyLocalizer(type: string, locale: string, tz: string): void {
  const opts = { locale: locale || 'en-US', timeZone: tz || 'UTC' }
  if (type === 'luxon') {
    setLitLocalizer(createLuxonLocalizer(opts))
  } else {
    createTemporalLocalizer(opts)
      .then((l) => { setLitLocalizer(l) })
      .catch(() => { setLitLocalizer(createLuxonLocalizer(opts)) })
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('message', (event: MessageEvent) => {
    if (!event.data || event.data.type !== 'bc-globals-sync') return
    const g = (event.data.globals ?? {}) as Record<string, string>
    applyLocalizer(g.localizer ?? 'temporal', g.locale ?? '', g.timeZone ?? '')
  })
}
