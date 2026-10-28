// P3 vanilla prototype: wires the machines to the DOM through prop
// descriptors. Everything here would be split between `interactions`
// (descriptors, machines) and a binding (applying them) in the product.
import { EVENTS, TODAY, SLOT_MINUTES, validate } from './data.js'
import {
  addDays,
  addMonths,
  format,
  sameMonth,
  diffDays,
  monthWeeks,
} from './dates.js'
import { messages } from './messages.js'
import { eventName } from './names.js'
import { createLiveRegion } from './live.js'
import { applyProps, h } from './props.js'
import { sync } from './sync.js'
import {
  monthKey,
  allDayKey,
  timeKey,
  keyOf,
  selectionCells,
  selectionDays,
} from './machines/grid.js'
import { eventGroupKey, entryPoint, compareEvents } from './machines/events.js'
import {
  monthModel,
  weekModel,
  slotsOf,
  slotName,
  backgroundFor,
  positionOfEvent,
  SLOTS_PER_DAY,
} from './model.js'
import * as fsm from './machines/move-fsm.js'

const params = new URLSearchParams(location.search)
const state = {
  view: params.get('view') === 'week' ? 'week' : 'month',
  date: params.get('date') ?? TODAY,
  focus: {
    month: params.get('date') ?? TODAY,
    allday: params.get('date') ?? TODAY,
    time: { date: params.get('date') ?? TODAY, slot: 18 },
  },
  eventFocus: null,
  selection: null,
  popover: null,
  menu: null,
  move: fsm.initialMove,
  pending: new Set(),
  events: EVENTS.map((e) => ({ ...e })),
}
const rtl = document.documentElement.dir === 'rtl'
const byId = (id) => state.events.find((e) => e.id === id)

// ---------- DOM skeleton ----------
const root = document.getElementById('calendar')
const label = h('h2', {
  attrs: { id: 'bc-label', class: 'bc-label', 'aria-live': 'polite' },
})
const labelPrefix = h(
  'span',
  { attrs: { id: 'bc-label-prefix', hidden: true } },
  messages.calendarLabel,
)
const toolbar = h('div', {
  attrs: {
    role: 'toolbar',
    'aria-label': messages.toolbarLabel,
    class: 'bc-toolbar',
  },
})
const views = h('div', { attrs: { class: 'bc-views' } })
const status = h('div', {
  attrs: {
    role: 'status',
    'aria-live': 'polite',
    'aria-atomic': 'true',
    class: 'bc-visually-hidden',
  },
})
const popover = h('div', {
  attrs: {
    popover: 'auto',
    role: 'dialog',
    class: 'bc-popover',
    id: 'bc-more',
  },
})
const menu = h('div', {
  attrs: { popover: 'auto', role: 'menu', class: 'bc-menu', id: 'bc-menu' },
})
const descriptions = h('div', { attrs: { hidden: true } })
applyProps(root, {
  attrs: {
    'aria-labelledby': 'bc-label-prefix bc-label',
    class: 'bc-calendar',
  },
})
root.append(
  labelPrefix,
  h('div', { attrs: { class: 'bc-header' } }, toolbar, label),
  views,
  status,
  popover,
  menu,
  descriptions,
)
const live = createLiveRegion(status)
const log = (text) =>
  document.getElementById('app-log')?.prepend(h('li', {}, text))
const announceApp = (text) => {
  log(text)
  live.announce(`App: ${text}`)
}

