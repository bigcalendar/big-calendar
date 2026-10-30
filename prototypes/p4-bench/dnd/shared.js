// What all three engines share: the grid, the events, coordinate lookup, the draft, autoscroll,
// commits and the external drop zone. Coordinates come from data attributes on real cells (no
// pixel rectangles), as the interaction spec requires.
export const SLOTS = 48
export const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
export const events = [
  { id: 'a', title: 'Standup', day: 1, start: 18, len: 1 },
  { id: 'b', title: 'Design review', day: 2, start: 20, len: 3 },
  { id: 'c', title: 'Lunch', day: 3, start: 24, len: 2 },
  { id: 'd', title: 'Focus time', day: 4, start: 28, len: 4 },
]
export const log = []
export function note(msg) {
  log.push(msg)
  globalThis.__log = log
  const el = document.getElementById('log')
  el.textContent = `${msg}\n${el.textContent}`.slice(0, 4000)
}

export const $ = (s) => document.querySelector(s)
export const grid = () => $('.grid')
export const scroller = () => $('.scroller')

export function render() {
  $('.heads').replaceChildren(
    ...days.map((d) =>
      Object.assign(document.createElement('div'), { textContent: d }),
    ),
  )
  grid().replaceChildren(
    ...days.map((_, day) => {
      const col = document.createElement('div')
      col.className = 'col'
      col.dataset.day = day
      for (let s = 0; s < SLOTS; s++) {
        const c = document.createElement('div')
        c.className = 'slot'
        c.dataset.day = day
        c.dataset.slot = s
        col.append(c)
      }
      return col
    }),
  )
  for (const e of events) {
    const el = document.createElement('div')
    el.className = 'ev'
    el.dataset.id = e.id
    el.textContent = e.title
    const h = document.createElement('div')
    h.className = 'handle'
    h.dataset.handle = ''
    el.append(h)
    place(el, e)
    grid().children[e.day].append(el)
  }
  const draft = document.createElement('div')
  draft.className = 'draft'
  draft.hidden = true
  grid().append(draft)
  scroller().scrollTop = 16 * 24
}

export function place(el, { day, start, len }) {
  el.style.setProperty('--start', start)
  el.style.setProperty('--len', len)
  if (el.classList.contains('draft')) {
    const col = grid().children[day]
    // Clear the stylesheet's inline insets first; setting them after `left` would undo it.
    el.style.insetInline = 'auto'
    el.style.left = `${col.offsetLeft + 2}px`
    el.style.width = `${col.offsetWidth - 4}px`
  }
}

/** The cell under a viewport point, as { day, slot }, or null outside the grid. */
export function cellAt(x, y) {
  for (const el of document.elementsFromPoint(x, y)) {
    if (el.matches?.('.slot'))
      return { day: +el.dataset.day, slot: +el.dataset.slot }
    if (el.matches?.('.col')) {
      // Over an event: find the slot by walking the column's cells (still data, not geometry math).
      const cells = el.querySelectorAll('.slot')
      for (const c of cells) {
        const r = c.getBoundingClientRect()
        if (y >= r.top && y < r.bottom)
          return { day: +c.dataset.day, slot: +c.dataset.slot }
      }
    }
  }
  return null
}

export const byId = (id) => events.find((e) => e.id === id)
export const elOf = (id) => grid().querySelector(`.ev[data-id="${id}"]`)

// The draft: one snapped preview inside the grid.
export function showDraft(e) {
  const d = $('.draft')
  d.hidden = false
  d.textContent = e.title
  place(d, e)
}
export function hideDraft() {
  $('.draft').hidden = true
}

export function commit(id, next) {
  const e = byId(id)
  Object.assign(e, next)
  const el = elOf(id)
  grid().children[e.day].append(el)
  place(el, e)
  note(`commit ${id} day=${e.day} start=${e.start} len=${e.len}`)
}

// Autoscroll while the pointer is near the scroller's top or bottom edge.
export function autoscroller() {
  let y = null,
    raf = 0
  const tick = () => {
    const r = scroller().getBoundingClientRect()
    const edge = 32
    if (y != null) {
      if (y < r.top + edge) scroller().scrollTop -= 8
      else if (y > r.bottom - edge) scroller().scrollTop += 8
    }
    raf = requestAnimationFrame(tick)
  }
  return {
    start() {
      if (!raf) raf = requestAnimationFrame(tick)
    },
    move(clientY) {
      y = clientY
    },
    stop() {
      cancelAnimationFrame(raf)
      raf = 0
      y = null
    },
  }
}

// Resize by pointer, used by every engine (native DnD can't resize).
export function setupResize() {
  grid().addEventListener('pointerdown', (ev) => {
    const h = ev.target.closest('[data-handle]')
    if (!h) return
    ev.preventDefault()
    ev.stopPropagation()
    const id = h.parentElement.dataset.id
    const wasDraggable = h.parentElement.draggable
    h.parentElement.draggable = false
    const restore = () => {
      h.parentElement.draggable = wasDraggable
    }
    const e = byId(id)
    h.setPointerCapture(ev.pointerId)
    let len = e.len
    const move = (m) => {
      const c = cellAt(m.clientX, m.clientY)
      if (c && c.day === e.day) {
        len = Math.max(1, c.slot - e.start + 1)
        showDraft({ ...e, len })
      }
    }
    const up = () => {
      restore()
      h.removeEventListener('pointermove', move)
      hideDraft()
      if (len !== e.len) commit(id, { len })
      else note('resize unchanged')
    }
    h.addEventListener('pointermove', move)
    h.addEventListener('pointerup', up, { once: true })
    h.addEventListener(
      'pointercancel',
      () => {
        restore()
        h.removeEventListener('pointermove', move)
        hideDraft()
        note('resize cancelled')
      },
      { once: true },
    )
  })
}

// A native drop zone outside the calendar: stands in for another app or another calendar instance.
export function setupOutside() {
  const out = $('#out')
  out.addEventListener('dragover', (e) => {
    e.preventDefault()
    out.dataset.over = ''
  })
  out.addEventListener('dragleave', () => delete out.dataset.over)
  out.addEventListener('drop', (e) => {
    e.preventDefault()
    delete out.dataset.over
    const json = e.dataTransfer.getData('application/x-bc-event')
    const text = e.dataTransfer.getData('text/plain')
    out.textContent = `Received: ${text}`
    note(`outside drop json=${json} text=${text}`)
  })
}
