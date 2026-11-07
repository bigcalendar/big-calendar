// Binding tests run in real browsers through Playwright, never jsdom (D-42). This guards that: the
// platform features the calendar relies on only exist in a real engine.
import { describe, expect, it } from 'vitest'

describe('test environment', () => {
  it('is a real browser engine, not jsdom', () => {
    expect(navigator.userAgent).not.toMatch(/jsdom/i)
    expect(CSS.supports('display: grid')).toBe(true)
    expect(typeof HTMLElement.prototype.showPopover).toBe('function')
  })
})
