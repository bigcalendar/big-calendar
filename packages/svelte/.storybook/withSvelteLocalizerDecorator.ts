/**
 * Localizer bridge + toolbar decorator for the Svelte Storybook.
 *
 * Works in two modes:
 * - **Direct access** (localhost:6011 standalone): `context.globals` is live;
 *   the decorator reads it on every story render.
 * - **Composition mode** (hub at localhost:6007): the hub's `core/preview.ts`
 *   re-broadcasts `updateGlobals` via `postMessage({ type: 'bc-globals-sync', globals })`.
 *   We listen here and override the last-known hub globals so the decorator
 *   uses them instead of Svelte's own (default) globals on the next render.
 *
 * In both modes `setLocalizer()` updates the module-level live binding in
 * `stories/localizerRef.ts`. Every story `render()` call reads the binding
 * at call time, so `forceReRender()` is sufficient to pick up the change.
 *
 * The `_currentKey` guard prevents the async temporal path from retriggering
 * itself in an infinite re-render loop.
 */
import { createLuxonLocalizer } from '@big-calendar/localizer-luxon'
import { createTemporalLocalizer } from '@big-calendar/localizer-temporal'
import type { Decorator } from '@storybook/svelte-vite'
import { setLocalizer } from '../stories/localizerRef'

let _currentKey = ''
let _compositionGlobals: Record<string, string> | null = null

function forceReRender(): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ch = (window as any).__STORYBOOK_ADDONS_CHANNEL__ as { emit: (e: string) => void } | undefined
  ch?.emit('forceReRender')
}

function applyLocalizer(type: string, locale: string, tz: string): void {
  const key = `${type}:${locale || 'en-US'}:${tz || 'UTC'}`
  if (key === _currentKey) return
  _currentKey = key

  const opts = { locale: locale || 'en-US', timeZone: tz || 'UTC' }
  if (type === 'luxon') {
    setLocalizer(createLuxonLocalizer(opts))
  } else {
    createTemporalLocalizer(opts)
      .then((l) => { setLocalizer(l); forceReRender() })
      .catch(() => { setLocalizer(createLuxonLocalizer(opts)); forceReRender() })
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('message', (event: MessageEvent) => {
    if (!event.data || event.data.type !== 'bc-globals-sync') return
    const g = (event.data.globals ?? {}) as Record<string, string>
    _compositionGlobals = g
    applyLocalizer(g.localizer ?? 'temporal', g.locale ?? '', g.timeZone ?? '')
    forceReRender()
  })
}

export const withSvelteLocalizerDecorator: Decorator = (storyFn, context) => {
  const globals = _compositionGlobals ?? ((context.globals ?? {}) as Record<string, string>)
  const { localizer: type = 'temporal', locale = '', timeZone = '' } = globals
  applyLocalizer(type, locale, timeZone)
  return storyFn()
}
