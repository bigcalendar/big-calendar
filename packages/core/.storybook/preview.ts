import type { Preview } from '@storybook/react-vite'
import { localeList, timeZoneList, withLocalizerDecorator } from '@big-calendar/storybook-shared'

const _localeNames = new Intl.DisplayNames(['en'], { type: 'language' })

// ─── Composition globals bridge ──────────────────────────────────────────────
// Storybook's manager always sends UPDATE_GLOBALS to "storybook-preview-iframe"
// (the hub's own iframe) and never to embedded ref iframes ("storybook-ref-*").
// This preview.ts runs inside the hub, so it DOES receive the event. We relay
// the updated globals to every ref iframe via postMessage. The hub preview and
// the manager share the same origin (same host:port), so accessing
// window.parent.document is allowed.
if (typeof window !== 'undefined') {
  setTimeout(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ch = (window as any).__STORYBOOK_ADDONS_CHANNEL__ as
      | { on: (event: string, cb: (data: unknown) => void) => void }
      | undefined
    if (!ch) return
    ch.on('updateGlobals', (data: unknown) => {
      const { globals } = data as { globals?: Record<string, unknown> }
      if (!globals) return
      try {
        const frames = window.parent.document.querySelectorAll<HTMLIFrameElement>(
          'iframe[id^="storybook-ref-"]',
        )
        frames.forEach((f) => f.contentWindow?.postMessage({ type: 'bc-globals-sync', globals }, '*'))
      } catch {
        // Not in a composition context or cross-origin; ignore.
      }
    })
  }, 0)
}

const preview: Preview = {
  decorators: [withLocalizerDecorator],
  globalTypes: {
    localizer: {
      name: 'Localizer',
      description: 'Active date localizer (Temporal or Luxon)',
      toolbar: {
        icon: 'time',
        items: [
          { value: 'temporal', title: 'Temporal' },
          { value: 'luxon', title: 'Luxon' },
        ],
        showName: true,
      },
    },
    locale: {
      name: 'Locale',
      description: 'BCP 47 locale passed to the localizer (empty → en-US)',
      toolbar: {
        icon: 'globe',
        items: [
          { value: '', title: 'Default (en-US)' },
          ...localeList.map((tag) => ({
            value: tag,
            title: `${_localeNames.of(tag) ?? tag} (${tag})`,
          })),
        ],
        showName: true,
      },
    },
    timeZone: {
      name: 'Time Zone',
      description: 'IANA time zone passed to the localizer (empty → UTC)',
      toolbar: {
        icon: 'timer',
        items: [
          { value: '', title: 'Default (UTC)' },
          ...timeZoneList.map((tz) => ({ value: tz, title: tz })),
        ],
        showName: true,
      },
    },
  },
  initialGlobals: {
    localizer: 'temporal',
    locale: '',
    timeZone: '',
  },
  parameters: {
    layout: 'fullscreen',
    options: {
      storySort: {
        order: [
          'Core',
          ['Welcome', 'createCalendarStore', 'Localizers', 'Custom localizer', 'Selection', 'Selection contract'],
          'Styles',
          ['Guide'],
        ],
      },
    },
  },
}

// Cache globalTypes so manager.ts can bootstrap the toolbar on hard reload at
// a ref story URL (where this preview never loads because FramesRenderer
// replaces storybook-preview-iframe with the ref's URL immediately).
// localStorage is shared across same-origin documents, so the manager window
// and this preview iframe can both access it.
if (typeof localStorage !== 'undefined') {
  try {
    localStorage.setItem(
      '__bc_hub_globalTypes_v1',
      JSON.stringify({
        globalTypes: preview.globalTypes,
        initialGlobals: preview.initialGlobals,
      }),
    )
  } catch {
    // Ignore — write fails silently in private browsing or when storage is full.
  }
}

export default preview
