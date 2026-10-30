// A benchmark-sized engine: ingest, project, segment and pack, doing the same Temporal work the
// kernel will (date engine spec). `order` picks how instants are ordered:
//   'temporal' — cached Temporal.Instant objects and Instant.compare (the spec's default);
//   'bigint'   — cached epochNanoseconds (exact, identical results);
//   'number'   — cached epochMilliseconds (exact only for millisecond inputs).

export function makeEvents(n = 5000, seed = 1, spreadDays = 365) {
  let s = seed
  const rnd = () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648)
  const pad = (x) => String(x).padStart(2, '0')
  const out = []
  const base = Date.UTC(2026, 9, 28) - (spreadDays / 2) * 86400000
  for (let i = 0; i < n; i++) {
    const day = new Date(base + Math.floor(rnd() * spreadDays) * 86400000)
    const ymd = `${day.getUTCFullYear()}-${pad(day.getUTCMonth() + 1)}-${pad(day.getUTCDate())}`
    const r = rnd()
    if (r < 0.1) {
      const len = 1 + Math.floor(rnd() * 3)
      const end = new Date(day.getTime() + len * 86400000)
      out.push({ id: `e${i}`, start: ymd, end: `${end.getUTCFullYear()}-${pad(end.getUTCMonth() + 1)}-${pad(end.getUTCDate())}` })
    } else if (r < 0.13) {
      const next = new Date(day.getTime() + 86400000)
      out.push({ id: `e${i}`, start: ymd, end: `${next.getUTCFullYear()}-${pad(next.getUTCMonth() + 1)}-${pad(next.getUTCDate())}`, timeZone: 'Asia/Tokyo' })
    } else if (r < 0.18) {
      const h = 18 + Math.floor(rnd() * 5)
      out.push({ id: `e${i}`, start: `${ymd}T${pad(h)}:00:00-04:00`, end: new Date(Date.parse(`${ymd}T${pad(h)}:00:00-04:00`) + (8 + Math.floor(rnd() * 30)) * 3600000).toISOString() })
    } else if (r < 0.3) {
      const h = 6 + Math.floor(rnd() * 12)
      out.push({ id: `e${i}`, start: `${ymd}T${pad(h)}:30:00`, end: `${ymd}T${pad(h + 1)}:15:00`, timeZone: 'Europe/London' })
    } else {
      const h = 7 + Math.floor(rnd() * 11), m = [0, 15, 30, 45][Math.floor(rnd() * 4)]
      const start = `${ymd}T${pad(h)}:${pad(m)}:00-04:00`
      out.push({ id: `e${i}`, start, end: new Date(Date.parse(start) + (15 + Math.floor(rnd() * 8) * 15) * 60000).toISOString() })
    }
  }
  return out
}

