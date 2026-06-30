import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import './CalendarElement'

describe('CalendarElement', () => {
  let container: HTMLDivElement

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(() => {
    document.body.removeChild(container)
  })

  it('is defined as a custom element', () => {
    expect(customElements.get('bc-calendar')).toBeDefined()
  })

  it('can be created', () => {
    const el = document.createElement('bc-calendar')
    expect(el).toBeTruthy()
  })

  it('can be connected to the DOM', () => {
    const el = document.createElement('bc-calendar')
    container.appendChild(el)
    expect(el.isConnected).toBe(true)
  })

  it('can be disconnected from the DOM', () => {
    const el = document.createElement('bc-calendar')
    container.appendChild(el)
    container.removeChild(el)
    expect(el.isConnected).toBe(false)
  })

  it('accepts localizer property', () => {
    const el = document.createElement('bc-calendar') as HTMLElement & { localizer: unknown }
    const fakeLoc = { format: () => '' }
    el.localizer = fakeLoc
    expect(el.localizer).toBe(fakeLoc)
  })

  it('accepts events property', () => {
    const el = document.createElement('bc-calendar') as HTMLElement & { events: unknown[] }
    el.events = [{ id: 1, title: 'Test' }]
    expect(el.events).toHaveLength(1)
  })

  it('accepts view property', () => {
    const el = document.createElement('bc-calendar') as HTMLElement & { view: string }
    el.view = 'month'
    expect(el.view).toBe('month')
  })

  it('accepts callback properties', () => {
    const el = document.createElement('bc-calendar') as HTMLElement & { onNavigate: unknown }
    const fn = () => undefined
    el.onNavigate = fn
    expect(el.onNavigate).toBe(fn)
  })
})
