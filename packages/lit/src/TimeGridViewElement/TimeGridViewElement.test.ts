import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import './TimeGridViewElement'

describe('TimeGridViewElement', () => {
  let container: HTMLDivElement

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(() => {
    document.body.removeChild(container)
  })

  it('is defined as a custom element', () => {
    expect(customElements.get('bc-time-grid-view')).toBeDefined()
  })

  it('can be created', () => {
    const el = document.createElement('bc-time-grid-view')
    expect(el).toBeTruthy()
  })

  it('can be connected to the DOM', () => {
    const el = document.createElement('bc-time-grid-view')
    container.appendChild(el)
    expect(el.isConnected).toBe(true)
  })

  it('can be disconnected cleanly', () => {
    const el = document.createElement('bc-time-grid-view')
    container.appendChild(el)
    container.removeChild(el)
    expect(el.isConnected).toBe(false)
  })

  it('renders nothing when no context is provided', () => {
    const el = document.createElement('bc-time-grid-view')
    container.appendChild(el)
    expect(el.children.length).toBe(0)
  })
})
