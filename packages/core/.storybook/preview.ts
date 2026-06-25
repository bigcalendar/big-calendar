import type { Preview } from '@storybook/react-vite'
import { localeList, timeZoneList, withLocalizerDecorator } from '@big-calendar/storybook-shared'

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

export default preview
