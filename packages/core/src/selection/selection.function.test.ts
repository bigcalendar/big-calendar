import { describe, expect, it, vi } from 'vitest'
import { createSelection } from './selection.function'

describe('createSelection', () => {
  it('starts idle with a null range', () => {
    const sel = createSelection()
    expect(sel.state.value).toEqual({ status: 'idle' })
    expect(sel.range.value).toBeNull()
  })

  it('tracks a drag from anchor to head, normalizing the range', () => {
    const sel = createSelection()
    sel.start({ slot: 5 })
    expect(sel.range.value).toEqual({ start: 5, end: 5 })
    sel.to({ slot: 2 }) // drag backwards → range normalizes
    expect(sel.range.value).toEqual({ start: 2, end: 5 })
  })

  it('commits a drag selection via complete and returns to idle', () => {
    const onSelect = vi.fn()
    const sel = createSelection({ onSelect })
    sel.start({ slot: 3 })
    sel.to({ slot: 6 })
    sel.complete()
    expect(onSelect).toHaveBeenCalledWith({ start: 3, end: 6, action: 'select' })
    expect(sel.state.value).toEqual({ status: 'idle' })
    expect(sel.range.value).toBeNull()
  })

  it('fires onSelecting on start and each extension', () => {
    const onSelecting = vi.fn()
    const sel = createSelection({ onSelecting })
    sel.start({ slot: 1 })
    sel.to({ slot: 4 })
    expect(onSelecting).toHaveBeenNthCalledWith(1, { start: 1, end: 1 })
    expect(onSelecting).toHaveBeenNthCalledWith(2, { start: 1, end: 4 })
  })

  it('vetoes a start when onSelecting returns false', () => {
    const sel = createSelection({ onSelecting: () => false })
    sel.start({ slot: 2 })
    expect(sel.state.value).toEqual({ status: 'idle' })
    expect(sel.range.value).toBeNull()
  })

  it('vetoes an extension, leaving the head unchanged', () => {
    const onSelecting = vi.fn((r: { start: number; end: number }) => r.end <= 5)
    const sel = createSelection({ onSelecting })
    sel.start({ slot: 3 })
    sel.to({ slot: 5 })
    sel.to({ slot: 9 }) // end 9 > 5 → vetoed
    expect(sel.range.value).toEqual({ start: 3, end: 5 })
  })

  it('ignores to/complete when not selecting', () => {
    const onSelect = vi.fn()
    const sel = createSelection({ onSelect })
    sel.to({ slot: 4 })
    sel.complete()
    expect(onSelect).not.toHaveBeenCalled()
    expect(sel.state.value).toEqual({ status: 'idle' })
  })

  it('commits a single-slot click selection', () => {
    const onSelect = vi.fn()
    const sel = createSelection({ onSelect })
    sel.click({ slot: 7 })
    expect(onSelect).toHaveBeenCalledWith({ start: 7, end: 7, action: 'click' })
  })

  it('cancel aborts a drag without firing onSelect', () => {
    const onSelect = vi.fn()
    const sel = createSelection({ onSelect })
    sel.start({ slot: 1 })
    sel.to({ slot: 3 })
    sel.cancel()
    expect(onSelect).not.toHaveBeenCalled()
    expect(sel.range.value).toBeNull()
  })

  it('disables start and click when selectable is false', () => {
    const onSelect = vi.fn()
    const sel = createSelection({ selectable: false, onSelect })
    sel.start({ slot: 1 })
    sel.click({ slot: 2 })
    expect(sel.state.value).toEqual({ status: 'idle' })
    expect(onSelect).not.toHaveBeenCalled()
  })

  it("treats 'ignoreEvents' as enabled", () => {
    const sel = createSelection({ selectable: 'ignoreEvents' })
    sel.start({ slot: 1 })
    expect(sel.range.value).toEqual({ start: 1, end: 1 })
  })
})
