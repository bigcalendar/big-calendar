// Correctness corpus: every operation the kernel relies on (date engine, time semantics T-1..T-14,
// calendar systems D-77), run against an injected Temporal. Returns { id: result } so two
// implementations can be compared case by case. Inputs are fixed; nothing depends on "now".

export const ZONES = [
  'UTC',
  'America/New_York',
  'America/Los_Angeles',
  'America/St_Johns',
  'America/Sao_Paulo',
  'America/Santiago',
  'America/Havana',
  'America/Godthab',
  'Europe/London',
  'Europe/Berlin',
  'Europe/Moscow',
  'Europe/Dublin',
  'Africa/Casablanca',
  'Africa/Cairo',
  'Asia/Jerusalem',
  'Asia/Tehran',
  'Asia/Kolkata',
  'Asia/Kathmandu',
  'Asia/Tokyo',
  'Australia/Sydney',
  'Australia/Adelaide',
  'Australia/Lord_Howe',
  'Pacific/Auckland',
  'Pacific/Chatham',
  'Pacific/Apia',
  'Pacific/Kiritimati',
  'Etc/GMT+12',
]
const CALENDARS = [
  'gregory',
  'islamic-umalqura',
  'hebrew',
  'persian',
  'japanese',
]
const LOCALES = ['en-US', 'de-DE', 'ja-JP', 'ar-SA', 'he-IL', 'fa-IR']

