import { act, fireEvent, render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useEventRoving } from './useEventRoving'

/** A view-root stand-in: a stray slot cell plus `count` event buttons. */
function Surface({ count = 3 }: { count?: number }) {
  const roving = useEventRoving()
  return (
    <div
      data-testid="root"
      ref={roving.containerRef}
      onKeyDown={roving.onKeyDown}
      onFocusCapture={roving.onFocusCapture}
    >
      {/* A slot cell (not an event) — arrow/focus on it must be ignored. */}
      <div data-testid="cell" data-slot-index="0" tabIndex={0} />
      {Array.from({ length: count }, (_, i) => (
        <button key={i} type="button" data-testid={`evt${i}`} data-bc-event={String(i + 1)}>
          e{i}
        </button>
      ))}
    </div>
  )
}

describe('useEventRoving', () => {
  const focus = (el: Element) => act(() => (el as HTMLElement).focus())

  it('makes the event buttons a single tab stop', () => {
    const { getByTestId } = render(<Surface />)
    expect(getByTestId('evt0').tabIndex).toBe(0)
    expect(getByTestId('evt1').tabIndex).toBe(-1)
    expect(getByTestId('evt2').tabIndex).toBe(-1)
  })

  it('moves focus + the tab stop among buttons with the arrows', () => {
    const { getByTestId } = render(<Surface />)
    focus(getByTestId('evt0'))
    fireEvent.keyDown(getByTestId('evt0'), { key: 'ArrowRight' })
    expect(document.activeElement).toBe(getByTestId('evt1'))
    expect(getByTestId('evt1').tabIndex).toBe(0)
    expect(getByTestId('evt0').tabIndex).toBe(-1)

    fireEvent.keyDown(getByTestId('evt1'), { key: 'ArrowDown' }) // forward
    expect(document.activeElement).toBe(getByTestId('evt2'))
    fireEvent.keyDown(getByTestId('evt2'), { key: 'ArrowUp' }) // back
    expect(document.activeElement).toBe(getByTestId('evt1'))
    fireEvent.keyDown(getByTestId('evt1'), { key: 'ArrowLeft' }) // back
    expect(document.activeElement).toBe(getByTestId('evt0'))
  })

  it('does not move past either end', () => {
    const { getByTestId } = render(<Surface />)
    focus(getByTestId('evt0'))
    fireEvent.keyDown(getByTestId('evt0'), { key: 'ArrowLeft' }) // already first
    expect(document.activeElement).toBe(getByTestId('evt0'))
    focus(getByTestId('evt2'))
    fireEvent.keyDown(getByTestId('evt2'), { key: 'ArrowRight' }) // already last
    expect(document.activeElement).toBe(getByTestId('evt2'))
  })

  it('keeps the tab stop on the focused button', () => {
    const { getByTestId } = render(<Surface />)
    focus(getByTestId('evt2'))
    expect(getByTestId('evt2').tabIndex).toBe(0)
    expect(getByTestId('evt0').tabIndex).toBe(-1)
  })

  it('ignores arrows + focus that are not on an event button', () => {
    const { getByTestId } = render(<Surface />)
    focus(getByTestId('cell'))
    // The slot cell is the active element, but it is not an event button.
    fireEvent.keyDown(getByTestId('cell'), { key: 'ArrowRight' })
    expect(document.activeElement).toBe(getByTestId('cell'))
    // The tab stop is unchanged (still the first event button).
    expect(getByTestId('evt0').tabIndex).toBe(0)
  })

  it('ignores keys it does not handle', () => {
    const { getByTestId } = render(<Surface />)
    focus(getByTestId('evt0'))
    fireEvent.keyDown(getByTestId('evt0'), { key: 'Enter' })
    fireEvent.keyDown(getByTestId('evt0'), { key: 'a' })
    expect(document.activeElement).toBe(getByTestId('evt0'))
  })

  it('handles a view with no events', () => {
    const { queryByTestId } = render(<Surface count={0} />)
    expect(queryByTestId('evt0')).toBeNull()
  })
})
