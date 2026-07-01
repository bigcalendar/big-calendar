import { signal } from '@preact/signals-core'
import { tick } from 'svelte'
import { render } from '@testing-library/svelte'
import { describe, expect, it } from 'vitest'
import Probe from '../testing/Probe.svelte'
import { fromSignal } from './fromSignal.svelte'

describe('fromSignal', () => {
  it('initialises with the signal current value', () => {
    const s = signal(42)
    let box: { readonly current: number } | undefined

    render(Probe, { props: { run: () => { box = fromSignal(s) } } })

    expect(box!.current).toBe(42)
  })

  it('updates .current when the signal changes', async () => {
    const s = signal('hello')
    let box: { readonly current: string } | undefined

    render(Probe, { props: { run: () => { box = fromSignal(s) } } })

    s.value = 'world'
    await tick()

    expect(box!.current).toBe('world')
  })

  it('tears down the subscription when the component unmounts', async () => {
    const s = signal(0)
    let box: { readonly current: number } | undefined

    const { unmount } = render(Probe, { props: { run: () => { box = fromSignal(s) } } })

    await unmount()

    const before = box!.current
    s.value = 99
    await tick()

    expect(box!.current).toBe(before)
  })

  it('initialises to the signal value at call time', () => {
    const s = signal('a')
    s.value = 'b'
    let box: { readonly current: string } | undefined

    render(Probe, { props: { run: () => { box = fromSignal(s) } } })

    expect(box!.current).toBe('b')
  })
})
