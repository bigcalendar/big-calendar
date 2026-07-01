import 'zone.js'
import 'zone.js/plugins/sync-test'
import 'zone.js/plugins/proxy'
import 'zone.js/testing'
import { setupTestBed } from '@analogjs/vitest-angular/setup-testbed'
import { vi } from 'vitest'

setupTestBed({ zoneless: false })

if (typeof globalThis.ResizeObserver === 'undefined') {
  vi.stubGlobal('ResizeObserver', class {
    observe() {}
    unobserve() {}
    disconnect() {}
  })
}
