import { Navigate, Views, defineView } from '@big-calendar/core'
import { render } from '@testing-library/react'
import { beforeAll, describe, expect, it } from 'vitest'
import { CalendarProvider } from '../CalendarProvider'
import type { CalendarProviderProps } from '../CalendarProvider'
import type { CustomViewProps } from '../components.type'
import { LOCALIZER_CASES } from '../testing/localizers'
import Calendar from './Calendar.component'

interface Event {
  id: number
  title: string
  start: string
  end: string
}

/** A minimal custom view: three days, with a tiny model the component reads back. */
interface ThreeDayModel {
  dayCount: number
}
const threeDay = defineView<Event>()({
  range: ({ localizer: l, date }) => {
    const start = l.startOf({ value: date, unit: 'day' })
    const last = l.add({ value: start, amount: 2, unit: 'day' })
    return { firstVisibleDay: start, lastVisibleDay: last, days: l.range({ start, end: last, unit: 'day' }) }
  },
  navigate: ({ localizer: l, date, direction }) =>
    l.add({ value: date, amount: direction === Navigate.NEXT ? 3 : -3, unit: 'day' }),
  label: () => '3-day',
  buildModel: ({ days }): ThreeDayModel => ({ dayCount: days.length }),
})
const threeDayRegistry = { '3day': threeDay }

function ThreeDayView({ model }: CustomViewProps) {
  const m = model as ThreeDayModel
  return (
    <div className="bc-3day" data-day-count={m.dayCount}>
      three-day view
    </div>
  )
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

  it('renders a registered custom view component for a kind:"custom" model', () => {
    const { container } = renderCalendar({
      defaultView: '3day',
      views: threeDayRegistry,
      components: { views: { '3day': ThreeDayView } },
    })
    const custom = container.querySelector('.bc-3day')
    expect(custom).toBeTruthy()
    expect(custom?.getAttribute('data-day-count')).toBe('3') // model reached the component
    // no built-in view renders for a custom view
    expect(container.querySelector('.bc-month')).toBeNull()
    expect(container.querySelector('.bc-time-grid')).toBeNull()
    expect(container.querySelector('.bc-agenda')).toBeNull()
  })

  it('renders nothing inside .bc-calendar when the custom view has no registered component', () => {
    const { container } = renderCalendar({ defaultView: '3day', views: threeDayRegistry })
    const calendar = container.querySelector('.bc-calendar') as HTMLElement
    expect(calendar).toBeTruthy()
    expect(calendar.querySelector('.bc-3day')).toBeNull()
    expect(calendar.querySelector('.bc-month')).toBeNull()
  })
})