// ---------- effects runtime for the move machine ----------
const moveCtx = {
  messages,
  title: (id) => byId(id).title,
  slotsOf,
  validate: (draft) => validate(draft),
  positionOf(id) {
    const e = byId(id)
    if (state.view === 'month') return { surface: 'month', date: e.start }
    if (e.allDay) return { surface: 'allday', date: e.start }
    return {
      surface: 'time',
      date: e.start,
      slot: Math.floor(e.startMin / SLOT_MINUTES),
    }
  },
  describe(id, draft, invalid) {
    const e = byId(id)
    const moved = applyDraft(e, draft)
    let text = eventName(moved)
    if (Boolean(moved.allDay) !== Boolean(e.allDay))
      text += `, ${moved.allDay ? messages.willBecomeAllDay : messages.willBecomeTimed}`
    if (invalid) text += `, ${messages.notAllowed(invalid)}`
    return text
  },
}
function applyDraft(e, draft) {
  if (draft.surface === 'time') {
    const len = e.allDay
      ? 60
      : e.endDate
        ? 1440 - e.startMin + e.endMin
        : e.endMin - e.startMin
    const startMin = draft.slot * SLOT_MINUTES
    const { end, endDate, ...rest } = e
    const endMin = startMin + len
    return {
      ...rest,
      allDay: false,
      start: draft.date,
      startMin,
      endMin: endMin % 1440 || 1440,
      ...(endMin > 1440 ? { endDate: addDays(draft.date, 1) } : {}),
    }
  }
  const days = e.allDay ? diffDays(e.start, e.end) : 1
  if (draft.surface === 'allday' || e.allDay) {
    const { startMin, endMin, endDate, ...rest } = e
    return {
      ...rest,
      allDay: true,
      start: draft.date,
      end: addDays(draft.date, days),
    }
  }
  // Month view keeps the time and changes the date.
  return {
    ...e,
    start: draft.date,
    ...(e.endDate
      ? { endDate: addDays(draft.date, diffDays(e.start, e.endDate)) }
      : {}),
  }
}
function sendMove(event) {
  const { state: next, effects } = fsm.transition(state.move, event, moveCtx)
  state.move = next
  for (const fx of effects) {
    if (fx.type === 'announce') live.announce(fx.text)
    if (fx.type === 'commit') commit(fx.id, fx.to)
    if (fx.type === 'render') render()
    if (fx.type === 'focus') focusEvent(fx.id)
  }
}
function commit(id, draft) {
  const i = state.events.findIndex((e) => e.id === id)
  state.events[i] = applyDraft(state.events[i], draft)
  state.pending.add(id)
  log(
    `onEventDrop(${id} → ${draft.surface} ${draft.date}${draft.slot != null ? ' ' + format.time(draft.slot * SLOT_MINUTES) : ''})`,
  )
  setTimeout(() => {
    state.pending.delete(id)
    render()
  }, 1500)
}

// ---------- toolbar ----------
const unit = () => (state.view === 'month' ? 'month' : 'week')
function navigate(date) {
  state.date = date
  state.selection = null
  if (state.view === 'month')
    state.focus.month = clampMonthFocus(state.focus.month, date)
  render()
}
function clampMonthFocus(focus, date) {
  const days = monthWeeks(date).flat()
  return days.includes(focus) && sameMonth(focus, date) ? focus : date
}
const toolbarItems = [
  {
    key: 'today',
    text: () => messages.today,
    name: () => messages.today,
    onClick: () => {
      state.focus.month = TODAY
      state.focus.allday = TODAY
      state.focus.time.date = TODAY
      navigate(TODAY)
    },
  },
  {
    key: 'prev',
    text: () => '‹',
    name: () => messages.previous(unit()),
    onClick: () =>
      navigate(
        state.view === 'month'
          ? addMonths(state.date, -1)
          : addDays(state.date, -7),
      ),
  },
  {
    key: 'next',
    text: () => '›',
    name: () => messages.next(unit()),
    onClick: () =>
      navigate(
        state.view === 'month'
          ? addMonths(state.date, 1)
          : addDays(state.date, 7),
      ),
  },
  {
    key: 'view',
    text: () => `${messages.views[state.view]} ▾`,
    name: () => messages.viewButton(messages.views[state.view]),
    onClick: (e) => openViewMenu(e.currentTarget),
    menu: true,
  },
]
let toolbarFocus = 'today'
function renderToolbar() {
  sync(
    toolbar,
    toolbarItems.map((item) => ({
      key: item.key,
      create: () =>
        h('button', {
          attrs: { type: 'button', class: `bc-tool bc-tool-${item.key}` },
        }),
      update: (el) => {
        el.textContent = item.text()
        applyProps(el, {
          attrs: {
            'aria-label': item.name(),
            tabindex: toolbarFocus === item.key ? 0 : -1,
            ...(item.menu
              ? {
                  'aria-haspopup': 'menu',
                  'aria-expanded': String(state.menu?.kind === 'view'),
                }
              : {}),
          },
          on: {
            click: item.onClick,
            focus: () => (toolbarFocus = item.key),
            keydown: (e) => {
              const k = keyOf(e, rtl)
              const i = toolbarItems.findIndex((t) => t.key === item.key)
              const j =
                k.key === 'ArrowRight'
                  ? i + 1
                  : k.key === 'ArrowLeft'
                    ? i - 1
                    : k.key === 'Home'
                      ? 0
                      : k.key === 'End'
                        ? toolbarItems.length - 1
                        : null
              if (j == null || !toolbarItems[j]) return
              e.preventDefault()
              toolbarFocus = toolbarItems[j].key
              renderToolbar()
              toolbar.querySelector(`.bc-tool-${toolbarFocus}`).focus()
            },
          },
        })
      },
    })),
  )
  label.textContent =
    state.view === 'month'
      ? format.monthYear(state.date)
      : (() => {
          const d = weekModel([], state.date).days
          return format.range(d[0], d.at(-1))
        })()
}

