import { Views } from '@big-calendar/core'
import type { LocalizerContract } from '@big-calendar/core'
import { defineComponent, h } from 'vue'
import type { Component } from 'vue'
import { mount } from '@vue/test-utils'
import { beforeAll, describe, expect, it } from 'vitest'
import { LOCALIZER_CASES } from '../testing/localizers'
import { useSignalRef } from '../internal/useSignalRef'
import { useCalendarContext } from './useCalendarContext'
import CalendarProvider from './CalendarProvider.vue'

type AnyComponent = ReturnType<typeof defineComponent>

/**
 * Mount a CalendarProvider with an optional child slot component.
 * Uses an h() wrapper so Vue Test Utils doesn't need to resolve the generic
 * SFC's prop types at mount time.
 */
function makeWrapper(
  localizer: LocalizerContract,
  options: {
    defaultView?: string
    child?: AnyComponent
  } = {},
) {
  const defaultView = (options.defaultView ?? Views.WEEK) as string
  const child = options.child ?? defineComponent({ setup() { return () => null } })

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

describe.each(LOCALIZER_CASES)('CalendarProvider [$name]', ({ create }) => {
  let localizer: LocalizerContract

  beforeAll(async () => {
    localizer = await create()
  })

  it('provides the store to descendants via useCalendarContext', () => {
    let contextStore: ReturnType<typeof useCalendarContext>['store'] | undefined

    const Probe = defineComponent({
      setup() {
        contextStore = useCalendarContext().store
        return () => null
      },
    })

    makeWrapper(localizer, { defaultView: Views.WEEK, child: Probe })
    expect(contextStore!.view.value).toBe(Views.WEEK)
  })

  it('descendant can read a store signal reactively via useSignalRef', () => {
    let view: string | undefined

    const Probe = defineComponent({
      setup() {
        const { store } = useCalendarContext()
        const viewRef = useSignalRef(store.view)
        view = viewRef.value
        return () => null
      },
    })

    makeWrapper(localizer, { defaultView: Views.MONTH, child: Probe })
    expect(view).toBe(Views.MONTH)
  })

  it('renders visually-hidden instruction elements matching the context description ids', () => {
    let ids: { selection: string; event: string } | undefined

    const Probe = defineComponent({
      setup() {
        ids = useCalendarContext().descriptionIds
        return () => null
      },
    })

    const wrapper = makeWrapper(localizer, { child: Probe })
    const selectionEl = wrapper.find(`#${ids!.selection}`)
    const eventEl = wrapper.find(`#${ids!.event}`)

    expect(selectionEl.exists()).toBe(true)
    expect(selectionEl.classes()).toContain('bc-sr-only')
    expect(selectionEl.text()).toContain('arrow keys')
    expect(eventEl.exists()).toBe(true)
    expect(eventEl.text()).toContain('F2')
  })

  it('exposes resolved messages via context', () => {
    let messages: ReturnType<typeof useCalendarContext>['messages'] | undefined

    const Probe = defineComponent({
      setup() {
        messages = useCalendarContext().messages
        return () => null
      },
    })

    makeWrapper(localizer, { child: Probe })
    expect(typeof messages!.selectionInstructions).toBe('string')
    expect(typeof messages!.eventInstructions).toBe('string')
  })

  it('throws when useCalendarContext is used outside a provider', () => {
    const Outside = defineComponent({
      setup() {
        useCalendarContext()
        return () => null
      },
    })

    expect(() => mount(Outside)).toThrow(/within a <CalendarProvider>/)
  })
})
