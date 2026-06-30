import { vi } from 'vitest'

if (typeof globalThis.ResizeObserver === 'undefined') {
  vi.stubGlobal('ResizeObserver', class {
    observe() {}
    unobserve() {}
    disconnect() {}
  })
}

if (typeof globalThis.customElements === 'undefined') {
  vi.stubGlobal('customElements', {
    define: vi.fn(),
    get: vi.fn(),
    whenDefined: vi.fn().mockResolvedValue(undefined),
  })
}
