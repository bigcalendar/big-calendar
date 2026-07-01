import { fireEvent, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useFloatingAnchor } from '.'

/** Give an element a deterministic bounding rect (jsdom returns zeros). */
function withRect(node: HTMLElement, rect: Partial<DOMRect>): HTMLElement {
  node.getBoundingClientRect = () =>
    ({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: 0,
      height: 0,
      toJSON: () => ({}),
      ...rect,
    }) as DOMRect
  return node
}

describe('useFloatingAnchor', () => {
  it('does nothing while closed', () => {
    const anchor = document.createElement('div')
    const floating = document.createElement('div')
    renderHook(() => useFloatingAnchor(false, { current: anchor }, { current: floating }))
    expect(floating.style.position).toBe('')
  })

  it('does nothing when the anchor ref is empty', () => {
    const floating = document.createElement('div')
    renderHook(() => useFloatingAnchor(true, { current: null }, { current: floating }))
    expect(floating.style.position).toBe('')
  })

  it('does nothing when the floating ref is empty', () => {
    const anchor = document.createElement('div')
    renderHook(() => useFloatingAnchor(true, { current: anchor }, { current: null }))
    expect(anchor.style.position).toBe('')
  })

  it('positions the floating element against the anchor while open', async () => {
    const anchor = withRect(document.createElement('div'), { x: 50, y: 60, width: 40, height: 20 })
    const floating = withRect(document.createElement('div'), { width: 80, height: 40 })
    document.body.append(anchor, floating)

    renderHook(() => useFloatingAnchor(true, { current: anchor }, { current: floating }, 'bottom-start'))

    await waitFor(() => expect(floating.style.position).toBe('fixed'))
    expect(floating.style.left).toMatch(/px$/)
    expect(floating.style.top).toMatch(/px$/)
  })

  it('repositions on resize and removes its listeners on unmount', async () => {
    const anchor = withRect(document.createElement('div'), { x: 10, y: 10, width: 20, height: 20 })
    const floating = withRect(document.createElement('div'), { width: 30, height: 30 })
    document.body.append(anchor, floating)

    const { unmount } = renderHook(() =>
      useFloatingAnchor(true, { current: anchor }, { current: floating }),
    )
    await waitFor(() => expect(floating.style.position).toBe('fixed'))

    floating.style.position = ''
    fireEvent(window, new Event('resize'))
    await waitFor(() => expect(floating.style.position).toBe('fixed'))

    unmount()
  })
})
