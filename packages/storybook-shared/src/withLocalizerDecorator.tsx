import type { LocalizerContract, LocalizerOptions } from '@big-calendar/localizer'
import { createLuxonLocalizer } from '@big-calendar/localizer-luxon'
import { createTemporalLocalizer } from '@big-calendar/localizer-temporal'
import type { Decorator } from '@storybook/react-vite'
import { useEffect, useState } from 'react'
import { LocalizerContext } from './LocalizerContext'

/**
 * Pre-load the default Temporal localizer so the initial render is never null.
 * Every story using `CalendarStage` (or any component that reads
 * `LocalizerContext`) will start with a fully-resolved localizer.
 */
const _defaultLocalizer: LocalizerContract = await createTemporalLocalizer({
  locale: 'en-US',
  timeZone: 'UTC',
})

/**
 * Global Storybook decorator that resolves a localizer from the three toolbar
 * globals (`localizer`, `locale`, `timeZone`) and provides it to the story tree
 * via {@link LocalizerContext}.
 *
 * Add to `decorators` in `.storybook/preview.ts` for every Storybook instance.
 */
export const withLocalizerDecorator: Decorator = (Story, context) => {
  const {
    localizer: localizerType = 'temporal',
    locale = '',
    timeZone = '',
  } = context.globals as { localizer?: string; locale?: string; timeZone?: string }

  const [localizer, setLocalizer] = useState<LocalizerContract>(_defaultLocalizer)

  useEffect(() => {
    const opts: LocalizerOptions = {
      locale: locale || 'en-US',
      timeZone: timeZone || 'UTC',
    }
    if (localizerType === 'luxon') {
      setLocalizer(createLuxonLocalizer(opts))
    } else {
      void createTemporalLocalizer(opts).then(setLocalizer)
    }
  }, [localizerType, locale, timeZone])

  return (
    <LocalizerContext.Provider value={localizer}>
      <Story />
    </LocalizerContext.Provider>
  )
}
