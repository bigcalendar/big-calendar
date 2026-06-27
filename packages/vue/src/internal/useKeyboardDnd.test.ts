import { Views } from '@big-calendar/core'
import type { LocalizerContract } from '@big-calendar/core'
import { defineComponent, h } from 'vue'
import type { Component } from 'vue'
import { mount } from '@vue/test-utils'
import { beforeAll, describe, expect, it } from 'vitest'
import CalendarProvider from '../CalendarProvider/CalendarProvider.vue'
import { LOCALIZER_CASES } from '../testing/localizers'
import { useKeyboardDnd } from './useKeyboardDnd'
import type { KeyboardDnd } from './useKeyboardDnd'

function makeWrapper(
  localizer: LocalizerContract,
  child: ReturnType<typeof defineComponent>,
  defaultView = Views.MONTH,
) {
  return mount(
    defineComponent({
      setup() {
        return () =>
          h(CalendarProvider as Component, { localizer, defaultView }, {
            default: () => h(child),
          })
      },
    }),
  )
}

describe.each(LOCALIZER_CASES)('useKeyboardDnd [$name]', ({ create }) => {
  let localizer: LocalizerContract

  beforeAll(async () => {
    localizer = await create()
  })

  it('returns onKeydownCapture and announcement ref', () => {
    let result: KeyboardDnd | undefined

    const Probe = defineComponent({
      setup() {
        result = useKeyboardDnd({ mode: 'day' })
        return () => null
      },
    })

    makeWrapper(localizer, Probe)
    expect(typeof result!.onKeydownCapture).toBe('function')
    expect(result!.announcement).toBeDefined()
    expect(result!.announcement.value).toBe('')
  })

  it('onKeydownCapture ignores non-Space keys when no grab is active', () => {
    let result: KeyboardDnd | undefined

    const Probe = defineComponent({
      setup() {
        result = useKeyboardDnd({ mode: 'day' })
        return () => null
      },
    })

    makeWrapper(localizer, Probe)

    const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })
    result!.onKeydownCapture(event)
    expect(result!.announcement.value).toBe('')
  })

  it('onKeydownCapture ignores Space when target is not a [data-bc-event] element', () => {
    let result: KeyboardDnd | undefined

    const Probe = defineComponent({
      setup() {
        result = useKeyboardDnd({ mode: 'day' })
        return () => null
      },
    })

    makeWrapper(localizer, Probe)

    const div = document.createElement('div')
    const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true })
    Object.defineProperty(event, 'target', { value: div })
    result!.onKeydownCapture(event)
    expect(result!.announcement.value).toBe('')
  })

  it('onKeydownCapture ignores Space when event element is not inside the grid selector', () => {
    let result: KeyboardDnd | undefined

    const Probe = defineComponent({
      setup() {
        result = useKeyboardDnd({ mode: 'day' })
        return () => null
      },
    })

    makeWrapper(localizer, Probe)

    // Event button not inside .bc-month-grid
    const btn = document.createElement('button')
    btn.setAttribute('data-bc-event', 'evt-1')
    document.body.appendChild(btn)

    const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true })
    Object.defineProperty(event, 'target', { value: btn })
    result!.onKeydownCapture(event)
    expect(result!.announcement.value).toBe('')

    document.body.removeChild(btn)
  })

  it('mode=time uses bc-time-body selector; mode=day uses bc-month-grid', () => {
    let timeResult: KeyboardDnd | undefined
    let dayResult: KeyboardDnd | undefined

    const TimeProbe = defineComponent({
      setup() {
        timeResult = useKeyboardDnd({ mode: 'time' })
        return () => null
      },
    })
    const DayProbe = defineComponent({
      setup() {
        dayResult = useKeyboardDnd({ mode: 'day' })
        return () => null
      },
    })

    makeWrapper(localizer, TimeProbe, Views.WEEK)
    makeWrapper(localizer, DayProbe, Views.MONTH)

    // Both should exist and not throw
    expect(timeResult).toBeDefined()
    expect(dayResult).toBeDefined()
  })

  it('announcement is initially empty string', () => {
    let result: KeyboardDnd | undefined

    const Probe = defineComponent({
      setup() {
        result = useKeyboardDnd({ mode: 'time' })
        return () => null
      },
    })

    makeWrapper(localizer, Probe, Views.WEEK)
    expect(result!.announcement.value).toBe('')
  })
})