export function createEngine(T, order = 'temporal') {
  const key = order === 'bigint' ? (i) => i.epochNanoseconds : order === 'number' ? (i) => i.epochMilliseconds : (i) => i
  const cmp = order === 'temporal' ? T.Instant.compare : (a, b) => (a < b ? -1 : a > b ? 1 : 0)

  function ingest(raw, displayZone) {
    const events = new Array(raw.length)
    for (let i = 0; i < raw.length; i++) {
      const e = raw[i]
      const allDay = e.start.length === 10
      let start, end
      if (allDay) {
        const s = T.PlainDate.from(e.start), x = T.PlainDate.from(e.end)
        if (e.timeZone) {
          start = s.toZonedDateTime(e.timeZone).toInstant()
          end = x.toZonedDateTime(e.timeZone).toInstant()
        } else {
          start = s.toZonedDateTime(displayZone).toInstant()
          end = x.toZonedDateTime(displayZone).toInstant()
        }
        events[i] = { id: e.id, allDay: !e.timeZone, civil: !e.timeZone ? [epochDay(s), epochDay(x)] : null, start, end }
      } else {
        start = /[Zz]|[+-]\d\d:\d\d$/.test(e.start) ? T.Instant.from(e.start) : T.PlainDateTime.from(e.start).toZonedDateTime(e.timeZone ?? displayZone).toInstant()
        end = /[Zz]|[+-]\d\d:\d\d$/.test(e.end) ? T.Instant.from(e.end) : T.PlainDateTime.from(e.end).toZonedDateTime(e.timeZone ?? displayZone).toInstant()
        events[i] = { id: e.id, allDay: false, civil: null, start, end }
      }
      const ev = events[i]
      ev.s = key(start)
      ev.e = key(end)
      if (cmp(ev.e, ev.s) < 0) throw new RangeError(`end before start: ${e.id}`)
    }
    // One sorted index by start, ties by longer duration then id (D-59).
    events.sort((a, b) => cmp(a.s, b.s) || cmp(b.e, a.e) || (a.id < b.id ? -1 : 1))
    return events
  }

  // Events overlapping [from, to): binary search on start, then scan back for long events.
  function inRange(events, from, to) {
    let lo = 0, hi = events.length
    while (lo < hi) { const mid = (lo + hi) >> 1; if (cmp(events[mid].s, to) < 0) lo = mid + 1; else hi = mid }
    const out = []
    for (let i = 0; i < lo; i++) { const ev = events[i]; if (cmp(ev.e, from) > 0 || (cmp(ev.e, ev.s) === 0 && cmp(ev.s, from) >= 0)) out.push(ev) }
    return out
  }

  function epochDay(d) {
    return Date.UTC(d.year, d.month - 1, d.day) / 86400000
  }

  // Index of the first day whose end is after `k` (binary search on day boundaries).
  function dayIndex(ds, k) {
    let lo = 0, hi = ds.length
    while (lo < hi) { const mid = (lo + hi) >> 1; if (cmp(ds[mid].end, k) <= 0) lo = mid + 1; else hi = mid }
    return lo
  }

  // The [first, last] day indexes an event covers in `ds`, or null.
  function cover(ev, ds) {
    let a, b
    if (ev.civil) {
      a = Math.max(0, ev.civil[0] - ds[0].day)
      b = Math.min(ds.length - 1, ev.civil[1] - 1 - ds[0].day)
    } else {
      a = dayIndex(ds, ev.s)
      const zero = cmp(ev.e, ev.s) === 0
      b = zero ? a : Math.min(ds.length - 1, dayIndex(ds, ev.e) - (cmp(ev.e, ds[Math.min(ds.length - 1, dayIndex(ds, ev.e))]?.start ?? ev.e) === 0 ? 1 : 0))
      if (!zero && dayIndex(ds, ev.e) >= ds.length) b = ds.length - 1
    }
    return a <= b && a < ds.length && b >= 0 ? [a, b] : null
  }

  function days(firstDay, n, zone) {
    const out = []
    let d = T.PlainDate.from(firstDay)
    for (let i = 0; i < n; i++) {
      const z = d.toZonedDateTime(zone)
      out.push({ date: d, day: epochDay(d), start: key(z.toInstant()), end: key(z.add({ days: 1 }).toInstant()), hours: z.hoursInDay })
      d = d.add({ days: 1 })
    }
    return out
  }

  // Time grid: segment timed events by day (wall-clock minutes, T-14), pack with `divide`.
  function week(events, firstDay, zone) {
    const ds = days(firstDay, 7, zone)
    const rangeStart = ds[0].start, rangeEnd = ds[6].end
    const evs = inRange(events, rangeStart, rangeEnd)
    const allDayRow = [], cols = ds.map(() => [])
    for (const ev of evs) {
      if (ev.allDay) { allDayRow.push(ev); continue }
      const c = cover(ev, ds)
      if (!c) continue
      for (let i = c[0]; i <= c[1]; i++) {
        const d = ds[i]
        const s = cmp(ev.s, d.start) < 0 ? 0 : wallMinutes(ev.start, zone)
        const e = cmp(ev.e, d.end) >= 0 ? 1440 : wallMinutes(ev.end, zone)
        cols[i].push({ ev, s, e: Math.max(e, s + 15) })
      }
    }
    const placed = cols.map(divide)
    const allDay = stack(allDayRow.map((ev) => { const c = cover(ev, ds); return c && { ev, a: c[0], b: c[1] } }).filter(Boolean), 7)
    return { placed, allDay }
  }

  // Month: 6 week rows; every event becomes a day span, packed with `stack` per row.
  function month(events, firstDay, zone) {
    const ds = days(firstDay, 42, zone)
    const evs = inRange(events, ds[0].start, ds[41].end)
    const byRow = [[], [], [], [], [], []]
    for (const ev of evs) {
      const c = cover(ev, ds)
      if (!c) continue
      for (let r = Math.floor(c[0] / 7); r <= Math.floor(c[1] / 7); r++)
        byRow[r].push({ ev, a: Math.max(c[0], r * 7) - r * 7, b: Math.min(c[1], r * 7 + 6) - r * 7 })
    }
    return byRow.map((spans) => stack(spans, 3))
  }

  function wallMinutes(instant, zone) {
    const t = instant.toZonedDateTimeISO(zone).toPlainTime()
    return t.hour * 60 + t.minute
  }

  function divide(segs) {
    segs.sort((x, y) => x.s - y.s || y.e - x.e || cmp(x.ev.s, y.ev.s) || (x.ev.id < y.ev.id ? -1 : 1))
    const out = [], ends = []
    let group = [], groupEnd = -1
    const flush = () => { for (const g of group) g.cols = ends.length; group = []; ends.length = 0 }
    for (const sg of segs) {
      if (sg.s >= groupEnd) flush()
      let c = ends.findIndex((e) => e <= sg.s)
      if (c < 0) { c = ends.length; ends.push(0) }
      ends[c] = sg.e
      groupEnd = Math.max(groupEnd, sg.e)
      const p = { id: sg.ev.id, s: sg.s, e: sg.e, col: c }
      group.push(p); out.push(p)
    }
    flush()
    return out
  }

  function stack(spans, maxRows) {
    spans.sort((x, y) => x.a - y.a || (y.b - y.a) - (x.b - x.a) || cmp(x.ev.s, y.ev.s) || (x.ev.id < y.ev.id ? -1 : 1))
    const rowsEnd = [], shown = [], more = new Array(7).fill(0)
    for (const sp of spans) {
      let r = rowsEnd.findIndex((e) => e < sp.a)
      if (r < 0) { r = rowsEnd.length; rowsEnd.push(-1) }
      rowsEnd[r] = sp.b
      if (r < maxRows) shown.push({ id: sp.ev.id, a: sp.a, b: sp.b, row: r })
      else for (let i = sp.a; i <= sp.b; i++) more[i]++
    }
    return { shown, more }
  }

  return { ingest, week, month }
}

// One measured run: ingest, then week or month. Returns timings in ms.
export function runOnce(T, order, raw, view) {
  const eng = createEngine(T, order)
  const t0 = performance.now()
  const events = eng.ingest(raw, 'America/New_York')
  const t1 = performance.now()
  const out = view === 'week' ? eng.week(events, '2026-10-25', 'America/New_York') : eng.month(events, '2026-09-27', 'America/New_York')
  const t2 = performance.now()
  return { ingest: t1 - t0, view: t2 - t1, total: t2 - t0, out }
}
