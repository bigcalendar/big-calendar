// Engine B: our own code on native HTML drag and drop. Moves and drag-out are one gesture; resize
// uses pointer events. Touch uses the platform's own long-press drag.
import {
  render,
  setupResize,
  setupOutside,
  grid,
  cellAt,
  byId,
  elOf,
  showDraft,
  hideDraft,
  commit,
  autoscroller,
  note,
  $,
  events,
} from '../shared.js'

export function setup() {
  render()
  setupResize()
  setupOutside()
  $('#hint').textContent =
    'Native DnD: drag events inside the week, or out to the box. Touch: the platform long-press.'
  const scroll = autoscroller()
  const blank = new Image()
  blank.src =
    'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
  for (const e of events) elOf(e.id).draggable = true
  let drag = null,
    fromHandle = false
  grid().addEventListener(
    'pointerdown',
    (ev) => {
      fromHandle = !!ev.target.closest('[data-handle]')
    },
    true,
  )

  grid().addEventListener('dragstart', (ev) => {
    const el = ev.target.closest?.('.ev')
    if (!el || fromHandle) {
      ev.preventDefault()
      return
    }
    const e = byId(el.dataset.id)
    const c = cellAt(ev.clientX, ev.clientY)
    drag = { id: e.id, el, grab: c ? c.slot - e.start : 0, next: null }
    ev.dataTransfer.effectAllowed = 'copyMove'
    ev.dataTransfer.setData(
      'application/x-bc-event',
      JSON.stringify({ id: e.id, title: e.title }),
    )
    ev.dataTransfer.setData('text/plain', e.title)
    // Keep the platform preview: it's the only feedback outside the calendar.
    el.dataset.dragging = ''
    scroll.start()
    note(`start ${e.id} (native)`)
  })
  const over = (ev) => {
    if (!drag) return
    ev.preventDefault()
    ev.dataTransfer.dropEffect = 'move'
    scroll.move(ev.clientY)
    const c = cellAt(ev.clientX, ev.clientY)
    if (!c) return
    const e = byId(drag.id)
    drag.next = {
      day: c.day,
      start: Math.max(0, Math.min(48 - e.len, c.slot - drag.grab)),
      len: e.len,
    }
    showDraft({ ...e, ...drag.next })
  }
  grid().addEventListener('dragenter', over)
  grid().addEventListener('dragover', over)
  grid().addEventListener('dragleave', (ev) => {
    if (drag && !grid().contains(ev.relatedTarget)) {
      hideDraft()
      drag.next = null
      scroll.move(null)
    }
  })
  grid().addEventListener('drop', (ev) => {
    ev.preventDefault()
    if (drag?.next) {
      commit(drag.id, drag.next)
      drag.committed = true
    }
  })
  grid().addEventListener('dragend', (ev) => {
    if (!drag) return
    scroll.stop()
    hideDraft()
    delete drag.el.dataset.dragging
    if (!drag.committed)
      note(
        ev.dataTransfer.dropEffect === 'none'
          ? `cancel ${drag.id}`
          : `dropped outside ${drag.id} (${ev.dataTransfer.dropEffect})`,
      )
    drag = null
  })
}
