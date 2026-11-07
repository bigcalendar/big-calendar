// The kernel runs without a DOM (D-41, code standard), so its tests run in Node, where any DOM use
// fails. This guards against the test environment being switched to a browser or jsdom.
import { describe, expect, it } from 'vitest'
import { EVENT_MIME_TYPE } from './index'

describe('test environment', () => {
  it('has no DOM', () => {
    expect(typeof document).toBe('undefined')
    expect(typeof window).toBe('undefined')
  })

  it('loads the package entry point', () => {
    expect(EVENT_MIME_TYPE).toBe('application/x-big-calendar-event+json')
  })
})
