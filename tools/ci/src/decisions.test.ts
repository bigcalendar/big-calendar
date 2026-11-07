import { describe, expect, it } from 'vitest'
import { checkDecisions } from './decisions.ts'

const newRow = '+| D-120 | 2026-12-01 — A new decision. Source: test. |'

describe('decision-entry check', () => {
  it('ignores changes that touch neither the specs nor the log', () => {
    expect(
      checkDecisions({
        changedFiles: ['packages/core/src/index.ts'],
        decisionsDiff: '',
      }),
    ).toEqual([])
  })

  it('passes a spec change that adds a decision', () => {
    expect(
      checkDecisions({
        changedFiles: ['docs/spec/api.md', 'docs/decisions.md'],
        decisionsDiff: newRow,
      }),
    ).toEqual([])
  })

  it('fails a spec change without a new decision', () => {
    expect(
      checkDecisions({ changedFiles: ['docs/spec/api.md'], decisionsDiff: '' }),
    ).toEqual([
      'docs/spec/ changed without a new decision in docs/decisions.md (workflow rule 7; use the decide skill).',
    ])
  })

  it('fails an edited past decision, even alongside a new one', () => {
    const diff = [
      '-| D-42 | Old text. |',
      '+| D-42 | New text. |',
      newRow,
    ].join('\n')
    expect(
      checkDecisions({
        changedFiles: ['docs/decisions.md'],
        decisionsDiff: diff,
      }),
    ).toEqual([
      'D-42 was edited or removed. Past decisions never change; add a new entry that amends it.',
    ])
  })

  it('fails a removed past decision', () => {
    expect(
      checkDecisions({
        changedFiles: ['docs/decisions.md'],
        decisionsDiff: '-| D-7 | Gone. |',
      }),
    ).toEqual([
      'D-7 was edited or removed. Past decisions never change; add a new entry that amends it.',
    ])
  })
})
