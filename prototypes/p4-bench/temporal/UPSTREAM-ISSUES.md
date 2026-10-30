# Draft issues for fullcalendar/temporal-polyfill

For the maintainer to review and post at https://github.com/fullcalendar/temporal-polyfill/issues. Found by the P4 correctness corpus (`corpus.js`); reproduced in `repro.mjs`.

---

## 1. `ZonedDateTime#withPlainTime()` keeps the receiver's offset in a repeated hour instead of using `'compatible'`

**Version:** temporal-polyfill 1.0.6 (`temporal-polyfill/full/implementation`).

When the new wall-clock time falls in a repeated (fall-back) hour, `withPlainTime()` returns the occurrence that matches the receiver's current offset. The spec resolves it with `GetEpochNanosecondsFor(timeZone, resultISODateTime, compatible)`, which takes the earlier occurrence regardless of the receiver.

```js
import { Temporal } from 'temporal-polyfill/full/implementation'

const z = Temporal.ZonedDateTime.from(
  '2026-11-01T01:30:00-05:00[America/New_York]',
) // second 01:30 (EST)
z.withPlainTime('01:15').toString()
// polyfill: '2026-11-01T01:15:00-05:00[America/New_York]'
// native (Chrome 156, Firefox 157, Safari/WebKit 27.2): '2026-11-01T01:15:00-04:00[America/New_York]'
```

`PlainDateTime#toZonedDateTime(zone, { disambiguation: 'compatible' })` gives the correct result, so the difference seems specific to `withPlainTime`. Our corpus, which sets 02:30, found it in every zone whose repeated hour contains 02:30 (Europe/Berlin, Australia/Sydney, Australia/Adelaide, Pacific/Auckland, Africa/Casablanca); the example above shows the same thing in America/New_York at 01:15.

---

## 2. Short DST suspensions are missed (Africa/Casablanca 2012–2021, Africa/Cairo 2010 and 2014)

**Version:** temporal-polyfill 1.0.6.

Offsets and transitions during short, month-long changes are wrong, although the host's `Intl` data has them. Example, Morocco's Ramadan suspension in 2019 (+01:00 to +00:00 from May 5 to June 9):

```js
import { Temporal } from 'temporal-polyfill/full/implementation'

Temporal.ZonedDateTime.from('2019-05-20T12:00[Africa/Casablanca]').offset
// polyfill: '+01:00'; native: '+00:00'

Temporal.ZonedDateTime.from('2019-04-01T00:00[Africa/Casablanca]')
  .getTimeZoneTransition('next')
  ?.toString()
// polyfill: '2022-03-27T02:00:00+00:00[Africa/Casablanca]'
// native:   '2019-05-05T02:00:00+00:00[Africa/Casablanca]'

new Intl.DateTimeFormat('en', {
  timeZone: 'Africa/Casablanca',
  timeZoneName: 'longOffset',
}).format(Date.UTC(2019, 4, 20, 12))
// '5/20/2019, GMT+00:00' (the host data is correct; Node 24.15, ICU 78.2, tz 2026a)
```

Missed transitions, compared with native Temporal: Casablanca 2012-07-20/08-20, 2018-05-13/06-17, 2019-05-05/06-09, 2020-04-19/05-31, 2021-04-11/05-16; Cairo 2010-08-10/09-10, 2014-05-16/06-26. Casablanca from 2022 on is correct. Our guess is that the transition search samples too coarsely to find a pair of transitions a few weeks apart within one year.
