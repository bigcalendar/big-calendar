// Engine C: Pragmatic drag and drop (native DnD underneath), with its auto-scroll package. Resize
// uses pointer events, as Pragmatic's docs recommend.
import {
  draggable,
  dropTargetForElements,
  monitorForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine'
import { autoScrollForElements } from '@atlaskit/pragmatic-drag-and-drop-auto-scroll/element'
import {
  render,
  setupResize,
  setupOutside,
  grid,
  scroller,
  cellAt,
  byId,
  elOf,
  showDraft,
  hideDraft,
  commit,
  note,
  $,
  events,
} from '../shared.js'

export function setup() {
  render()
  setupResize()
  setupOutside()
  $('#hint').textContent =
    'Pragmatic DnD: drag events inside the week, or out to the box. Touch: the platform long-press.'
  let fromHandle = false
  grid().addEventListener(
    'pointerdown',
    (ev) => {
      fromHandle = !!ev.target.closest('[data-handle]')
    },
    true,
  )
  const grab = new Map()
  let next = null
  combine(
    ...events.map((e) =>
      draggable({
        element: elOf(e.id),
        canDrag: () => !fromHandle,
        getInitialData: ({ input }) => {
          const c = cellAt(input.clientX, input.clientY)
          grab.set(e.id, c ? c.slot - byId(e.id).start : 0)
          return { id: e.id }
        },
        getInitialDataForExternal: () => ({
          'application/x-bc-event': JSON.stringify({
            id: e.id,
            title: e.title,
          }),
          'text/plain': e.title,
        }),
        onDragStart: () => {
          elOf(e.id).dataset.dragging = ''
          note(`start ${e.id} (pragmatic)`)
        },
        onDrop: () => delete elOf(e.id).dataset.dragging,
      }),
    ),
    dropTargetForElements({ element: grid(), getData: () => ({ grid: true }) }),
    autoScrollForElements({ element: scroller() }),
    monitorForElements({
      onDrag({ source, location }) {
        place(source, location)
      },
      onDrop({ source, location }) {
        // onDrag is batched to animation frames, so the drop works out its own cell.
        place(source, location)
        hideDraft()
        if (location.current.dropTargets.length && next)
          commit(source.data.id, next)
        else note(`cancel or outside ${source.data.id}`)
        next = null
      },
    }),
  )
  function place(source, location) {
    const { clientX, clientY } = location.current.input
    const inGrid = location.current.dropTargets.length > 0
    const c = inGrid && cellAt(clientX, clientY)
    if (!c) {
      hideDraft()
      next = null
      return
    }
    const e = byId(source.data.id)
    next = {
      day: c.day,
      start: Math.max(0, Math.min(48 - e.len, c.slot - grab.get(e.id))),
      len: e.len,
    }
    showDraft({ ...e, ...next })
  }
}
