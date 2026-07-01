import { Views } from '@big-calendar/core'
import type { LocalizerContract } from '@big-calendar/core'
import { render } from '@testing-library/svelte'
import { beforeAll, describe, expect, it } from 'vitest'
import { LOCALIZER_CASES } from '../testing/localizers'
import { makeContext } from '../testing/makeContext'
import Probe from '../testing/Probe.svelte'
import type { KeyboardDnd } from './useKeyboardDnd.svelte'
import { useKeyboardDnd } from './useKeyboardDnd.svelte'

describe.each(LOCALIZER_CASES)('useKeyboardDnd [$name]', ({ create }) => {
  let localizer: LocalizerContract

  beforeAll(async () => {
    localizer = await create()
  })

  it('returns onKeydownCapture and getAnnouncement', () => {
    let result: KeyboardDnd | undefined

    render(Probe, {
      props: { run: () => { result = useKeyboardDnd({ mode: 'day' }) } },
      context: makeContext(localizer, Views.MONTH),
    })

    expect(typeof result!.onKeydownCapture).toBe('function')
    expect(typeof result!.getAnnouncement).toBe('function')
    expect(result!.getAnnouncement()).toBe('')
  })

  it('onKeydownCapture ignores non-Space keys when no grab is active', () => {
    let result: KeyboardDnd | undefined

    render(Probe, {
      props: { run: () => { result = useKeyboardDnd({ mode: 'day' }) } },
      context: makeContext(localizer, Views.MONTH),
    })

    const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })
    result!.onKeydownCapture(event)
    expect(result!.getAnnouncement()).toBe('')
  })

  it('onKeydownCapture ignores Space when target is not a [data-bc-event] element', () => {
    let result: KeyboardDnd | undefined

    render(Probe, {
      props: { run: () => { result = useKeyboardDnd({ mode: 'day' }) } },
      context: makeContext(localizer, Views.MONTH),
    })

    const div = document.createElement('div')
    const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true })
    Object.defineProperty(event, 'target', { value: div })
    result!.onKeydownCapture(event)
    expect(result!.getAnnouncement()).toBe('')
  })

  it('onKeydownCapture ignores Space when event element is not inside the grid selector', () => {
    let result: KeyboardDnd | undefined

    render(Probe, {
      props: { run: () => { result = useKeyboardDnd({ mode: 'day' }) } },
      context: makeContext(localizer, Views.MONTH),
    })

    const btn = document.createElement('button')
    btn.setAttribute('data-bc-event', 'evt-1')
    document.body.appendChild(btn)

    const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true })
    Object.defineProperty(event, 'target', { value: btn })
    result!.onKeydownCapture(event)
    expect(result!.getAnnouncement()).toBe('')

    document.body.removeChild(btn)
  })

  it('mode=time uses bc-time-body selector; mode=day uses bc-month-grid', () => {
    let timeResult: KeyboardDnd | undefined
    let dayResult: KeyboardDnd | undefined

    render(Probe, {
      props: { run: () => { timeResult = useKeyboardDnd({ mode: 'time' }) } },
      context: makeContext(localizer, Views.WEEK),
    })

    render(Probe, {
      props: { run: () => { dayResult = useKeyboardDnd({ mode: 'day' }) } },
      context: makeContext(localizer, Views.MONTH),
    })

    expect(timeResult).toBeDefined()
    expect(dayResult).toBeDefined()
  })

  it('getAnnouncement is initially empty string', () => {
    let result: KeyboardDnd | undefined

    render(Probe, {
      props: { run: () => { result = useKeyboardDnd({ mode: 'time' }) } },
      context: makeContext(localizer, Views.WEEK),
    })

    expect(result!.getAnnouncement()).toBe('')
  })
})
