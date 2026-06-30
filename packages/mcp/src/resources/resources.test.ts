import { describe, it, expect } from 'vitest'
import { RESOURCES } from './index.js'

describe('MCP resources', () => {
  it('exports 13 resources', () => {
    expect(RESOURCES).toHaveLength(13)
  })

  it('every resource URI starts with bc://', () => {
    for (const resource of RESOURCES) {
      expect(resource.uri).toMatch(/^bc:\/\//)
    }
  })

  it('API resources have bc://api/ URIs', () => {
    const apiResources = RESOURCES.filter((r) => r.uri.startsWith('bc://api/'))
    expect(apiResources).toHaveLength(5)
    const uris = apiResources.map((r) => r.uri)
    expect(uris).toContain('bc://api/calendar-provider')
    expect(uris).toContain('bc://api/accessors')
    expect(uris).toContain('bc://api/views')
    expect(uris).toContain('bc://api/dnd')
    expect(uris).toContain('bc://api/localizers')
  })

  it('recipe resources have bc://recipes/ URIs', () => {
    const recipeResources = RESOURCES.filter((r) => r.uri.startsWith('bc://recipes/'))
    expect(recipeResources).toHaveLength(8)
    const uris = recipeResources.map((r) => r.uri)
    expect(uris).toContain('bc://recipes/basic-setup')
    expect(uris).toContain('bc://recipes/basic-setup-vue')
    expect(uris).toContain('bc://recipes/basic-setup-angular')
    expect(uris).toContain('bc://recipes/basic-setup-lit')
    expect(uris).toContain('bc://recipes/event-editing')
    expect(uris).toContain('bc://recipes/create-event')
    expect(uris).toContain('bc://recipes/data-fetching')
    expect(uris).toContain('bc://recipes/custom-event')
  })

  it('every resource has a non-empty name and description', () => {
    for (const resource of RESOURCES) {
      expect(resource.name.length).toBeGreaterThan(0)
      expect(resource.description.length).toBeGreaterThan(0)
    }
  })

  it('every resource has non-empty markdown content', () => {
    for (const resource of RESOURCES) {
      expect(resource.content.length).toBeGreaterThan(100)
      expect(resource.content).toContain('#')
    }
  })

  it('API resource content covers CalendarProvider', () => {
    const doc = RESOURCES.find((r) => r.uri === 'bc://api/calendar-provider')
    expect(doc).toBeDefined()
    expect(doc!.content).toContain('CalendarProvider')
    expect(doc!.content).toContain('localizer')
    expect(doc!.content).toContain('events')
  })

  it('DnD resource content covers useCalendarDnd', () => {
    const doc = RESOURCES.find((r) => r.uri === 'bc://api/dnd')
    expect(doc).toBeDefined()
    expect(doc!.content).toContain('useCalendarDnd')
    expect(doc!.content).toContain('@big-calendar/dnd')
  })

  it('basic-setup recipe covers installation and component code', () => {
    const doc = RESOURCES.find((r) => r.uri === 'bc://recipes/basic-setup')
    expect(doc).toBeDefined()
    expect(doc!.content).toContain('pnpm add')
    expect(doc!.content).toContain('CalendarProvider')
    expect(doc!.content).toContain('createTemporalLocalizer')
  })

  it('resource URIs are unique', () => {
    const uris = RESOURCES.map((r) => r.uri)
    const unique = new Set(uris)
    expect(unique.size).toBe(uris.length)
  })
})
