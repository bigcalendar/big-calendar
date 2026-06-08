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
const EXTERNAL_MIME = 'application/x-bigcal-external'

// Dispatch a synthetic native drag event with a stub `dataTransfer` (jsdom has no
// real DataTransfer). Dispatched on `on` so delegation's `event.target.closest`
// resolves from there; bubbles up to the root listeners.
const fireDrag = (
  type: 'dragover' | 'drop' | 'dragleave',
  opts: { on: HTMLElement; types?: string[]; data?: Record<string, string>; relatedTarget?: Node | null },
): Event => {
  const event = new Event(type, { bubbles: true, cancelable: true })
  Object.defineProperty(event, 'dataTransfer', {
    configurable: true,
    value: { types: opts.types ?? [], getData: (t: string) => opts.data?.[t] ?? '', dropEffect: 'none' },
  })
  if ('relatedTarget' in opts) {
    Object.defineProperty(event, 'relatedTarget', { configurable: true, value: opts.relatedTarget ?? null })
  }
  opts.on.dispatchEvent(event)
  return event
}
const tick = () => new Promise((resolve) => setTimeout(resolve, 0))

const makeStore = (overrides: Partial<DndStore<{ id: number }>> = {}): DndStore<{ id: number }> => ({
  getEvent: vi.fn(({ id }) => (id === '1' ? { id: 1 } : undefined)),
  isDraggable: vi.fn(() => true),
  isResizable: vi.fn(() => true),
  moveEvent: vi.fn(),
  resizeEvent: vi.fn(),
  previewResize: vi.fn(),
  clearDragPreview: vi.fn(),
  dropExternal: vi.fn(),
  previewExternal: vi.fn(),
  getEventTransfer: vi.fn(({ id }) =>
    id === '1' ? { id: '1', title: 'A', start: ISO, end: ISO, allDay: false } : null,
  ),
  eventDragStart: vi.fn(),
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

  it('updates the live resize preview as the dragged edge changes slot', () => {
    const instant = '2026-06-16T09:30:00.000Z'
    const store = makeStore()
    bindCalendarDnd({ root, store, mode: 'time' })
    const { onDropTargetChange } = monitorSpy.mock.calls[0]![0]
    onDropTargetChange({
      source: { data: { bcEventId: '1', bcResizeEdge: 'end' } },
      location: { current: { dropTargets: [{ data: { bcDropTarget: instant } }] } },
    })
    expect(store.previewResize).toHaveBeenCalledWith({ id: '1', edge: 'end', target: instant })
  })

  it('clears the preview when the edge leaves every slot, and ignores move drags', () => {
    const store = makeStore()
    bindCalendarDnd({ root, store, mode: 'time' })
    const { onDropTargetChange } = monitorSpy.mock.calls[0]![0]
    // Resize edge over no target → clear.
    onDropTargetChange({
      source: { data: { bcEventId: '1', bcResizeEdge: 'start' } },
      location: { current: { dropTargets: [] } },
    })
    expect(store.clearDragPreview).toHaveBeenCalledTimes(1)
    // A move drag (no edge) never previews this slice.
    onDropTargetChange({
      source: { data: { bcEventId: '1' } },
      location: { current: { dropTargets: [{ data: { bcDropTarget: '2026-06-16T09:30:00.000Z' } }] } },
    })
    expect(store.previewResize).not.toHaveBeenCalled()
  })

  it('clears the preview when a resize is dropped outside every slot', () => {
    const store = makeStore()
    bindCalendarDnd({ root, store, mode: 'time' })
    const { onDrop } = monitorSpy.mock.calls[0]![0]
    onDrop({
      source: { data: { bcEventId: '1', bcResizeEdge: 'end' } },
      location: { current: { dropTargets: [] } },
    })
    expect(store.clearDragPreview).toHaveBeenCalledTimes(1)
    expect(store.resizeEvent).not.toHaveBeenCalled()
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

  describe('drag-out (native targets + onEventDragStart)', () => {
    it('an event exposes its data to native drop targets and reports its drag start', () => {
      const store = makeStore()
      bindCalendarDnd({ root, store, mode: 'day' })
      const cfg = draggableSpy.mock.calls[0]![0]
      expect(cfg.getInitialDataForExternal()).toEqual({
        'text/plain': 'A',
        'application/x-bigcal-event': JSON.stringify({ id: '1', title: 'A', start: ISO, end: ISO, allDay: false }),
      })
      cfg.onDragStart()
      expect(store.eventDragStart).toHaveBeenCalledWith({ id: '1' })
    })

    it('falls back to an empty transfer when the event is unknown', () => {
      const store = makeStore({ getEventTransfer: vi.fn(() => null) })
      bindCalendarDnd({ root, store, mode: 'day' })
      expect(draggableSpy.mock.calls[0]![0].getInitialDataForExternal()).toEqual({})
    })
  })

  describe('drop-from-outside — Pragmatic palette source (element monitor)', () => {
    const instant = '2026-06-16T09:30:00.000Z'

    it('drops a Pragmatic palette item via the element monitor (true-extent payload)', () => {
      const store = makeStore()
      bindCalendarDnd({ root, store, mode: 'time' })
      const { onDrop } = monitorSpy.mock.calls[0]![0]
      onDrop({
        source: { data: { bcExternal: { durationMinutes: 90, allDay: false } } },
        location: { current: { dropTargets: [{ data: { bcDropTarget: instant } }] } },
      })
      expect(store.dropExternal).toHaveBeenCalledWith({ target: instant, durationMinutes: 90, allDay: false })
      expect(store.moveEvent).not.toHaveBeenCalled()
    })

    it('previews a Pragmatic palette item with its true extent as it moves', () => {
      const store = makeStore()
      bindCalendarDnd({ root, store, mode: 'time' })
      const { onDropTargetChange } = monitorSpy.mock.calls[0]![0]
      onDropTargetChange({
        source: { data: { bcExternal: { durationMinutes: 90 } } },
        location: { current: { dropTargets: [{ data: { bcDropTarget: instant } }] } },
      })
      expect(store.previewExternal).toHaveBeenCalledWith({ target: instant, durationMinutes: 90 })
    })
  })

  describe('drop-from-outside — native HTML5 palette source (delegated listeners)', () => {
    const instant = '2026-06-16T09:30:00.000Z'
    let slotEl: HTMLElement
    beforeEach(() => {
      slotEl = el({ 'data-bc-instant': instant })
      root.appendChild(slotEl)
    })

    it('accepts the drop and previews a single slot while hovering a slot', () => {
      const store = makeStore()
      bindCalendarDnd({ root, store, mode: 'time' })
      const event = fireDrag('dragover', { on: slotEl, types: [EXTERNAL_MIME] })
      expect(event.defaultPrevented).toBe(true) // preventDefault → the drop is accepted
      expect(store.previewExternal).toHaveBeenCalledWith({ target: instant })
    })

    it('only re-previews when the hovered slot changes', () => {
      const store = makeStore()
      const other = el({ 'data-bc-instant': '2026-06-16T10:00:00.000Z' })
      root.appendChild(other)
      bindCalendarDnd({ root, store, mode: 'time' })
      fireDrag('dragover', { on: slotEl, types: [EXTERNAL_MIME] })
      fireDrag('dragover', { on: slotEl, types: [EXTERNAL_MIME] }) // same slot → no re-fire
      expect(store.previewExternal).toHaveBeenCalledTimes(1)
      fireDrag('dragover', { on: other, types: [EXTERNAL_MIME] })
      expect(store.previewExternal).toHaveBeenCalledTimes(2)
    })

    it('ignores drags that do not carry our payload type (move/resize)', () => {
      const store = makeStore()
      bindCalendarDnd({ root, store, mode: 'time' })
      const event = fireDrag('dragover', { on: slotEl, types: ['text/plain'] })
      expect(event.defaultPrevented).toBe(false)
      expect(store.previewExternal).not.toHaveBeenCalled()
    })

    it('creates on drop, reading the duration off the dataTransfer', () => {
      const store = makeStore()
      bindCalendarDnd({ root, store, mode: 'time' })
      const event = fireDrag('drop', {
        on: slotEl,
        types: [EXTERNAL_MIME],
        data: { [EXTERNAL_MIME]: JSON.stringify({ durationMinutes: 45, allDay: true }) },
      })
      expect(event.defaultPrevented).toBe(true)
      expect(store.dropExternal).toHaveBeenCalledWith({ target: instant, durationMinutes: 45, allDay: true })
    })

    it('tolerates a malformed payload on drop (falls back to defaults)', () => {
      const store = makeStore()
      bindCalendarDnd({ root, store, mode: 'time' })
      fireDrag('drop', { on: slotEl, types: [EXTERNAL_MIME], data: { [EXTERNAL_MIME]: 'not json' } })
      expect(store.dropExternal).toHaveBeenCalledWith({ target: instant, durationMinutes: undefined, allDay: undefined })
    })

    it('clears the preview when the drag leaves the root', () => {
      const store = makeStore()
      bindCalendarDnd({ root, store, mode: 'time' })
      fireDrag('dragover', { on: slotEl, types: [EXTERNAL_MIME] })
      fireDrag('dragleave', { on: root, types: [EXTERNAL_MIME], relatedTarget: null })
      expect(store.clearDragPreview).toHaveBeenCalled()
    })

    it("does not attach native listeners in 'day' mode", () => {
      const store = makeStore()
      bindCalendarDnd({ root, store, mode: 'day' })
      fireDrag('dragover', { on: slotEl, types: [EXTERNAL_MIME] })
      expect(store.previewExternal).not.toHaveBeenCalled()
    })

    it('removes the native listeners on cleanup', () => {
      const store = makeStore()
      const dispose = bindCalendarDnd({ root, store, mode: 'time' })
      dispose()
      ;(store.previewExternal as ReturnType<typeof vi.fn>).mockClear()
      fireDrag('dragover', { on: slotEl, types: [EXTERNAL_MIME] })
      expect(store.previewExternal).not.toHaveBeenCalled()
    })
  })
})
