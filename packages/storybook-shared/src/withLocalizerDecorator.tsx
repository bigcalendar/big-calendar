import type { LocalizerContract, LocalizerOptions } from '@big-calendar/localizer'
import { createLuxonLocalizer } from '@big-calendar/localizer-luxon'
import { createTemporalLocalizer } from '@big-calendar/localizer-temporal'
import type { Decorator } from '@storybook/react-vite'
import { useEffect, useState } from 'react'
import { LocalizerContext } from './LocalizerContext'

// Synchronous default — Luxon requires no async polyfill loading, so this module
// stays fully synchronous. No top-level await, no fire-and-forget async at module
// level; either would risk triggering Storybook's global `unhandledrejection`
// listener on cold load (hard reload / cache cleared) and crashing the preview.
const _syncDefault: LocalizerContract = createLuxonLocalizer({ locale: 'en-US', timeZone: 'UTC' })

function applyLocalizer(
  type: string,
  loc: string,
  tz: string,
  set: (l: LocalizerContract) => void,
): void {
  const opts: LocalizerOptions = { locale: loc || 'en-US', timeZone: tz || 'UTC' }
  if (type === 'luxon') {
    set(createLuxonLocalizer(opts))
  } else {
    // .catch keeps any polyfill-load failure as a handled rejection so Storybook's
    // global unhandledrejection listener never sees it.
    createTemporalLocalizer(opts).then(set).catch(() => {
      set(createLuxonLocalizer(opts))
    })
  }
}

/**
 * Global Storybook decorator that resolves a localizer from the three toolbar
 * globals (`localizer`, `locale`, `timeZone`) and provides it to the story tree
 * via {@link LocalizerContext}.
 *
 * Works in two modes:
 * - **Direct access** (localhost:6006): `context.globals` is updated by Storybook
 *   normally; `useEffect` picks up changes.
 * - **Composition mode** (localhost:6007 hub): Storybook only sends `UPDATE_GLOBALS`
 *   to its own preview iframe, never to embedded ref iframes. The hub's
 *   `core/.storybook/preview.ts` re-broadcasts via `postMessage`; this decorator
 *   listens on `window` for those `{ type: 'bc-globals-sync', globals }` messages.
 *
 * Add to `decorators` in `.storybook/preview.ts` for every Storybook instance.
 */
export const withLocalizerDecorator: Decorator = (Story, context) => {
  const {
    localizer: localizerType = 'temporal',
    locale = '',
    timeZone = '',
  } = context.globals as { localizer?: string; locale?: string; timeZone?: string }

  const [localizer, setLocalizer] = useState<LocalizerContract>(_syncDefault)

  // Direct-access path: context.globals is reactive when using the ref's own
  // Storybook at localhost:6006 (or any non-composed instance).
  useEffect(() => {
    applyLocalizer(localizerType, locale, timeZone, setLocalizer)
  }, [localizerType, locale, timeZone])

  // Composition-mode path: the hub's preview.ts broadcasts globals changes from
  // the hub's channel to each ref iframe via postMessage.
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      const { origin } = event
      if (
        origin !== window.location.origin &&
        !origin.startsWith('http://localhost') &&
        !origin.startsWith('https://localhost')
      ) return
      if (!event.data || event.data.type !== 'bc-globals-sync') return
      const g = (event.data.globals ?? {}) as { localizer?: string; locale?: string; timeZone?: string }
      applyLocalizer(g.localizer ?? 'temporal', g.locale ?? '', g.timeZone ?? '', setLocalizer)
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  return (
    <LocalizerContext.Provider value={localizer}>
      <div dir={localizer.direction} lang={localizer.language} style={{ display: 'contents' }}>
        <Story />
      </div>
    </LocalizerContext.Provider>
  )
}
