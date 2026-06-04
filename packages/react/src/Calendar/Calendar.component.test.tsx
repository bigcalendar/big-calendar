import { Views } from '@big-calendar/core'
import { render } from '@testing-library/react'
import { beforeAll, describe, expect, it } from 'vitest'
import { CalendarProvider } from '../CalendarProvider'
import type { CalendarProviderProps } from '../CalendarProvider'
import { LOCALIZER_CASES } from '../testing/localizers'
import Calendar from './Calendar.component'

interface Event {
  id: number
  title: string
  start: string
  end: string
}

const focus = '2026-06-15'
const NOW = '2026-06-15T12:00:00.000Z'
const events: Event[] = [
  { id: 1, title: 'Standup', start: '2026-06-15T09:00:00.000Z', end: '2026-06-15T10:00:00.000Z' },
  { id: 2, title: 'Review', start: '2026-06-16T11:00:00.000Z', end: '2026-06-16T12:00:00.000Z' },
]

describe.each(LOCALIZER_CASES)('Calendar [$name]', ({ create }) => {
  let localizer: Awaited<ReturnType<typeof create>>
  beforeAll(async () => {
    localizer = await create()
  })

  function renderCalendar({
    toolbar,
    ...provider
  }: { toolbar?: boolean } & Partial<CalendarProviderProps<Event>> = {}) {
    return render(
      <CalendarProvider<Event>
        localizer={localizer}
        defaultDate={focus}
        defaultView={Views.MONTH}
        events={events}
        getNow={() => NOW}
        {...provider}
      >
        <Calendar toolbar={toolbar} />
      </CalendarProvider>,
    )
  }

  it('renders the toolbar and the month view by default', () => {
    const { container } = renderCalendar()
    expect(container.querySelector('.bc-toolbar')).toBeTruthy()
    expect(container.querySelector('.bc-calendar')).toBeTruthy()
    expect(container.querySelector('.bc-month')).toBeTruthy()
  })

  it('renders the toolbar as a sibling outside .bc-calendar, with the view inside it', () => {
    const { container } = renderCalendar()
    const calendar = container.querySelector('.bc-calendar') as HTMLElement
    // Toolbar is not a descendant of `.bc-calendar` …
    expect(calendar.querySelector('.bc-toolbar')).toBeNull()
    // … and the active view is.
    expect(calendar.querySelector('.bc-month')).toBeTruthy()
  })

  it.each([Views.DAY, Views.WEEK, Views.WORK_WEEK])(
    'shows only the time grid for the %s view',
    (view) => {
      const { container } = renderCalendar({ defaultView: view })
      expect(container.querySelector('.bc-time-grid')).toBeTruthy()
      expect(container.querySelector('.bc-month')).toBeNull()
      expect(container.querySelector('.bc-agenda')).toBeNull()
    },
  )

  it('shows only the agenda view for the agenda view', () => {
    const { container } = renderCalendar({ defaultView: Views.AGENDA })
    expect(container.querySelector('.bc-agenda')).toBeTruthy()
    expect(container.querySelector('.bc-month')).toBeNull()
    expect(container.querySelector('.bc-time-grid')).toBeNull()
  })

  it('omits the toolbar when toolbar is false but still renders the view', () => {
    const { container } = renderCalendar({ toolbar: false })
    expect(container.querySelector('.bc-toolbar')).toBeNull()
    expect(container.querySelector('.bc-month')).toBeTruthy()
  })
})