// ---------- shared: selection ----------
function extendSelection(grid, cell) {
  const anchor =
    state.selection?.grid === grid ? state.selection.anchor : currentCell(grid)
  state.selection = { grid, anchor, head: cell }
  live.announce(messages.selected(describeSelection(state.selection)))
}
function selectOne(grid, cell) {
  state.selection = { grid, anchor: cell, head: cell }
  live.announce(messages.selected(describeSelection(state.selection)))
}
function describeSelection(sel) {
  const [d0, d1] = [sel.anchor.date, sel.head.date].sort()
  const invalid = validate({ date: d0 }) ?? validate({ date: d1 })
  let text
  if (sel.grid === 'time') {
    const [s0, s1] = [sel.anchor.slot, sel.head.slot].sort((a, b) => a - b)
    const time = format.timeRange(s0 * SLOT_MINUTES, (s1 + 1) * SLOT_MINUTES)
    text =
      d0 === d1
        ? `${time}, ${format.day(d0)}`
        : `${time}, ${format.weekdayLong(d0)} to ${format.weekdayLong(d1)}`
  } else {
    text =
      d0 === d1
        ? format.day(d0)
        : `${format.day(d0)} to ${format.day(d1)}, ${selectionDays(sel)} days`
  }
  return invalid ? `${text}, ${messages.notAllowed(invalid)}` : text
}
function confirmSelection(grid) {
  const sel = state.selection ?? {
    grid,
    anchor: currentCell(grid),
    head: currentCell(grid),
  }
  const text = describeSelection(sel)
  if (text.includes(messages.notAllowed(''))) return live.announce(text)
  announceApp(`onSelectSlot: ${text}`)
}
function currentCell(grid) {
  return grid === 'time' ? { ...state.focus.time } : { date: state.focus[grid] }
}

// ---------- shared: grid key handling ----------
function onGridKey(grid, e) {
  const k = keyOf(e, rtl)
  if (state.move.mode === 'moving') return onMoveKey(e, k)
  let action
  if (grid === 'month')
    action = monthKey(
      {
        focus: state.focus.month,
        days: monthWeeks(state.date).flat(),
        anchor: state.date,
      },
      k,
    )
  if (grid === 'allday')
    action = allDayKey(
      { focus: state.focus.allday, days: weekModel([], state.date).days },
      k,
    )
  if (grid === 'time')
    action = timeKey(
      {
        focus: state.focus.time,
        days: weekModel([], state.date).days,
        slotsOf,
      },
      k,
    )
  if (!action) return
  e.preventDefault()
  if (action.type === 'confirm') return confirmSelection(grid)
  if (action.type === 'selectOne') {
    selectOne(grid, currentCell(grid))
    return render()
  }
  if (action.type === 'clear') {
    if (state.selection) {
      state.selection = null
      live.announce(messages.selectionCleared)
    }
    return render()
  }
  if (action.type === 'hop') {
    if (action.grid === 'allday') state.focus.allday = action.date
    else state.focus.time = { date: action.date, slot: slotsOf(action.date)[0] }
    render()
    return focusGrid(action.grid)
  }
  const cell =
    grid === 'time'
      ? { date: action.date, slot: action.slot }
      : { date: action.date }
  if (action.navigate) {
    state.date = action.navigate
    if (!action.extend) state.selection = null
  }
  if (action.extend) extendSelection(grid, cell)
  if (grid === 'time') state.focus.time = cell
  else state.focus[grid] = action.date
  render()
  focusGrid(grid)
}
function focusGrid(grid) {
  views.querySelector(`[data-grid="${grid}"] [tabindex="0"]`)?.focus()
}

