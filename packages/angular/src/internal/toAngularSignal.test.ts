import { signal as preactSignal } from '@preact/signals-core'
import {
  EnvironmentInjector,
  createEnvironmentInjector,
  runInInjectionContext,
} from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { describe, expect, it } from 'vitest'
import { toAngularSignal } from './toAngularSignal'

describe('toAngularSignal', () => {

  it('returns the current value of the preact signal', () => {
    const s = preactSignal(42)
    const sig = TestBed.runInInjectionContext(() => toAngularSignal(s))
    expect(sig()).toBe(42)
  })

  it('updates when the preact signal changes', () => {
    const s = preactSignal('hello')
    const sig = TestBed.runInInjectionContext(() => toAngularSignal(s))
    s.value = 'world'
    expect(sig()).toBe('world')
  })

  it('tracks multiple sequential updates', () => {
    const s = preactSignal(0)
    const sig = TestBed.runInInjectionContext(() => toAngularSignal(s))

    s.value = 1
    s.value = 2
    s.value = 3

    expect(sig()).toBe(3)
  })

  it('returns a read-only Angular signal', () => {
    const s = preactSignal(true)
    const sig = TestBed.runInInjectionContext(() => toAngularSignal(s))
    expect(typeof sig).toBe('function')
    expect('set' in sig).toBe(false)
  })

  it('stops updating after the injector is destroyed', () => {
    const s = preactSignal(1)
    const parentInjector = TestBed.inject(EnvironmentInjector)
    const envInjector = createEnvironmentInjector([], parentInjector)

    const sig = runInInjectionContext(envInjector, () => toAngularSignal(s))
    expect(sig()).toBe(1)

    s.value = 2
    expect(sig()).toBe(2)

    envInjector.destroy()

    s.value = 99
    expect(sig()).toBe(2)
  })
})
