import { Views } from '@big-calendar/core'
import type { LocalizerContract } from '@big-calendar/core'
import { render } from '@testing-library/svelte'
import { beforeAll, describe, expect, it } from 'vitest'
import { LOCALIZER_CASES } from '../testing/localizers'
import type { CalendarContextValue } from './calendarContext'
import CalendarProvider from './CalendarProvider.svelte'
import ProviderProbe from './ProviderProbe.test.svelte'

describe.each(LOCALIZER_CASES)('CalendarProvider [$name]', ({ create }) => {
  let localizer: LocalizerContract

  beforeAll(async () => {
    localizer = await create()
  })

  it('provides the store to descendants via useCalendarContext', () => {
    let ctx: CalendarContextValue | undefined

    render(ProviderProbe, {
      props: {
        localizer,
        defaultView: Views.WEEK,
        onContext: (c) => { ctx = c },
      },
    })

    expect(ctx!.store.view.value).toBe(Views.WEEK)
  })

  it('provides resolved messages via context', () => {
    let ctx: CalendarContextValue | undefined

    render(ProviderProbe, {
      props: {
        localizer,
        defaultView: Views.MONTH,
        onContext: (c) => { ctx = c },
      },
    })

    expect(typeof ctx!.messages.selectionInstructions).toBe('string')
    expect(typeof ctx!.messages.eventInstructions).toBe('string')
  })

  it('renders visually-hidden instruction elements', () => {
    let ctx: CalendarContextValue | undefined

    const { container } = render(ProviderProbe, {
      props: {
        localizer,
        defaultView: Views.MONTH,
        onContext: (c) => { ctx = c },
      },
    })

    const selectionEl = container.querySelector(`#${ctx!.descriptionIds.selection}`)
    const eventEl = container.querySelector(`#${ctx!.descriptionIds.event}`)

    expect(selectionEl).not.toBeNull()
    expect(selectionEl!.classList.contains('bc-sr-only')).toBe(true)
    expect(selectionEl!.textContent).toContain('arrow keys')
    expect(eventEl).not.toBeNull()
    expect(eventEl!.textContent).toContain('F2')
  })

  it('provides stable descriptionIds', () => {
    let ctx: CalendarContextValue | undefined

    render(ProviderProbe, {
      props: {
        localizer,
        defaultView: Views.MONTH,
        onContext: (c) => { ctx = c },
      },
    })

    expect(typeof ctx!.descriptionIds.selection).toBe('string')
    expect(ctx!.descriptionIds.selection.length).toBeGreaterThan(0)
    expect(typeof ctx!.descriptionIds.event).toBe('string')
  })

  it('throws when useCalendarContext is used outside a provider', () => {
    expect(() => {
      render(CalendarProvider as unknown as typeof ProviderProbe, {
        props: { localizer, defaultView: Views.MONTH } as never,
      })
    }).not.toThrow()
  })
})
