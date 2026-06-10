import { act, fireEvent, render } from '@testing-library/react'
import { beforeAll, describe, expect, it } from 'vitest'
import { CalendarProvider } from './CalendarProvider'
import { LOCALIZER_CASES } from './testing/localizers'
import { useKeyboardDnd } from './useKeyboardDnd'

const DAY = '2026-06-15T00:00:00.000Z'
const { create } = LOCALIZER_CASES[0]!

interface Event {
  id: number
  title: string
  start: string
  end: string
}

/** One timed event: 09:00–10:00 on the focus day. */
const EVENTS: Event[] = [
  { id: 1, title: 'Standup', start: '2026-06-15T09:00:00.000Z', end: '2026-06-15T10:00:00.000Z' },
]

/** Minimal time-grid surface with the grabbable container and one event button. */
function TimeGridSurface() {
  const { onKeyDownCapture, announcement } = useKeyboardDnd({ mode: 'time' })
  return (
    <div data-testid="root" onKeyDownCapture={onKeyDownCapture}>
      <div className="bc-time-body" data-testid="body">
        <button type="button" data-bc-event="1" data-testid="evt">
          Standup
        </button>
      </div>
      <div aria-live="polite" data-testid="announce">
        {announcement}
      </div>
    </div>
  )
}

/** Minimal month-grid surface. */
function MonthGridSurface() {
  const { onKeyDownCapture, announcement } = useKeyboardDnd({ mode: 'day' })
  return (
    <div data-testid="root" onKeyDownCapture={onKeyDownCapture}>
      <div className="bc-month-grid" data-testid="body">
        <button type="button" data-bc-event="1" data-testid="evt">
          Standup
        </button>
      </div>
      <div aria-live="polite" data-testid="announce">
        {announcement}
      </div>
    </div>
  )
}

describe('useKeyboardDnd', () => {
  let localizer: Awaited<ReturnType<typeof create>>
  beforeAll(async () => {
    localizer = await create()
  })

  function renderTime() {
    return render(
      <CalendarProvider<Event> localizer={localizer} defaultDate={DAY} events={EVENTS} step={30}>
        <TimeGridSurface />
      </CalendarProvider>,
    )
  }

  function renderMonth() {
    return render(
      <CalendarProvider<Event> localizer={localizer} defaultDate={DAY} events={EVENTS}>
        <MonthGridSurface />
      </CalendarProvider>,
    )
  }

  /**
   * Dispatch a key event on the event button (capture-phase handler on root sees
   * e.target = evt, so the grabbable check resolves). All subsequent presses also
   * fire on the event button — same pattern used by the MonthView integration tests.
   */
  const press = (btn: HTMLElement, key: string, opts: { shiftKey?: boolean; altKey?: boolean } = {}) =>
    act(() => void fireEvent.keyDown(btn, { key, ...opts }))

  // ── time-grid mode ──────────────────────────────────────────────────────────

  it('time-grid: Space picks up the event', () => {
    const { getByTestId } = renderTime()
    press(getByTestId('evt'), ' ')
    expect(getByTestId('announce').textContent).toMatch(/Picked up/)
  })

  it('time-grid: Shift+↑ shrinks the end edge by one slot', () => {
    const { getByTestId } = renderTime()
    const evt = getByTestId('evt')
    press(evt, ' ')
    press(evt, 'ArrowUp', { shiftKey: true })
    // end moved from 10:00 to 9:30; start stays at 9:00
    const text = getByTestId('announce').textContent ?? ''
    expect(text).toMatch(/9:00/)
    expect(text).toMatch(/9:30/)
  })

  it('time-grid: Shift+Alt+↑ moves the start edge earlier by one slot', () => {
    const { getByTestId } = renderTime()
    const evt = getByTestId('evt')
    press(evt, ' ')
    press(evt, 'ArrowUp', { shiftKey: true, altKey: true })
    // start moved from 9:00 to 8:30; end stays at 10:00
    const text = getByTestId('announce').textContent ?? ''
    expect(text).toMatch(/8:30/)
    expect(text).toMatch(/10:00/)
  })

  it('time-grid: Shift+Alt+↓ moves the start edge later by one slot', () => {
    const { getByTestId } = renderTime()
    const evt = getByTestId('evt')
    press(evt, ' ')
    press(evt, 'ArrowDown', { shiftKey: true, altKey: true })
    // start moved from 9:00 to 9:30; end stays at 10:00
    const text = getByTestId('announce').textContent ?? ''
    expect(text).toMatch(/9:30/)
    expect(text).toMatch(/10:00/)
  })

  it('time-grid: Shift+Alt+↓ clamps start to one slot before end', () => {
    const { getByTestId } = renderTime()
    const evt = getByTestId('evt')
    press(evt, ' ')
    // Push start forward many times — must not cross or equal end
    act(() => {
      for (let i = 0; i < 10; i++) {
        fireEvent.keyDown(evt, { key: 'ArrowDown', shiftKey: true, altKey: true })
      }
    })
    // After clamping: start = end - 30 = 9:30, end = 10:00
    const text = getByTestId('announce').textContent ?? ''
    expect(text).toMatch(/9:30/)
    expect(text).toMatch(/10:00/)
  })

  // ── month/day mode ──────────────────────────────────────────────────────────

  it('month: Shift+Alt+← moves the start edge one day earlier', () => {
    const { getByTestId } = renderMonth()
    const evt = getByTestId('evt')
    press(evt, ' ')
    press(evt, 'ArrowLeft', { shiftKey: true, altKey: true })
    // start moved from Jun 15 to Jun 14; end stays Jun 15 → "Jun 14 to Jun 15"
    expect(getByTestId('announce').textContent).toMatch(/Jun 14/)
  })

  it('month: Shift+Alt+→ clamps start to same day as end', () => {
    const { getByTestId } = renderMonth()
    const evt = getByTestId('evt')
    press(evt, ' ')
    // Would move start to Jun 16, past end Jun 15 → clamped to Jun 15
    press(evt, 'ArrowRight', { shiftKey: true, altKey: true })
    // start and end both on Jun 15 after clamp
    expect(getByTestId('announce').textContent).toMatch(/Jun 15/)
  })

  it('month: Shift+Alt+↑ moves the start edge one week earlier', () => {
    const { getByTestId } = renderMonth()
    const evt = getByTestId('evt')
    press(evt, ' ')
    press(evt, 'ArrowUp', { shiftKey: true, altKey: true })
    // start moved from Jun 15 to Jun 8
    expect(getByTestId('announce').textContent).toMatch(/Jun 8/)
  })

  it('month: Shift+Alt+↓ clamps start when pushed past end', () => {
    const { getByTestId } = renderMonth()
    const evt = getByTestId('evt')
    press(evt, ' ')
    // Would move start to Jun 22, past end Jun 15 → clamped to Jun 15
    press(evt, 'ArrowDown', { shiftKey: true, altKey: true })
    // start and end both on Jun 15 after clamp
    expect(getByTestId('announce').textContent).toMatch(/Jun 15/)
  })
})
