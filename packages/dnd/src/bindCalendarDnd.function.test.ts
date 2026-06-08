import { beforeEach, describe, expect, it, vi } from 'vitest'
import { bindCalendarDnd, type DndStore } from './bindCalendarDnd.function'

// The Pragmatic DnD element adapter drives native drag events, which jsdom does
// not implement. Mock it: each registrar records its config (so the test can
// invoke the closures) and returns a cleanup spy.
const { draggableSpy, dropSpy, monitorSpy } = vi.hoisted(() => ({
  draggableSpy: vi.fn(),
  dropSpy: vi.fn(),
  monitorSpy: vi.fn(),
}))
vi.mock('@atlaskit/pragmatic-drag-and-drop/element/adapter', () => ({
  draggable: draggableSpy,
  dropTargetForElements: dropSpy,
  monitorForElements: monitorSpy,
}))

const ISO = '2026-06-16T00:00:00.000Z'
const tick = () => new Promise((resolve) => setTimeout(resolve, 0))

const makeStore = (overrides: Partial<DndStore<{ id: number }>> = {}): DndStore<{ id: number }> => ({
  getEvent: vi.fn(({ id }) => (id === '1' ? { id: 1 } : undefined)),
  isDraggable: vi.fn(() => true),
  isResizable: vi.fn(() => true),
  moveEvent: vi.fn(),
  resizeEvent: vi.fn(),
  ...overrides,
})

const el = (attrs: Record<string, string>): HTMLElement => {
  const node = document.createElement('div')
  for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, value)
  return node
}

