import { describe, it, expect } from 'vitest'
import { createServer } from './server.js'

describe('createServer', () => {
  it('creates an McpServer instance', () => {
    const server = createServer()
    expect(server).toBeDefined()
    expect(typeof server).toBe('object')
  })

  it('creates a new instance each call', () => {
    const a = createServer()
    const b = createServer()
    expect(a).not.toBe(b)
  })
})
