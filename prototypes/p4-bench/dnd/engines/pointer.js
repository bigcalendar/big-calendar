// Engine A: our own Pointer Events code. Mouse and pen start after 4px of movement; touch starts
// after a 400ms long-press without moving, after which page scrolling is blocked for the drag.
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
} from '../shared.js'

export function setup() {
  render()
  setupResize()
  setupOutside()
  $('#hint').textContent =
    'Pointer Events: drag events inside the week. Touch: long-press, then drag. Dragging out of the calendar is not possible in the same gesture.'
  const scroll = autoscroller()
  let drag = null
  const blockScroll = (e) => {
    if (drag?.active) e.preventDefault()
  }
  document.addEventListener('touchmove', blockScroll, { passive: false })

  grid().addEventListener('pointerdown', (ev) => {
    const el = ev.target.closest('.ev')
    if (!el || ev.target.closest('[data-handle]') || ev.button > 0) return
    const e = byId(el.dataset.id)
    const c = cellAt(ev.clientX, ev.clientY)
    drag = {
      id: e.id,
      el,
      pointerId: ev.pointerId,
      x: ev.clientX,
      y: ev.clientY,
      grab: c ? c.slot - e.start : 0,
      active: false,
      next: null,
      touch: ev.pointerType === 'touch',
    }
    if (drag.touch) drag.timer = setTimeout(() => begin(), 400)
  })
  function begin() {
    drag.active = true
    drag.el.setPointerCapture?.(drag.pointerId)
    drag.el.dataset.dragging = ''
    scroll.start()
    navigator.vibrate?.(10)
    note(`start ${drag.id} (${drag.touch ? 'long-press' : 'move'})`)
  }
  document.addEventListener('pointermove', (ev) => {
    if (!drag || ev.pointerId !== drag.pointerId) return
    const dist = Math.hypot(ev.clientX - drag.x, ev.clientY - drag.y)
    if (!drag.active) {
      if (drag.touch) {
        if (dist > 8) {
          clearTimeout(drag.timer)
          drag = null
        }
        return
      }
      if (dist < 4) return
      begin()
    }
    scroll.move(ev.clientY)
    const c = cellAt(ev.clientX, ev.clientY)
    if (!c) {
      hideDraft()
      drag.next = null
      return
    }
    const e = byId(drag.id)
    drag.next = {
      day: c.day,
      start: Math.max(0, Math.min(48 - e.len, c.slot - drag.grab)),
      len: e.len,
    }
    showDraft({ ...e, ...drag.next })
  })
  const end = (ok) => {
    if (!drag) return
    clearTimeout(drag.timer)
    if (drag.active) {
      scroll.stop()
      hideDraft()
      delete drag.el.dataset.dragging
      if (ok && drag.next) commit(drag.id, drag.next)
      else note(`cancel ${drag.id}`)
    }
    drag = null
  }
  document.addEventListener('pointerup', () => end(true))
  document.addEventListener('pointercancel', () => end(false))
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') end(false)
  })
  // A drag that leaves the calendar can't become a native drag: the platform starts native DnD only
  // from `dragstart`, which this engine never uses.
  grid().addEventListener('dragstart', (e) => e.preventDefault())
}