describe('bindCalendarDnd', () => {
  let root: HTMLElement
  let eventEl: HTMLElement
  let cellEl: HTMLElement

  beforeEach(() => {
    draggableSpy.mockReset().mockImplementation(() => vi.fn())
    dropSpy.mockReset().mockImplementation(() => vi.fn())
    monitorSpy.mockReset().mockImplementation(() => vi.fn())
    document.body.innerHTML = ''
    root = document.createElement('div')
    eventEl = el({ 'data-bc-event': '1' })
    const emptyEventEl = el({ 'data-bc-event': '' }) // no resolvable id → skipped
    cellEl = el({ 'data-date': ISO })
    root.append(eventEl, emptyEventEl, cellEl)
    document.body.appendChild(root)
  })

  it('binds only id-bearing event elements as drag sources', () => {
    bindCalendarDnd({ root, store: makeStore(), mode: 'day' })
    expect(draggableSpy).toHaveBeenCalledTimes(1)
    expect(draggableSpy.mock.calls[0]![0].element).toBe(eventEl)
  })

  it('a draggable carries its event id and is gated by isDraggable', () => {
    const store = makeStore()
    bindCalendarDnd({ root, store, mode: 'day' })
    const cfg = draggableSpy.mock.calls[0]![0]
    expect(cfg.getInitialData()).toEqual({ bcEventId: '1' })
    expect(cfg.canDrag()).toBe(true)
    expect(store.getEvent).toHaveBeenCalledWith({ id: '1' })
  })

  it('canDrag is false when the event is unknown or not draggable', () => {
    const unknown = makeStore({ getEvent: vi.fn(() => undefined) })
    bindCalendarDnd({ root, store: unknown, mode: 'day' })
    expect(draggableSpy.mock.calls[0]![0].canDrag()).toBe(false)

    draggableSpy.mockClear()
    const locked = makeStore({ isDraggable: vi.fn(() => false) })
    bindCalendarDnd({ root, store: locked, mode: 'day' })
    expect(draggableSpy.mock.calls[0]![0].canDrag()).toBe(false)
  })

  it('binds date cells as drop targets carrying their ISO date', () => {
    bindCalendarDnd({ root, store: makeStore(), mode: 'day' })
    expect(dropSpy).toHaveBeenCalledTimes(1)
    const cfg = dropSpy.mock.calls[0]![0]
    expect(cfg.element).toBe(cellEl)
    expect(cfg.getData()).toEqual({ bcDropTarget: ISO })
  })

  it("in 'time' mode binds [data-bc-instant] cells and ignores day-only cells", () => {
    const instant = '2026-06-16T09:30:00.000Z'
    const slotEl = el({ 'data-bc-instant': instant })
    root.appendChild(slotEl)
    bindCalendarDnd({ root, store: makeStore(), mode: 'time' })
    // Only the slot cell is a drop target — the plain `data-date` cell is not.
    expect(dropSpy).toHaveBeenCalledTimes(1)
    const cfg = dropSpy.mock.calls[0]![0]
    expect(cfg.element).toBe(slotEl)
    expect(cfg.getData()).toEqual({ bcDropTarget: instant })
  })

  it('on drop, calls store.moveEvent with the id, target and mode', () => {
    const store = makeStore()
    bindCalendarDnd({ root, store, mode: 'day' })
    const { onDrop } = monitorSpy.mock.calls[0]![0]
    onDrop({
      source: { data: { bcEventId: '1' } },
      location: { current: { dropTargets: [{ data: { bcDropTarget: ISO } }] } },
    })
    expect(store.moveEvent).toHaveBeenCalledWith({ id: '1', target: ISO, mode: 'day' })
  })

  it('binds a resize handle as a drag source carrying its edge + the parent event id', () => {
    const eventWithHandle = el({ 'data-bc-event': '1' })
    const handle = el({ 'data-bc-resize': 'end' })
    eventWithHandle.appendChild(handle)
    root.appendChild(eventWithHandle)
    const store = makeStore()
    bindCalendarDnd({ root, store, mode: 'time' })
    const handleCfg = draggableSpy.mock.calls.find((c) => c[0].element === handle)![0]
    expect(handleCfg.getInitialData()).toEqual({ bcEventId: '1', bcResizeEdge: 'end' })
    expect(handleCfg.canDrag()).toBe(true)
  })

  it('a resize handle is not draggable when the event is not resizable', () => {
    const eventWithHandle = el({ 'data-bc-event': '1' })
    const handle = el({ 'data-bc-resize': 'start' })
    eventWithHandle.appendChild(handle)
    root.appendChild(eventWithHandle)
    bindCalendarDnd({ root, store: makeStore({ isResizable: vi.fn(() => false) }), mode: 'time' })
    const handleCfg = draggableSpy.mock.calls.find((c) => c[0].element === handle)![0]
    expect(handleCfg.canDrag()).toBe(false)
  })

  it('on a resize-handle drop, calls store.resizeEvent (not moveEvent)', () => {
    const instant = '2026-06-16T09:30:00.000Z'
    const store = makeStore()
    bindCalendarDnd({ root, store, mode: 'time' })
    const { onDrop } = monitorSpy.mock.calls[0]![0]
    onDrop({
      source: { data: { bcEventId: '1', bcResizeEdge: 'end' } },
      location: { current: { dropTargets: [{ data: { bcDropTarget: instant } }] } },
    })
    expect(store.resizeEvent).toHaveBeenCalledWith({ id: '1', edge: 'end', target: instant })
    expect(store.moveEvent).not.toHaveBeenCalled()
  })

  it('ignores a drop with no target or a non-string id', () => {
    const store = makeStore()
    bindCalendarDnd({ root, store, mode: 'day' })
    const { onDrop } = monitorSpy.mock.calls[0]![0]
    onDrop({ source: { data: { bcEventId: '1' } }, location: { current: { dropTargets: [] } } })
    onDrop({
      source: { data: { bcEventId: 42 } },
      location: { current: { dropTargets: [{ data: { bcDropTarget: ISO } }] } },
    })
    expect(store.moveEvent).not.toHaveBeenCalled()
  })

  it('binds elements added after mount and prunes removed ones', async () => {
    bindCalendarDnd({ root, store: makeStore(), mode: 'day' })
    const eventCleanup = draggableSpy.mock.results[0]!.value as ReturnType<typeof vi.fn>
    expect(draggableSpy).toHaveBeenCalledTimes(1)

    // Added: bound on the next observer tick; existing bindings are not redone.
    root.appendChild(el({ 'data-bc-event': '2' }))
    await tick()
    expect(draggableSpy).toHaveBeenCalledTimes(2)

    // Removed: its per-element binding is released.
    eventEl.remove()
    await tick()
    expect(eventCleanup).toHaveBeenCalledTimes(1)
  })

  it('cleanup stops the monitor and releases every binding', () => {
    const dispose = bindCalendarDnd({ root, store: makeStore(), mode: 'day' })
    const eventCleanup = draggableSpy.mock.results[0]!.value as ReturnType<typeof vi.fn>
    const cellCleanup = dropSpy.mock.results[0]!.value as ReturnType<typeof vi.fn>
    const monitorCleanup = monitorSpy.mock.results[0]!.value as ReturnType<typeof vi.fn>
    dispose()
    expect(eventCleanup).toHaveBeenCalledTimes(1)
    expect(cellCleanup).toHaveBeenCalledTimes(1)
    expect(monitorCleanup).toHaveBeenCalledTimes(1)
  })
})
