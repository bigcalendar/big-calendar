import type { Preview } from '@storybook/svelte-vite'
import '@big-calendar/styles/index.css'
import { localeList, timeZoneList } from './localeTimeZone'
import { withSvelteLocalizerDecorator } from './withSvelteLocalizerDecorator'

const _localeNames = new Intl.DisplayNames(['en'], { type: 'language' })

const preview: Preview = {
  decorators: [withSvelteLocalizerDecorator],
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
      },
    },
    locale: {
      name: 'Locale',
      description: 'BCP 47 locale passed to the localizer (empty → en-US)',
      toolbar: {
        icon: 'globe',
        items: [
          { value: '', title: 'Default (en-US)' },
          ...localeList.map((tag: string) => ({
            value: tag,
            title: `${_localeNames.of(tag) ?? tag} (${tag})`,
          })),
        ],
      },
    },
    timeZone: {
      name: 'Time Zone',
      description: 'IANA time zone passed to the localizer (empty → UTC)',
      toolbar: {
        icon: 'timer',
        items: [
          { value: '', title: 'Default (UTC)' },
          ...timeZoneList.map((tz: string) => ({ value: tz, title: tz })),
        ],
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
    controls: { expanded: true },
    options: {
      storySort: {
        order: [
          'Introduction',
          'Concepts',
          ['Svelte Patterns'],
          'Calendar',
          ['Standard', 'CalendarProvider', 'Views', 'Toolbar', 'Custom Components', 'Custom Rendering', 'Event Type Accessor', 'Localization'],
          'Events',
          ['Overview', 'Event Callbacks'],
          'Selection',
          ['Overview', 'Selectable'],
          'Drag & Drop',
          ['Overview', 'Event Drag & Drop', 'Drop from Outside'],
          'Background Events',
          ['Overview', 'With Background Events'],
          'Resources',
          ['Overview', 'With Resources', 'Resource Type Accessor'],
          'Primitives',
          ['Popover', 'Tooltip', 'Dialog'],
          'Advanced',
          ['Headless API', 'useMonthView', 'useTimeGridView', 'useAgendaView', 'Interaction Hooks', 'Data Hooks', 'useFloatingAnchor'],
          'Utilities',
          ['Geometry Styles', 'Event Time'],
        ],
      },
    },
  },
}

export default preview