// ---------- event group ----------
function eventOrder() {
  // Items in the one event group: events (first visible piece only) and "+N more" buttons,
  // in layout order (D-59), never DOM order. "+N more" sits after its day's visible events.
  const ids = [...views.querySelectorAll('[data-item]')]
    .filter((el) => !el.closest('[aria-hidden="true"]'))
    .map((el) => el.dataset.item)
  const dateOf = (id) => (id.startsWith('more:') ? id.slice(5) : byId(id).start)
  return ids.sort((a, b) => {
    if (dateOf(a) !== dateOf(b)) return dateOf(a) < dateOf(b) ? -1 : 1
    if (a.startsWith('more:')) return 1
    if (b.startsWith('more:')) return -1
    return compareEvents(byId(a), byId(b))
  })
}
function onEventKey(id, e) {
  const k = keyOf(e, rtl)
  if (state.move.mode === 'moving') return onMoveKey(e, k)
  if (e.key === 'Tab' && e.shiftKey) {
    // Shift+Tab returns to the event's own day or slot (spec 2.3).
    e.preventDefault()
    if (id.startsWith('more:')) {
      state.focus.month = id.slice(5)
      render()
      return focusGrid('month')
    }
    return focusCellOf(byId(id))
  }
  const action = eventGroupKey(
    { order: eventOrder(), focus: id },
    { ...k, key: e.key === 'F10' ? 'F10' : k.key },
  )
  if (!action) return
  e.preventDefault()
  if (action.type === 'focus') return focusItem(action.id)
  if (action.type === 'activate') return activate(action.id)
  if (action.type === 'menu') return openEventMenu(action.id, e.currentTarget)
}
function focusItem(id) {
  state.eventFocus = id
  render()
  views
    .querySelector(
      `[data-item="${CSS.escape(id)}"]:not([aria-hidden="true"] *)`,
    )
    ?.focus()
}
function focusEvent(id) {
  focusItem(id)
}
function focusCellOf(ev) {
  const pos = positionOfEvent(ev)
  if (state.view === 'month') {
    state.focus.month = pos.date
    render()
    return focusGrid('month')
  }
  if (ev.allDay) {
    state.focus.allday = pos.date
    render()
    return focusGrid('allday')
  }
  state.focus.time = {
    date: pos.date,
    slot: Math.floor(pos.minute / SLOT_MINUTES),
  }
  render()
  focusGrid('time')
}
function activate(id) {
  if (id.startsWith('more:')) return openMore(id.slice(5))
  announceApp(`onSelectEvent: ${byId(id).title}`)
}
/** When a cell is focused, the event group's entry point follows it (spec 2.3). */
function setEntryFromCell(cell) {
  const items = eventOrder().map((id) => {
    if (id.startsWith('more:')) return { id, date: id.slice(5), minute: 2000 }
    const p = positionOfEvent(byId(id))
    return { id, ...p }
  })
  const hit = entryPoint(items, {
    date: cell.date,
    minute: cell.slot != null ? cell.slot * SLOT_MINUTES : -1,
  })
  if (hit && hit.id !== state.eventFocus) {
    state.eventFocus = hit.id
    renderTabStops()
  }
}
function renderTabStops() {
  for (const el of views.querySelectorAll('[data-item]'))
    el.tabIndex =
      el.dataset.item === state.eventFocus &&
      !el.closest('[aria-hidden="true"]')
        ? 0
        : -1
}

// ---------- move mode ----------
function onMoveKey(e, k) {
  if (e.key === 'Escape') {
    e.preventDefault()
    return sendMove({ type: 'CANCEL' })
  }
  if (e.key === 'Enter') {
    e.preventDefault()
    return sendMove({ type: 'DROP' })
  }
  if (e.key === 'Tab') return
  if (
    [
      'ArrowUp',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
      'PageUp',
      'PageDown',
    ].includes(e.key)
  ) {
    e.preventDefault()
    sendMove({ type: 'KEY', key: k })
  }
}
function onCellClick(grid, cell, e) {
  if (state.move.mode !== 'moving') return
  e.preventDefault()
  const surface = state.view === 'month' ? 'month' : grid
  sendMove({
    type: 'POINTER_DROP',
    target: {
      surface,
      date: cell.date,
      ...(grid === 'time' ? { slot: cell.slot } : {}),
    },
  })
}

