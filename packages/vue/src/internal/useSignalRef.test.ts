import { signal } from '@preact/signals-core'
import { defineComponent, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { useSignalRef } from './useSignalRef'

describe('useSignalRef', () => {
  it('initialises with the signal current value', () => {
    const s = signal(42)
    let ref: ReturnType<typeof useSignalRef<number>> | undefined

    mount(defineComponent({
      setup() {
        ref = useSignalRef(s)
        return () => null
      },
    }))

    expect(ref!.value).toBe(42)
  })

  it('updates the ref when the signal changes', async () => {
    const s = signal('hello')
    let ref: ReturnType<typeof useSignalRef<string>> | undefined

    mount(defineComponent({
      setup() {
        ref = useSignalRef(s)
        return () => null
      },
    }))

    s.value = 'world'
    await nextTick()

    expect(ref!.value).toBe('world')
  })

  it('tears down the subscription when the component unmounts', async () => {
    const s = signal(0)
    let ref: ReturnType<typeof useSignalRef<number>> | undefined

    const wrapper = mount(defineComponent({
      setup() {
        ref = useSignalRef(s)
        return () => null
      },
    }))

    await wrapper.unmount()

    const before = ref!.value
    s.value = 99
    await nextTick()

    // After unmount the ref is no longer subscribed — it keeps its last value.
    expect(ref!.value).toBe(before)
  })
})

describe('useSignalRef — outside component', () => {
  let originalConsoleWarn: typeof console.warn

  beforeEach(() => {
    originalConsoleWarn = console.warn
    console.warn = () => {}
  })

  it('works without a component instance (no onUnmounted registration)', () => {
    const s = signal('a')
    const ref = useSignalRef(s)
    expect(ref.value).toBe('a')
    s.value = 'b'
    expect(ref.value).toBe('b')
    console.warn = originalConsoleWarn
  })
})
