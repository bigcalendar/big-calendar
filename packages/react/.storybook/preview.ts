import type { Preview } from '@storybook/react-vite'
import { localeList, timeZoneList, withLocalizerDecorator } from '@big-calendar/storybook-shared'
// The shipped stylesheet drives all calendar layout/skin; stories render against
// the real CSS so visual regressions surface here, not just in apps.
import '@big-calendar/styles/index.css'

const _localeNames = new Intl.DisplayNames(['en'], { type: 'language' })

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
    controls: { expanded: true },
    options: {
      storySort: {
        order: [
          'Introduction',
          'Calendar',
          ['Standard', 'Views', 'Custom Views', 'Toolbar', 'Custom Components'],
          'Events',
          ['Overview', 'Event Callbacks'],
          'Selection',
          ['Overview', 'Selectable'],
          'Drag & Drop',
          ['Overview', 'Event Drag & Drop', 'Drop from Outside'],
          'Resources',
          ['Overview', 'With Resources'],
          'Background Events',
          ['Overview', 'With Background Events'],
          'Advanced',
          ['Headless API', 'useMonthView', 'useTimeGridView', 'useAgendaView'],
          'Primitives',
          ['Popover', 'Dialog', 'Tooltip'],
        ],
      },
    },
  },
}

export default preview
