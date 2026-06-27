import { Views } from '@big-calendar/core'
import type { LocalizerContract } from '@big-calendar/core'
import { defineComponent, h } from 'vue'
import type { Component } from 'vue'
import { mount } from '@vue/test-utils'
import { beforeAll, describe, expect, it } from 'vitest'
import { LOCALIZER_CASES } from '../testing/localizers'
import CalendarProvider from '../CalendarProvider/CalendarProvider.vue'
import type { UseAgendaViewReturn } from './useAgendaView'
import { useAgendaView } from './useAgendaView'

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

describe.each(LOCALIZER_CASES)('useAgendaView [$name]', ({ create }) => {
  let localizer: LocalizerContract

  beforeAll(async () => {
    localizer = await create()
  })

  it('rows is null when the active view is week', () => {
    let result: UseAgendaViewReturn<unknown> | undefined

    const Probe = defineComponent({
      setup() {
        result = useAgendaView()
        return () => null
      },
    })

    makeWrapper(localizer, Views.WEEK, Probe)
    expect(result!.rows.value).toBeNull()
  })

  it('rows is an array when the active view is agenda', () => {
    let result: UseAgendaViewReturn<unknown> | undefined

    const Probe = defineComponent({
      setup() {
        result = useAgendaView()
        return () => null
      },
    })

    makeWrapper(localizer, Views.AGENDA, Probe)
    expect(Array.isArray(result!.rows.value)).toBe(true)
  })

  it('returns static class props for root, header, headingCell, body', () => {
    let result: UseAgendaViewReturn<unknown> | undefined

    const Probe = defineComponent({
      setup() {
        result = useAgendaView()
        return () => null
      },
    })

    makeWrapper(localizer, Views.AGENDA, Probe)
    expect(result!.root.class).toBe('bc-agenda')
    expect(result!.header.class).toBe('bc-agenda-header')
    expect(result!.headingCell.class).toBe('bc-agenda-heading')
    expect(result!.body.class).toBe('bc-agenda-body')
  })

  it('messages computed ref exposes date, time, event, noEventsInRange strings', () => {
    let result: UseAgendaViewReturn<unknown> | undefined

    const Probe = defineComponent({
      setup() {
        result = useAgendaView()
        return () => null
      },
    })

    makeWrapper(localizer, Views.AGENDA, Probe)
    const msgs = result!.messages.value
    expect(typeof msgs.date).toBe('string')
    expect(typeof msgs.time).toBe('string')
    expect(typeof msgs.event).toBe('string')
    expect(typeof msgs.noEventsInRange).toBe('string')
  })

  it('getRowProps returns correct class and a style object', () => {
    let result: UseAgendaViewReturn<unknown> | undefined

    const Probe = defineComponent({
      setup() {
        result = useAgendaView()
        return () => null
      },
    })

    makeWrapper(localizer, Views.AGENDA, Probe)
    const fakeRow = { day: '2024-01-01', label: 'Mon', events: [{}] } as Parameters<UseAgendaViewReturn<unknown>['getRowProps']>[0]
    const props = result!.getRowProps(fakeRow)
    expect(props.class).toBe('bc-agenda-day')
    expect(typeof props.style).toBe('object')
  })
})
