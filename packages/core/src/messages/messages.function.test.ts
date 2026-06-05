import { describe, expect, it } from 'vitest'
import { DEFAULT_MESSAGES, resolveMessages } from './messages.function'

describe('resolveMessages', () => {
  it('returns the English defaults when given nothing', () => {
    const messages = resolveMessages()
    expect(messages.today).toBe('Today')
    expect(messages.work_week).toBe('Work Week')
    expect(messages.noEventsInRange).toBe('There are no events in this range.')
    expect(messages.showMore(3)).toBe('+3 more')
    expect(messages.selectionInstructions).toContain('arrow keys')
    expect(messages.eventInstructions).toContain('F2')
  })

  it('overrides only the keys provided, keeping the rest', () => {
    const messages = resolveMessages({ today: 'Hoy', next: 'Siguiente' })
    expect(messages.today).toBe('Hoy')
    expect(messages.next).toBe('Siguiente')
    expect(messages.previous).toBe('Back') // untouched default
  })

  it('accepts a custom showMore formatter', () => {
    const messages = resolveMessages({ showMore: (total) => `${total} hidden` })
    expect(messages.showMore(5)).toBe('5 hidden')
  })

  it('does not mutate DEFAULT_MESSAGES', () => {
    resolveMessages({ today: 'Changed' })
    expect(DEFAULT_MESSAGES.today).toBe('Today')
  })
})
