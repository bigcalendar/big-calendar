import { addons } from 'storybook/manager-api'

/**
 * Ensures toolbar globalTypes (localizer / locale / timeZone) reach the manager
 * on hard reload at a ref story URL.
 *
 * Root cause: in Storybook composition mode, FramesRenderer replaces
 * `storybook-preview-iframe` with the ref's URL whenever a ref story is selected.
 * If that selection is present in the URL on the very first render (i.e. a hard
 * reload), the hub's own preview.ts — which sends SET_GLOBALS with globalTypes —
 * is never loaded, so the toolbar stays empty.
 *
 * Fix: preview.ts writes the serialised globalTypes to localStorage each time it
 * loads. If our localizer globalType is still absent after 300 ms, we read that
 * cache here and re-emit SET_GLOBALS.
 *
 * Secondary fix: Storybook's SET_GLOBALS handler calls
 * getEventMetadata(this, fullAPI) where `this` is the event object. For events
 * emitted locally by manager addons (Channel.emit → Channel.handleEvent), the
 * event has no `source` field. getEventMetadata then calls
 * getSourceType(undefined, ...) which runs `new URL(undefined)` — a TypeError
 * that silently kills the bootstrap before globalTypes are applied.
 *
 * PostMessageTransport already sets event.source on incoming iframe postMessages
 * before calling Channel.handleEvent, so those are unaffected. We monkey-patch
 * Channel.handleEvent to set source = window.location.href for any event that
 * arrives without one, causing getSourceType to classify it as "local" and
 * allowing store2.setState({ globalTypes }) to fire correctly.
 *
 * Guard: check for our specific `localizer` globalType, not just any non-empty
 * globalTypes. Storybook's built-in addons (backgrounds, viewport, etc.) register
 * their own globalTypes in the manager before any preview loads, so length > 0
 * would always bail early and leave our toolbar buttons missing.
 */
addons.register('bc-hub-preview-init', (api) => {
  // Patch Channel.handleEvent so locally-emitted events carry a source URL.
  // This is required for getEventMetadata → getSourceType → new URL(source) to
  // succeed; without it the SET_GLOBALS handler throws silently and globalTypes
  // are never written to the manager store.
  const ch = api.getChannel() as {
    handleEvent?: (event: Record<string, unknown>) => void
  }
  if (typeof ch?.handleEvent === 'function') {
    const origHandleEvent = ch.handleEvent.bind(ch)
    ch.handleEvent = (event: Record<string, unknown>) => {
      if (event && event.source === undefined) {
        event.source = window.location.href
      }
      origHandleEvent(event)
    }
  }

  setTimeout(() => {
    // Only skip restoration if our specific toolbar control is already present.
    if (api.getGlobalTypes().localizer !== undefined) return

    try {
      const cached = localStorage.getItem('__bc_hub_globalTypes_v1')
      if (!cached) return

      const { globalTypes, initialGlobals } = JSON.parse(cached) as {
        globalTypes: Record<string, unknown>
        initialGlobals: Record<string, unknown>
      }

      api.getChannel().emit('setGlobals', {
        globals: { ...initialGlobals, ...api.getGlobals() },
        globalTypes,
      })
    } catch {
      // localStorage unavailable or stale cache — toolbar will be empty
      // until the user navigates to a hub story.
    }
  }, 300)
})
