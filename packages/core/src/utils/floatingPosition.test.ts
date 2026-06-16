// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { positionFloating } from './floatingPosition'

/** A detached element with a stubbed, deterministic bounding rect. */
function elementWithRect(rect: Partial<DOMRect>): HTMLElement {
  const node = document.createElement('div')
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
  document.body.appendChild(node)
  return node
}

describe('positionFloating', () => {
  it('computes a viewport position from the anchor rect with default options', async () => {
    const anchor = elementWithRect({ x: 100, y: 200, width: 50, height: 20 })
    const floating = elementWithRect({ width: 120, height: 80 })

    const position = await positionFloating(anchor, floating)

    expect(typeof position.x).toBe('number')
    expect(typeof position.y).toBe('number')
    expect(position.placement).toBeTruthy()
    // maxInlineSize is set directly; availableHeight goes to --bc-float-avail-h so
    // class-level min() rules can reference it without being overridden by inline styles.
    expect(floating.style.maxInlineSize).toMatch(/px$/)
    expect(floating.style.getPropertyValue('--bc-float-avail-h')).toMatch(/px$/)
  })

  it('honors an explicit placement + offset and reuses the cached module', async () => {
    const anchor = elementWithRect({ x: 10, y: 10, width: 40, height: 40 })
    const floating = elementWithRect({ width: 60, height: 30 })

    const position = await positionFloating(anchor, floating, { placement: 'top-end', offset: 12 })

    expect(typeof position.x).toBe('number')
    expect(typeof position.y).toBe('number')
  })
})