export function runCorpus(T) {
  const out = {}
  const rec = (id, fn) => {
    try {
      const v = fn()
      out[id] =
        typeof v === 'string'
          ? v
          : JSON.stringify(v, (k, x) =>
              typeof x === 'bigint' ? x.toString() : x,
            )
    } catch (e) {
      out[id] = `throws:${e.name}`
    }
  }
  const zdtStr = (z) => z.toString({ calendarName: 'never' })

  // 1. Zone transitions 1970-2040, and wall-clock behavior around each transition in 2024-2028.
  for (const zone of ZONES) {
    let z = T.ZonedDateTime.from({
      year: 1970,
      month: 1,
      day: 1,
      timeZone: zone,
    })
    const end = T.Instant.from('2040-12-31T00:00Z')
    const list = []
    for (let i = 0; i < 400; i++) {
      const n = z.getTimeZoneTransition('next')
      if (!n || T.Instant.compare(n.toInstant(), end) > 0) break
      list.push(zdtStr(n))
      z = n
    }
    rec(`transitions:${zone}`, () => list)
    for (const t of list.filter((s) => s >= '2024' && s < '2029')) {
      const at = T.ZonedDateTime.from(t)
      const before = at.subtract({ nanoseconds: 1 })
      const pdt = at.toPlainDateTime()
      for (let m = -90; m <= 90; m += 15) {
        const wall = pdt.add({ minutes: m })
        for (const d of ['compatible', 'earlier', 'later', 'reject'])
          rec(`wall:${zone}:${t}:${m}:${d}`, () =>
            zdtStr(wall.toZonedDateTime(zone, { disambiguation: d })),
          )
      }
      for (const z2 of [at, before]) {
        const k = `${zone}:${z2.epochNanoseconds}`
        rec(`startOfDay:${k}`, () => zdtStr(z2.startOfDay()))
        rec(`hoursInDay:${k}`, () => z2.hoursInDay)
        rec(`plainTime:${k}`, () => z2.toPlainTime().toString())
        rec(`addDay:${k}`, () => zdtStr(z2.add({ days: 1 })))
        rec(`add24h:${k}`, () => zdtStr(z2.add({ hours: 24 })))
        rec(`subMonth:${k}`, () => zdtStr(z2.subtract({ months: 1 })))
        rec(`untilNextDay:${k}`, () =>
          z2
            .until(z2.startOfDay().add({ days: 1 }), { largestUnit: 'hours' })
            .toString(),
        )
        rec(`roundDay:${k}`, () => zdtStr(z2.round({ smallestUnit: 'day' })))
        rec(`withTime:${k}`, () => zdtStr(z2.withPlainTime('02:30')))
        rec(`offset:${k}`, () => z2.offset)
      }
    }
  }

  // 2. Parsing (the public API takes strings; RFC 9557 suffixes; offset mismatches).
  const strings = [
    '2026-10-26T12:55:00Z',
    '2026-10-26T12:55:00-04:00',
    '2026-10-26T12:55:00.123456789+05:45',
    '2026-03-08T02:30:00-05:00[America/New_York]',
    '2026-11-01T01:30-04:00[America/New_York]',
    '2026-11-01T01:30-05:00[America/New_York]',
    '2026-11-01T01:30-06:00[America/New_York]',
    '2026-10-26T09:00[Asia/Tokyo]',
    '2026-10-26T09:00[u-ca=hebrew]',
    '2026-10-26',
    '+275760-09-13T00:00Z',
    '2026-10-26T24:00',
    '2026-02-30',
    '2026-10-26T09:00:60Z',
    '2026-W44-1',
    '20261026T125500Z',
  ]
  for (const s of strings) {
    rec(`parse:Instant:${s}`, () => T.Instant.from(s).toString())
    rec(`parse:ZDT:${s}`, () => T.ZonedDateTime.from(s).toString())
    rec(`parse:ZDTreject:${s}`, () =>
      T.ZonedDateTime.from(s, { offset: 'reject' }).toString(),
    )
    rec(`parse:ZDTprefer:${s}`, () =>
      T.ZonedDateTime.from(s, { offset: 'prefer' }).toString(),
    )
    rec(`parse:PlainDate:${s}`, () => T.PlainDate.from(s).toString())
    rec(`parse:PlainDateTime:${s}`, () => T.PlainDateTime.from(s).toString())
  }

  // 3. Civil dates: arithmetic, weeks, epoch-day counts (D-10), across a wide range.
  const base = T.PlainDate.from('1999-12-25')
  for (let i = 0; i < 400; i++) {
    const d = base.add({ days: i * 23 })
    const k = d.toString()
    rec(`date:${k}`, () => [
      d.dayOfWeek,
      d.dayOfYear,
      d.weekOfYear,
      d.yearOfWeek,
      d.daysInMonth,
      d.inLeapYear,
    ])
    rec(`dateAddM:${k}`, () => [
      d.add({ months: 1 }).toString(),
      d.add({ months: 1 }, { overflow: 'constrain' }).toString(),
      d.subtract({ years: 1 }).toString(),
    ])
    rec(`dateUntil:${k}`, () => [
      base.until(d, { largestUnit: 'years' }).toString(),
      base.until(d).days,
      d.since(base, { largestUnit: 'months' }).toString(),
    ])
    rec(`dateZdt:${k}`, () =>
      ZONES.map((z) => d.toZonedDateTime(z).epochMilliseconds),
    )
  }
  rec('dateAddMreject', () =>
    T.PlainDate.from('2026-01-31')
      .add({ months: 1 }, { overflow: 'reject' })
      .toString(),
  )

  // 4. Calendar systems (D-77): fields and arithmetic in each tested calendar.
  for (const cal of CALENDARS) {
    for (let i = 0; i < 160; i++) {
      const iso = T.PlainDate.from('2018-01-01').add({ days: i * 29 + (i % 7) })
      const d = iso.withCalendar(cal)
      const k = `${cal}:${iso}`
      rec(`cal:${k}`, () => [
        d.year,
        d.month,
        d.monthCode,
        d.day,
        d.era,
        d.eraYear,
        d.daysInMonth,
        d.monthsInYear,
        d.inLeapYear,
        d.daysInYear,
      ])
      rec(`calAdd:${k}`, () => [
        d.add({ months: 1 }).toString(),
        d.add({ years: 1 }).toString(),
        d.with({ day: 1 }).toString(),
      ])
      rec(`calStartOfMonth:${k}`, () =>
        d.with({ day: 1 }).withCalendar('iso8601').toString(),
      )
      rec(`calUntil:${k}`, () =>
        d
          .until(d.add({ months: 3, days: 5 }), { largestUnit: 'months' })
          .toString(),
      )
      rec(`calFrom:${k}`, () =>
        T.PlainDate.from({
          calendar: cal,
          year: d.year,
          monthCode: d.monthCode,
          day: d.day,
        }).toString(),
      )
    }
  }

  // 5. Instant ordering, durations and the epoch accessors used for any numeric fast path.
  const instants = []
  for (let i = 0; i < 200; i++)
    instants.push(
      T.Instant.fromEpochMilliseconds(
        1767225600000 + ((i * 7919) % 200) * 3600_000 + i,
      ),
    )
  rec('sortCompare', () =>
    [...instants].sort(T.Instant.compare).map((x) => x.epochMilliseconds),
  )
  rec('epochNs', () =>
    instants.slice(0, 20).map((x) => x.epochNanoseconds.toString()),
  )
  rec('durCompare', () =>
    T.Duration.compare(
      { hours: 25 },
      { days: 1 },
      {
        relativeTo: T.ZonedDateTime.from('2026-11-01T00:00[America/New_York]'),
      },
    ),
  )
  rec('durTotal', () =>
    T.Duration.from({ days: 1 }).total({
      unit: 'hours',
      relativeTo: T.ZonedDateTime.from('2026-03-08T00:00[America/New_York]'),
    }),
  )
  rec('durRound', () =>
    T.Duration.from({ minutes: 1000 })
      .round({
        largestUnit: 'hours',
        smallestUnit: 'minutes',
        roundingIncrement: 15,
      })
      .toString(),
  )

  // 6. Formatting through Temporal's toLocaleString (same engine, same ICU, so strings must match).
  const fz = T.ZonedDateTime.from('2026-11-01T01:30-05:00[America/New_York]')
  for (const loc of LOCALES) {
    rec(`fmt:zdt:${loc}`, () =>
      fz.toLocaleString(loc, { dateStyle: 'full', timeStyle: 'long' }),
    )
    rec(`fmt:date:${loc}`, () =>
      fz
        .toPlainDate()
        .toLocaleString(loc, {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        }),
    )
    rec(`fmt:time:${loc}`, () =>
      fz
        .toPlainTime()
        .toLocaleString(loc, { hour: 'numeric', minute: '2-digit' }),
    )
    rec(`fmt:instant:${loc}`, () =>
      fz
        .toInstant()
        .toLocaleString(loc, { timeZone: 'Asia/Tokyo', timeZoneName: 'short' }),
    )
  }

  return out
}

