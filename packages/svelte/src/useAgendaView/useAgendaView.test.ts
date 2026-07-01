import { Views } from '@big-calendar/core'
import type { LocalizerContract } from '@big-calendar/core'
import { render } from '@testing-library/svelte'
import { beforeAll, describe, expect, it } from 'vitest'
import { LOCALIZER_CASES } from '../testing/localizers'
import { makeContext } from '../testing/makeContext'
import Probe from '../testing/Probe.svelte'
import type { AgendaRow } from '../useAgendaRows'
import type { UseAgendaViewReturn } from './useAgendaView.svelte'
import { useAgendaView } from './useAgendaView.svelte'

describe.each(LOCALIZER_CASES)('useAgendaView [$name]', ({ create }) => {
  let localizer: LocalizerContract

  beforeAll(async () => {
    localizer = await create()
  })

  it('rows.current is null when the active view is week', () => {
    let result: UseAgendaViewReturn<unknown> | undefined

    render(Probe, {
      props: { run: () => { result = useAgendaView() } },
      context: makeContext(localizer, Views.WEEK),
    })

    expect(result!.rows.current).toBeNull()
  })

  it('rows.current is an array when the active view is agenda', () => {
    let result: UseAgendaViewReturn<unknown> | undefined

    render(Probe, {
      props: { run: () => { result = useAgendaView() } },
      context: makeContext(localizer, Views.AGENDA),
    })

    expect(Array.isArray(result!.rows.current)).toBe(true)
  })

  it('returns static class props for root, header, headingCell, body', () => {
    let result: UseAgendaViewReturn<unknown> | undefined

    render(Probe, {
      props: { run: () => { result = useAgendaView() } },
      context: makeContext(localizer, Views.AGENDA),
    })

    expect(result!.root.class).toBe('bc-agenda')
    expect(result!.header.class).toBe('bc-agenda-header')
    expect(result!.headingCell.class).toBe('bc-agenda-heading')
    expect(result!.body.class).toBe('bc-agenda-body')
  })

  it('messages exposes date, time, event, noEventsInRange strings', () => {
    let result: UseAgendaViewReturn<unknown> | undefined

    render(Probe, {
      props: { run: () => { result = useAgendaView() } },
      context: makeContext(localizer, Views.AGENDA),
    })

    expect(typeof result!.messages.date).toBe('string')
    expect(typeof result!.messages.time).toBe('string')
    expect(typeof result!.messages.event).toBe('string')
    expect(typeof result!.messages.noEventsInRange).toBe('string')
  })

  it('getRowProps returns correct class and a style object', () => {
    let result: UseAgendaViewReturn<unknown> | undefined

    render(Probe, {
      props: { run: () => { result = useAgendaView() } },
      context: makeContext(localizer, Views.AGENDA),
    })

    const fakeRow = { day: '2024-01-01', label: 'Mon', events: [{}] } as AgendaRow<unknown>
    const props = result!.getRowProps(fakeRow)
    expect(props.class).toBe('bc-agenda-day')
    expect(typeof props.style).toBe('string')
  })
})
