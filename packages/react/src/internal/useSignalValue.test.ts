import { computed, signal } from '@preact/signals-core'
import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useSignalValue } from './useSignalValue'

describe('useSignalValue', () => {
  it('returns the current signal value', () => {
    const count = signal(1)
    const { result } = renderHook(() => useSignalValue(count))
    expect(result.current).toBe(1)
  })

  it('re-renders when the signal changes', () => {
    const count = signal(1)
    const { result } = renderHook(() => useSignalValue(count))
    act(() => {
      count.value = 5
    })
    expect(result.current).toBe(5)
  })

  it('tracks a derived (computed) signal', () => {
    const count = signal(2)
    const doubled = computed(() => count.value * 2)
    const { result } = renderHook(() => useSignalValue(doubled))
    expect(result.current).toBe(4)
    act(() => {
      count.value = 3
    })
    expect(result.current).toBe(6)
  })

  it('unsubscribes on unmount', () => {
    const count = signal(0)
    const unsubscribe = vi.fn()
    const subscribe = vi.spyOn(count, 'subscribe').mockReturnValue(unsubscribe)
    const { unmount } = renderHook(() => useSignalValue(count))
    expect(subscribe).toHaveBeenCalled()
    unmount()
    expect(unsubscribe).toHaveBeenCalled()
  })
})
