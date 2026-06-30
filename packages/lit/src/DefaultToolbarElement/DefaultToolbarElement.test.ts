import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { LitElement } from 'lit'
import './DefaultToolbarElement'

describe('DefaultToolbarElement', () => {
  let container: HTMLDivElement

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(() => {
    document.body.removeChild(container)
  })

  it('is defined as a custom element', () => {
    expect(customElements.get('bc-default-toolbar')).toBeDefined()
  })

  it('can be created', () => {
    const el = document.createElement('bc-default-toolbar')
    expect(el).toBeTruthy()
  })

  it('can be connected to the DOM', () => {
    const el = document.createElement('bc-default-toolbar')
    container.appendChild(el)
    expect(el.isConnected).toBe(true)
  })

  it('can be disconnected cleanly', () => {
    const el = document.createElement('bc-default-toolbar')
    container.appendChild(el)
    container.removeChild(el)
    expect(el.isConnected).toBe(false)
  })

  it('renders toolbar structure without context', async () => {
    const el = document.createElement('bc-default-toolbar') as LitElement
    container.appendChild(el)
    await el.updateComplete
    const toolbar = el.querySelector('.bc-toolbar')
    expect(toolbar).not.toBeNull()
  })
})