// The time-semantics worked examples, as explicit expectations (not a comparison).
export function workedExamples(T) {
  const ny = 'America/New_York'
  const tok = T.PlainDate.from('2026-10-26')
  const cases = [
    [
      'Tokyo OOO start in NY',
      () =>
        tok
          .toZonedDateTime('Asia/Tokyo')
          .withTimeZone(ny)
          .toPlainDateTime()
          .toString(),
      '2026-10-25T11:00:00',
    ],
    [
      'Tokyo OOO end in NY',
      () =>
        tok
          .add({ days: 1 })
          .toZonedDateTime('Asia/Tokyo')
          .withTimeZone(ny)
          .toPlainDateTime()
          .toString(),
      '2026-10-26T11:00:00',
    ],
    [
      'Zone-less meeting in LA',
      () =>
        T.PlainDateTime.from('2026-10-26T09:00')
          .toZonedDateTime('America/Los_Angeles')
          .toString(),
      '2026-10-26T09:00:00-07:00[America/Los_Angeles]',
    ],
    [
      'Spring-forward gap (T-10)',
      () =>
        T.PlainDateTime.from('2026-03-08T02:30')
          .toZonedDateTime(ny)
          .toPlainTime()
          .toString(),
      '03:30:00',
    ],
    [
      'Fall-back earlier (T-10)',
      () => T.PlainDateTime.from('2026-11-01T01:30').toZonedDateTime(ny).offset,
      '-04:00',
    ],
    [
      'Fall-back both on 01:30 row (T-14)',
      () =>
        ['2026-11-01T01:30-04:00', '2026-11-01T01:30-05:00']
          .map((s) =>
            T.Instant.from(s).toZonedDateTimeISO(ny).toPlainTime().toString(),
          )
          .join(' '),
      '01:30:00 01:30:00',
    ],
    [
      'Spring-forward day is 23h',
      () => T.PlainDate.from('2026-03-08').toZonedDateTime(ny).hoursInDay,
      23,
    ],
    [
      'Fall-back day is 25h',
      () => T.PlainDate.from('2026-11-01').toZonedDateTime(ny).hoursInDay,
      25,
    ],
    [
      'Drop on all-day row (T-12)',
      () =>
        T.Instant.from('2026-10-26T01:00Z')
          .toZonedDateTimeISO(ny)
          .toPlainDate()
          .toString(),
      '2026-10-25',
    ],
    [
      'Lord Howe 30-min DST',
      () =>
        T.PlainDate.from('2026-10-04').toZonedDateTime('Australia/Lord_Howe')
          .hoursInDay,
      23.5,
    ],
  ]
  return cases.map(([name, fn, want]) => {
    let got
    try {
      got = fn()
    } catch (e) {
      got = `throws:${e.name}`
    }
    return { name, got, want, ok: got === want }
  })
}
