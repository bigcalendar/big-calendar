import { Views } from '@big-calendar/core'
import type { LocalizerContract } from '@big-calendar/core'
import * as dndModule from '@big-calendar/dnd'
import { defineComponent, h, shallowRef } from 'vue'
import type { Component, ShallowRef } from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import CalendarProvider from '../CalendarProvider/CalendarProvider.vue'
import { LOCALIZER_CASES } from '../testing/localizers'
import { useCalendarDnd } from './useCalendarDnd'

function makeWrapper(
  localizer: LocalizerContract,
  defaultView: string,
  child: ReturnType<typeof defineComponent>,
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

describe.each(LOCALIZER_CASES)('useCalendarDnd [$name]', ({ create }) => {
  let localizer: LocalizerContract

  beforeAll(async () => {
    localizer = await create()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('does not call bindCalendarDnd when containerRef is null', () => {
    const bindSpy = vi.spyOn(dndModule, 'bindCalendarDnd').mockReturnValue(() => {})
    let containerRef: ShallowRef<HTMLElement | null> | undefined

    const Probe = defineComponent({
      setup() {
        containerRef = shallowRef<HTMLElement | null>(null)
        useCalendarDnd(containerRef)
        return () => null
      },
    })

    makeWrapper(localizer, Views.MONTH, Probe)
    expect(containerRef!.value).toBeNull()
    expect(bindSpy).not.toHaveBeenCalled()
  })

  it('calls bindCalendarDnd with mode=day for month view when containerRef has element', async () => {
    const cleanupFn = vi.fn()
    const bindSpy = vi.spyOn(dndModule, 'bindCalendarDnd').mockReturnValue(cleanupFn)
    let containerRef: ShallowRef<HTMLElement | null> | undefined

    const Probe = defineComponent({
      setup() {
        containerRef = shallowRef<HTMLElement | null>(null)
        useCalendarDnd(containerRef)
        return () => null
      },
    })

    makeWrapper(localizer, Views.MONTH, Probe)

    // Set a DOM element after mount so watchEffect fires
    containerRef!.value = document.createElement('div')
    await Promise.resolve() // flush reactive effects

    expect(bindSpy).toHaveBeenCalledWith(
      expect.objectContaining({ mode: 'day' }),
    )
  })

  it('calls bindCalendarDnd with mode=time for week view', async () => {
    const bindSpy = vi.spyOn(dndModule, 'bindCalendarDnd').mockReturnValue(() => {})
    let containerRef: ShallowRef<HTMLElement | null> | undefined

    const Probe = defineComponent({
      setup() {
        containerRef = shallowRef<HTMLElement | null>(null)
        useCalendarDnd(containerRef)
        return () => null
      },
    })

    makeWrapper(localizer, Views.WEEK, Probe)
    containerRef!.value = document.createElement('div')
    await Promise.resolve()

    expect(bindSpy).toHaveBeenCalledWith(
      expect.objectContaining({ mode: 'time' }),
    )
  })

  it('does not call bindCalendarDnd for agenda view (mode=null)', async () => {
    const bindSpy = vi.spyOn(dndModule, 'bindCalendarDnd').mockReturnValue(() => {})
    let containerRef: ShallowRef<HTMLElement | null> | undefined

    const Probe = defineComponent({
      setup() {
        containerRef = shallowRef<HTMLElement | null>(null)
        useCalendarDnd(containerRef)
        return () => null
      },
    })

    makeWrapper(localizer, Views.AGENDA, Probe)
    containerRef!.value = document.createElement('div')
    await Promise.resolve()

    expect(bindSpy).not.toHaveBeenCalled()
  })

  it('runs cleanup on unmount when binding was active', async () => {
    const cleanupFn = vi.fn()
    vi.spyOn(dndModule, 'bindCalendarDnd').mockReturnValue(cleanupFn)
    let containerRef: ShallowRef<HTMLElement | null> | undefined

    const Probe = defineComponent({
      setup() {
        containerRef = shallowRef<HTMLElement | null>(null)
        useCalendarDnd(containerRef)
        return () => null
      },
    })

    const wrapper = makeWrapper(localizer, Views.MONTH, Probe)
    containerRef!.value = document.createElement('div')
    await Promise.resolve()

    wrapper.unmount()
    expect(cleanupFn).toHaveBeenCalled()
  })
})
