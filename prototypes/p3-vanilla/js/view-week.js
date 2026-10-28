// Week view (spec section 4): the all-day grid (an embedded day grid), the
// time body with a focusable cell per slot, and the event layers.
import { h, applyProps } from './props.js'
import { sync } from './sync.js'
import { eventHandlers } from './view-month.js'
import { validate, DST } from './data.js'

export function renderWeek(views, api) {
  const { state, messages, format, SLOT_MINUTES, SLOTS_PER_DAY } = api
  const model = api.weekModel(state.events, state.date)
  const { days } = model
  if (!days.includes(state.focus.allday)) state.focus.allday = days[0]
  if (!days.includes(state.focus.time.date))
    state.focus.time = { date: days[0], slot: state.focus.time.slot }
  const label = format.range(days[0], days.at(-1))
  const sel = state.selection
  const inAllDay =
    sel?.grid === 'allday' ? api.selectionCells(sel) : () => false
  const inTime = sel?.grid === 'time' ? api.selectionCells(sel) : () => false
  const moving = state.move.mode === 'moving' ? state.move : null

  let view = views.querySelector('.bc-week')
  let firstRender = false
  if (!view) {
    firstRender = true
    views.replaceChildren()
    view = h(
      'div',
      { attrs: { class: 'bc-week' } },
      h('div', {
        attrs: {
          role: 'grid',
          'data-grid': 'allday',
          class: 'bc-allday-grid',
          'aria-multiselectable': 'true',
          'aria-rowcount': 2,
          'aria-colcount': 7,
        },
      }),
      h(
        'div',
        { attrs: { class: 'bc-time-scroll' } },
        h('div', { attrs: { class: 'bc-time-axis', 'aria-hidden': 'true' } }),
        h('div', {
          attrs: {
            role: 'grid',
            'data-grid': 'time',
            class: 'bc-time-grid',
            'aria-multiselectable': 'true',
            'aria-colcount': 7,
          },
        }),
        h('div', { attrs: { class: 'bc-timed-layer' } }),
      ),
      h('div', { attrs: { class: 'bc-allday-layer' } }),
    )
    views.append(view)
  }
  const allDayGrid = view.querySelector('[data-grid="allday"]')
  const timeGrid = view.querySelector('[data-grid="time"]')
  const axis = view.querySelector('.bc-time-axis')
  const timedLayer = view.querySelector('.bc-timed-layer')
  const allDayLayer = view.querySelector('.bc-allday-layer')
  applyProps(allDayGrid, {
    attrs: { 'aria-label': `${messages.allDayGrid}, ${label}` },
  })
  applyProps(timeGrid, {
    attrs: {
      'aria-label': `${messages.timeGrid}, ${label}`,
      'aria-rowcount': SLOTS_PER_DAY,
    },
  })

  // ----- all-day grid: header row + one row of day cells -----
  const allDayCount = (date) =>
    model.allDay.filter(
      (p) => days.indexOf(date) >= p.col && days.indexOf(date) < p.col + p.span,
    ).length
  sync(allDayGrid, [
    {
      key: 'header',
      create: () =>
        h('div', {
          attrs: {
            role: 'row',
            'aria-rowindex': 1,
            class: 'bc-row bc-header-row',
          },
        }),
      update: (row) =>
        sync(
          row,
          days.map((date, c) => ({
            key: date,
            create: () =>
              h('div', {
                attrs: { role: 'columnheader', class: 'bc-colheader' },
              }),
            update: (el) => {
              el.textContent = `${format.weekdayShort(date)} ${format.dayNumber(date)}`
              applyProps(el, {
                attrs: {
                  'aria-colindex': c + 1,
                  'aria-label': format.day(date),
                  'data-today': date === api.TODAY || null,
                },
              })
            },
          })),
        ),
    },
    {
      key: 'cells',
      create: () =>
        h('div', {
          attrs: { role: 'row', 'aria-rowindex': 2, class: 'bc-row' },
        }),
      update: (row) =>
        sync(
          row,
          days.map((date, c) => ({
            key: date,
            create: () =>
              h('div', {
                attrs: {
                  role: 'gridcell',
                  class: 'bc-allday-cell',
                  'data-key': date,
                },
              }),
            update: (cell) =>
              applyProps(cell, {
                attrs: {
                  'aria-colindex': c + 1,
                  'aria-label': `${messages.allDay}, ${format.day(date)}, ${messages.events(allDayCount(date))}`,
                  'aria-current': date === api.TODAY ? 'date' : null,
                  'aria-selected': inAllDay({ date }) ? 'true' : null,
                  'data-invalid':
                    inAllDay({ date }) && validate({ date }) ? '' : null,
                  tabindex: date === state.focus.allday ? 0 : -1,
                  '--bc-col': c + 1,
                },
                on: {
                  keydown: (e) => api.onGridKey('allday', e),
                  focus: () => api.onCellFocus('allday', { date }),
                  click: (e) => api.onCellClick('allday', { date }, e),
                  pointerdown: (e) =>
                    api.onCellPointerDown('allday', { date }, e),
                  pointerenter: () =>
                    api.onCellPointerEnter('allday', { date }),
                },
              }),
          })),
        ),
    },
  ])

  // ----- time body: one row per slot, one cell per day -----
  if (firstRender || axis.childElementCount !== SLOTS_PER_DAY) {
    axis.replaceChildren(
      ...Array.from({ length: SLOTS_PER_DAY }, (_, s) =>
        h(
          'div',
          { attrs: { class: 'bc-axis-label' } },
          s % 2 === 0 ? format.time(s * SLOT_MINUTES) : '',
        ),
      ),
    )
  }
  sync(
    timeGrid,
    Array.from({ length: SLOTS_PER_DAY }, (_, slot) => ({
      key: String(slot),
      create: () =>
        h('div', {
          attrs: { role: 'row', class: 'bc-row', 'aria-rowindex': slot + 1 },
        }),
      update: (row) =>
        sync(
          row,
          days.map((date, c) => ({
            key: date,
            create: () =>
              h('div', { attrs: { role: 'gridcell', class: 'bc-slot' } }),
            update: (cell) => {
              const focusable = api.slotsOf(date).includes(slot)
              const bg = api.backgroundFor(date, slot)
              for (const b of bg) ensureDescription(api.descriptions, b)
              const cellKey = `${date}@${slot}`
              const name = focusable
                ? api.slotName(date, slot)
                : `${api.slotName(date, slot)}, ${messages.skippedSlot}`
              applyProps(cell, {
                attrs: {
                  'data-key': cellKey,
                  'aria-colindex': c + 1,
                  'aria-label': name,
                  'aria-describedby': bg.length
                    ? bg.map((b) => `bc-bg-${b.id}`).join(' ')
                    : null,
                  'aria-disabled': focusable ? null : 'true',
                  'aria-selected':
                    focusable && inTime({ date, slot }) ? 'true' : null,
                  'data-invalid':
                    inTime({ date, slot }) && validate({ date }) ? '' : null,
                  'data-hour': slot % 2 === 0 || null,
                  'data-background': bg.length ? '' : null,
                  'data-dst':
                    DST[date] &&
                    slot * SLOT_MINUTES >= DST[date].from &&
                    slot * SLOT_MINUTES < DST[date].to
                      ? DST[date].kind
                      : null,
                  tabindex: focusable
                    ? state.focus.time.date === date &&
                      state.focus.time.slot === slot
                      ? 0
                      : -1
                    : null,
                  '--bc-col': c + 1,
                  '--bc-row-start': slot + 1,
                },
                on: focusable
                  ? {
                      keydown: (e) => api.onGridKey('time', e),
                      focus: () => api.onCellFocus('time', { date, slot }),
                      click: (e) => api.onCellClick('time', { date, slot }, e),
                      pointerdown: (e) =>
                        api.onCellPointerDown('time', { date, slot }, e),
                      pointerenter: () =>
                        api.onCellPointerEnter('time', { date, slot }),
                    }
                  : {},
              })
            },
          })),
        ),
    })),
  )

  // ----- timed events: geometry as inline custom properties (D-68) -----
  const timed = days.flatMap((date, col) =>
    model.timed.get(date).map((p) => ({ ...p, col })),
  )
  const timedItems = timed.map((p) => ({
    key: `${p.event.id}${p.continuation ? ':c' : ''}`,
    create: () =>
      p.continuation
        ? h('div', {
            attrs: {
              class: 'bc-event bc-timed bc-continuation',
              'aria-hidden': 'true',
            },
          })
        : h('button', {
            attrs: {
              type: 'button',
              class: 'bc-event bc-timed',
              'data-item': p.event.id,
            },
          }),
    update: (el) => {
      el.textContent = p.event.title
      const geometry = {
        '--bc-col': p.col,
        '--bc-row-start': p.from / SLOT_MINUTES,
        '--bc-row-span':
          Math.max(p.to - p.from, SLOT_MINUTES / 2) / SLOT_MINUTES,
        '--bc-lane': p.lane,
        '--bc-lanes': p.lanes,
      }
      if (p.continuation) return applyProps(el, { attrs: geometry })
      applyProps(el, {
        attrs: {
          ...geometry,
          'aria-label': api.eventName(p.event, {
            pending: state.pending.has(p.event.id),
          }),
          'aria-description': p.event.tooltip ?? null,
          title: p.event.tooltip ?? null,
          'data-state': state.pending.has(p.event.id)
            ? 'pending'
            : moving?.id === p.event.id
              ? 'moving'
              : null,
          'data-read-only': p.event.readOnly || null,
        },
        on: eventHandlers(api, p.event.id),
      })
    },
  }))
  if (moving?.draft.surface === 'time') {
    const ev = api.byId(moving.id)
    const moved = api.applyDraft(ev, moving.draft)
    timedItems.push({
      key: 'draft',
      create: () =>
        h('div', {
          attrs: { class: 'bc-event bc-timed bc-draft', 'aria-hidden': 'true' },
        }),
      update: (el) => {
        el.textContent = ev.title
        applyProps(el, {
          attrs: {
            '--bc-col': days.indexOf(moving.draft.date),
            '--bc-row-start': moved.startMin / SLOT_MINUTES,
            '--bc-row-span':
              (moved.endDate
                ? 1440 - moved.startMin
                : moved.endMin - moved.startMin) / SLOT_MINUTES,
            '--bc-lane': 0,
            '--bc-lanes': 1,
            'data-invalid': validate(moving.draft) ? 'true' : 'false',
            hidden: days.includes(moving.draft.date) ? null : true,
          },
        })
      },
    })
  }
  sync(timedLayer, timedItems)

  // ----- all-day events -----
  const allDayItems = model.allDay.map((p, row) => ({
    key: p.event.id,
    create: () =>
      h('button', {
        attrs: {
          type: 'button',
          class: 'bc-event bc-allday',
          'data-item': p.event.id,
        },
      }),
    update: (el) => {
      el.textContent = p.event.title
      applyProps(el, {
        attrs: {
          '--bc-col': p.col + 1,
          '--bc-span': p.span,
          '--bc-row': row + 1,
          'aria-label': api.eventName(p.event, {
            pending: state.pending.has(p.event.id),
          }),
          'data-state': state.pending.has(p.event.id)
            ? 'pending'
            : moving?.id === p.event.id
              ? 'moving'
              : null,
          'data-starting-before-edge': p.clippedStart || null,
        },
        on: eventHandlers(api, p.event.id),
      })
    },
  }))
  if (moving?.draft.surface === 'allday' && days.includes(moving.draft.date)) {
    allDayItems.push({
      key: 'draft',
      create: () =>
        h('div', {
          attrs: {
            class: 'bc-event bc-allday bc-draft',
            'aria-hidden': 'true',
          },
        }),
      update: (el) => {
        el.textContent = api.byId(moving.id).title
        applyProps(el, {
          attrs: {
            '--bc-col': days.indexOf(moving.draft.date) + 1,
            '--bc-span': 1,
            '--bc-row': model.allDay.length + 1,
            'data-invalid': validate(moving.draft) ? 'true' : 'false',
          },
        })
      },
    })
  }
  sync(allDayLayer, allDayItems)
  applyProps(view, {
    attrs: { '--bc-allday-rows': Math.max(1, allDayItems.length) },
  })

  // DST weeks open at midnight so the changed hours are in view.
  if (firstRender)
    view.querySelector('.bc-time-scroll').scrollTop = days.some((d) => DST[d])
      ? 0
      : 8 * 2 * 24
}

function ensureDescription(container, b) {
  if (container.querySelector(`#bc-bg-${b.id}`)) return
  container.append(
    h('span', { attrs: { id: `bc-bg-${b.id}` } }, `Busy: ${b.title}`),
  )
}
