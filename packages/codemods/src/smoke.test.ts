import { describe, expect, it } from 'vitest'
import { PACKAGE_NAME } from './index'

describe('@big-calendar/codemods', () => {
  it('is scaffolded', () => {
    expect(PACKAGE_NAME).toBe('@big-calendar/codemods')
  })
})
