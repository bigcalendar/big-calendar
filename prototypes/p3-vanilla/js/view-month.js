// Month view (spec section 3).
import { h, applyProps } from './props.js'
import { sync } from './sync.js'

const MAX_VISIBLE = 3

export function renderMonth(views, api) {
  const { state, messages, format } = api
  const model = api.monthModel(state.events, state.date)
  const days = model.weeks.flat()
  if (!days.includes(state.focus.month)) state.focus.month = state.date
  const label = format.monthYear(state.date)
  const inSelection =
    state.selection?.grid === 'month'
      ? api.selectionCells(state.selection)
      : () => false

  let view = views.querySelector('.bc-month')
  if (!view) {
    views.replaceChildren()
    view = h(
      'div',
      { attrs: { class: 'bc-month' } },
      h('div', {
        attrs: {
          role: 'grid',
          'data-grid': 'month',
          class: 'bc-month-grid',
          'aria-multiselectable': 'true',
        },
      }),
      h('div', { attrs: { class: 'bc-month-events' } }),
    )
    views.append(view)
  }
  const grid = view.querySelector('[role="grid"]')
  const layer = view.querySelector('.bc-month-events')
  applyProps(grid, {
    attrs: {
      'aria-label': `${messages.monthGrid}, ${label}`,
      'aria-rowcount': model.weeks.length + 1,
      'aria-colcount': 7,
    },
  })
  applyProps(view, { attrs: { '--bc-rows': model.weeks.length } })

  const header = {
    key: 'header',
    create: () =>
      h(
        'div',
        {
          attrs: {
            role: 'row',
            'aria-rowindex': 1,
            class: 'bc-row bc-header-row',
          },
        },
        model.weeks[0].map((d, i) =>
          h(
            'div',
            {
              attrs: {
                role: 'columnheader',
                'aria-colindex': i + 1,
                'aria-label': format.weekdayLong(d),
                class: 'bc-colheader',
              },
            },
            format.weekdayShort(d),
          ),
        ),
      ),
  }
  sync(grid, [
    header,
    ...model.weeks.map((week, w) => ({
      key: week[0],
      create: () => h('div', { attrs: { role: 'row', class: 'bc-row' } }),
      update: (row) => {
        applyProps(row, { attrs: { 'aria-rowindex': w + 2 } })
        sync(
          row,
          week.map((date, c) => ({
            key: date,
            create: () =>
              h(
                'div',
                {
                  attrs: {
                    role: 'gridcell',
                    class: 'bc-day',
                    'data-key': date,
                  },
                },
                h(
                  'span',
                  { attrs: { class: 'bc-day-number', 'aria-hidden': 'true' } },
                  format.dayNumber(date),
                ),
              ),
            update: (cell) => {
              const items = model.byDay.get(date).filter((x) => !x.continuation)
              const outside = !api.sameMonth(date, state.date)
              let name = `${format.long(date)}, ${messages.events(items.length)}`
              if (outside)
                name += `, ${messages.outsideMonth(date < state.date)}`
              applyProps(cell, {
                attrs: {
                  'aria-colindex': c + 1,
                  'aria-label': name,
                  'aria-current': date === api.TODAY ? 'date' : null,
                  'aria-selected': inSelection({ date }) ? 'true' : null,
                  'data-outside': outside || null,
                  'data-invalid':
                    inSelection({ date }) && isInvalid(date) ? '' : null,
                  tabindex: date === state.focus.month ? 0 : -1,
                  '--bc-row': w + 1,
                  '--bc-col': c + 1,
                },
                on: {
                  keydown: (e) => api.onGridKey('month', e),
                  focus: () => api.onCellFocus('month', { date }),
                  click: (e) => api.onCellClick('month', { date }, e),
                  pointerdown: (e) =>
                    api.onCellPointerDown('month', { date }, e),
                  pointerenter: () => api.onCellPointerEnter('month', { date }),
                },
              })
            },
          })),
        )
      },
    })),
  ])

  // The event group: day containers mirror the grid; chips beyond MAX_VISIBLE collapse into "+N more".
  sync(
    layer,
    days.map((date, i) => ({
      key: date,
      create: () => h('div', { attrs: { class: 'bc-day-events' } }),
      update: (box) => {
        applyProps(box, {
          attrs: { '--bc-row': Math.floor(i / 7) + 1, '--bc-col': (i % 7) + 1 },
        })
        const all = model.byDay.get(date)
        const draft =
          state.move.mode === 'moving' &&
          state.move.draft.surface === 'month' &&
          state.move.draft.date === date
            ? api.byId(state.move.id)
            : null
        const visible = all.slice(0, MAX_VISIBLE)
        const hidden = all.length - visible.length
        const items = visible.map(({ event: ev, continuation }) => ({
          key: `${ev.id}${continuation ? ':c' : ''}`,
          create: () =>
            continuation
              ? h('div', {
                  attrs: {
                    class: 'bc-event bc-continuation',
                    'aria-hidden': 'true',
                  },
                })
              : h('button', {
                  attrs: {
                    type: 'button',
                    class: 'bc-event',
                    'data-item': ev.id,
                  },
                }),
          update: (el) => {
            el.textContent = ev.allDay
              ? ev.title
              : `${format.time(ev.startMin).replace(':00', '')} ${ev.title}`
            if (continuation) return
            applyProps(el, {
              attrs: {
                'aria-label': api.eventName(ev, {
                  pending: state.pending.has(ev.id),
                }),
                'aria-description': ev.tooltip ?? null,
                title: ev.tooltip ?? null,
                'data-state': state.pending.has(ev.id)
                  ? 'pending'
                  : state.move.id === ev.id && state.move.mode === 'moving'
                    ? 'moving'
                    : null,
                'data-all-day': ev.allDay || null,
                'data-read-only': ev.readOnly || null,
              },
              on: eventHandlers(api, ev.id),
            })
          },
        }))
        if (hidden > 0) {
          items.push({
            key: 'more',
            create: () =>
              h('button', {
                attrs: {
                  type: 'button',
                  class: 'bc-more',
                  'data-item': `more:${date}`,
                },
              }),
            update: (el) => {
              el.textContent = `+${hidden} more`
              applyProps(el, {
                attrs: {
                  'aria-label': `${messages.more(hidden)}, ${format.day(date)}`,
                  'aria-haspopup': 'dialog',
                  'aria-expanded': String(state.popover?.date === date),
                },
                on: {
                  click: () => api.activate(`more:${date}`),
                  keydown: (e) => api.onEventKey(`more:${date}`, e),
                  focus: () => api.onEventFocus(`more:${date}`),
                },
              })
            },
          })
        }
        if (draft) {
          items.push({
            key: 'draft',
            create: () =>
              h('div', {
                attrs: { class: 'bc-event bc-draft', 'aria-hidden': 'true' },
              }),
            update: (el) => {
              el.textContent = draft.title
              el.dataset.invalid = isInvalid(date) ? 'true' : 'false'
            },
          })
        }
        sync(box, items)
      },
    })),
  )

  function isInvalid(date) {
    return Boolean(validateDate(date))
  }
}

import { validate } from './data.js'
const validateDate = (date) => validate({ date })

export function eventHandlers(api, id) {
  return {
    keydown: (e) => api.onEventKey(id, e),
    focus: () => api.onEventFocus(id),
    click: () => (api.state.move.mode === 'moving' ? null : api.activate(id)),
    dblclick: () => api.secondary(id),
    contextmenu: (e) => {
      e.preventDefault()
      api.openEventMenu(id, e.currentTarget)
    },
  }
}