// ---------- menus and popovers ----------
function openViewMenu(button) {
  state.menu = { kind: 'view' }
  const items = ['month', 'week'].map((v) =>
    h(
      'div',
      {
        attrs: {
          role: 'menuitemradio',
          'aria-checked': String(state.view === v),
          tabindex: -1,
          class: 'bc-menuitem',
        },
        on: {
          click: () => {
            closeMenu()
            setView(v)
            button.focus()
          },
        },
      },
      messages.views[v],
    ),
  )
  showMenu(button, items, null)
}
function openEventMenu(id, anchor) {
  const ev = byId(id)
  if (!ev) return
  state.menu = { kind: 'event', id }
  const entries = ev.readOnly
    ? [['details', () => announceApp(`showDetails: ${ev.title}`)]]
    : [
        ['open', () => announceApp(`onDoubleClickEvent: ${ev.title}`)],
        ['move', () => sendMove({ type: 'START', id })],
        ['delete', () => announceApp(`onEventDelete: ${ev.title}`)],
      ]
  const items = entries.map(([key, run]) =>
    h(
      'div',
      {
        attrs: { role: 'menuitem', tabindex: -1, class: 'bc-menuitem' },
        on: {
          click: () => {
            closeMenu()
            focusEvent(id)
            run()
          },
        },
      },
      messages.menu[key],
    ),
  )
  showMenu(anchor, items, messages.menuLabel(ev.title))
}
function showMenu(anchor, items, name) {
  menu.replaceChildren(...items)
  applyProps(menu, {
    attrs: {
      'aria-label': name ?? messages.viewButton(messages.views[state.view]),
    },
  })
  menu.__return = anchor
  menu.showPopover()
  place(menu, anchor)
  items[0].tabIndex = 0
  items[0].focus()
  renderToolbar()
}
function closeMenu() {
  if (menu.matches(':popover-open')) menu.hidePopover()
}
applyProps(menu, {
  on: {
    keydown: (e) => {
      const items = [...menu.querySelectorAll('[role^="menuitem"]')]
      const i = items.indexOf(document.activeElement)
      const j =
        e.key === 'ArrowDown'
          ? (i + 1) % items.length
          : e.key === 'ArrowUp'
            ? (i - 1 + items.length) % items.length
            : e.key === 'Home'
              ? 0
              : e.key === 'End'
                ? items.length - 1
                : null
      if (j != null) {
        e.preventDefault()
        items[j].focus()
      }
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        document.activeElement.click()
      }
      if (e.key === 'Tab') {
        e.preventDefault()
        closeMenu()
      }
    },
    toggle: (e) => {
      if (e.newState === 'closed') {
        const ret = menu.__return
        state.menu = null
        renderToolbar()
        if (ret?.isConnected && !root.contains(document.activeElement))
          ret.focus()
        else if (ret?.isConnected && menu.contains(document.activeElement))
          ret.focus()
      }
    },
  },
})
function setView(v) {
  state.view = v
  state.selection = null
  if (v === 'week')
    state.focus.time.date = state.focus.allday = state.focus.month
  else state.focus.month = state.focus.time.date
  render()
}
function openMore(date) {
  state.popover = { date }
  const model = monthModel(state.events, state.date)
  const list = model.byDay.get(date).filter((x) => !x.continuation)
  const heading = h('h3', { attrs: { id: 'bc-more-title' } }, format.long(date))
  const buttons = list.map(({ event: ev }, i) =>
    h(
      'button',
      {
        attrs: {
          type: 'button',
          class: 'bc-event',
          tabindex: i === 0 ? 0 : -1,
          'aria-label': eventName(ev, {
            withDate: false,
            pending: state.pending.has(ev.id),
          }),
        },
        on: {
          click: () => announceApp(`onSelectEvent: ${ev.title}`),
          keydown: (e) => {
            const all = [...popover.querySelectorAll('button')]
            const j = all.indexOf(e.currentTarget)
            const n =
              e.key === 'ArrowDown' ? j + 1 : e.key === 'ArrowUp' ? j - 1 : null
            if (n != null && all[n]) {
              e.preventDefault()
              all[j].tabIndex = -1
              all[n].tabIndex = 0
              all[n].focus()
            }
            if (e.key === 'Tab') {
              e.preventDefault()
              popover.hidePopover()
            }
          },
        },
      },
      ev.title,
    ),
  )
  popover.replaceChildren(
    heading,
    h('div', { attrs: { class: 'bc-more-list' } }, buttons),
  )
  applyProps(popover, { attrs: { 'aria-labelledby': 'bc-more-title' } })
  const button = views.querySelector(`[data-item="more:${date}"]`)
  popover.__return = date
  popover.showPopover()
  place(popover, button)
  buttons[0]?.focus()
}
applyProps(popover, {
  on: {
    toggle: (e) => {
      if (e.newState !== 'closed') return
      const date = popover.__return
      state.popover = null
      // Focus returns to "+N more", or to the day cell if the button is gone (D-50).
      if (
        root.contains(document.activeElement) &&
        !popover.contains(document.activeElement)
      )
        return
      const button = views.querySelector(`[data-item="more:${date}"]`)
      if (button) focusItem(`more:${date}`)
      else {
        state.focus.month = date
        render()
        focusGrid('month')
      }
    },
  },
})
function place(el, anchor) {
  // The product uses CSS anchor positioning with a lazy fallback (D-43, D-87);
  // the prototype positions with JS everywhere for simplicity.
  const r = anchor.getBoundingClientRect()
  el.style.left = `${Math.min(r.left, innerWidth - el.offsetWidth - 8)}px`
  el.style.top = `${Math.min(r.bottom + 4, innerHeight - el.offsetHeight - 8)}px`
}

