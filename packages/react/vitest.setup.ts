import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// jsdom does not implement ResizeObserver — install a no-op stub so components
// that use it (e.g. useMonthRowMeasure) mount without throwing.
if (typeof globalThis.ResizeObserver === 'undefined') {
  vi.stubGlobal('ResizeObserver', class {
    observe() {}
    unobserve() {}
    disconnect() {}
  })
}

// Unmount React trees between tests so the jsdom document stays clean.
afterEach(() => {
  cleanup()
})
