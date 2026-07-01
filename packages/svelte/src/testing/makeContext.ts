import { createCalendarStore, resolveMessages } from '@big-calendar/core'
import type { LocalizerContract, SelectableMode } from '@big-calendar/core'
import { CALENDAR_CONTEXT_KEY } from '../CalendarProvider/calendarContext'
import type { CalendarContextValue } from '../CalendarProvider/calendarContext'

export interface MakeContextOptions {
  selectable?: SelectableMode
}

/**
 * Build a minimal CalendarContextValue for injection via render()'s `context`
 * option, bypassing the need for a real <CalendarProvider> in composable tests.
 *
 * Defaults to `selectable: true` so composables that guard on
 * `store.selectable === false` behave interactively in tests.
 */
export function makeContext(
  localizer: LocalizerContract,
  defaultView = 'month',
  opts: MakeContextOptions = {},
): Map<typeof CALENDAR_CONTEXT_KEY, CalendarContextValue> {
  const { selectable = true } = opts
  const store = createCalendarStore({ localizer, view: defaultView, selectable })
  return new Map([
    [
      CALENDAR_CONTEXT_KEY,
      {
        store,
        components: {},
        messages: resolveMessages(undefined),
        descriptionIds: { selection: 'bc-sel-test', event: 'bc-evt-test' },
      },
    ],
  ])
}