// ---------- pointer selection ----------
let dragging = null
function onCellPointerDown(grid, cell, e) {
  if (state.move.mode === 'moving' || e.button !== 0) return
  dragging = { grid, anchor: cell }
  if (grid === 'time') state.focus.time = cell
  else state.focus[grid] = cell.date
  state.selection = { grid, anchor: cell, head: cell }
  render()
}
function onCellPointerEnter(grid, cell) {
  if (!dragging || dragging.grid !== grid) return
  state.selection = { grid, anchor: dragging.anchor, head: cell }
  render()
}
addEventListener('pointerup', () => {
  if (!dragging) return
  dragging = null
  if (state.selection) {
    live.announce(messages.selected(describeSelection(state.selection)))
    confirmSelection(state.selection.grid)
  }
})

// ---------- views ----------
import { renderMonth } from './view-month.js'
import { renderWeek } from './view-week.js'
const api = {
  state,
  messages,
  byId,
  eventName,
  slotsOf,
  slotName,
  backgroundFor,
  SLOTS_PER_DAY,
  SLOT_MINUTES,
  TODAY,
  descriptions,
  monthModel,
  weekModel,
  selectionCells,
  onGridKey,
  onEventKey,
  onCellClick,
  onCellPointerDown,
  onCellPointerEnter,
  setEntryFromCell,
  activate,
  openEventMenu,
  applyDraft,
  format,
  sameMonth,
  onCellFocus(grid, cell) {
    if (grid === 'time') state.focus.time = cell
    else state.focus[grid] = cell.date
    for (const el of views.querySelectorAll(
      `[data-grid="${grid}"] [role="gridcell"]`,
    ))
      el.tabIndex = el.dataset.key === keyFor(grid, cell) ? 0 : -1
    setEntryFromCell(cell)
  },
  secondary(id) {
    announceApp(`onDoubleClickEvent: ${byId(id).title}`)
  },
  onEventFocus(id) {
    state.eventFocus = id
    renderTabStops()
    // The grid's Tab stop follows the event, so Shift+Tab lands on its cell.
    if (id.startsWith('more:')) return void (state.focus.month = id.slice(5))
    const ev = byId(id)
    if (!ev) return
    const pos = positionOfEvent(ev)
    if (state.view === 'month') state.focus.month = pos.date
    else if (ev.allDay) state.focus.allday = pos.date
    else
      state.focus.time = {
        date: pos.date,
        slot: Math.floor(pos.minute / SLOT_MINUTES),
      }
  },
}
export function keyFor(grid, cell) {
  return grid === 'time' ? `${cell.date}@${cell.slot}` : cell.date
}
api.keyFor = keyFor

function render() {
  renderToolbar()
  if (state.view === 'month') renderMonth(views, api)
  else renderWeek(views, api)
  renderTabStops()
}
render()
document.getElementById('today-note').textContent =
  `Today is fixed at ${format.long(TODAY)}.`
