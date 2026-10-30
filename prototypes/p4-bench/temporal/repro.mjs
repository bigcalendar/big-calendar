// Minimal reproductions of the two temporal-polyfill findings, for the upstream issues.
import { Temporal } from 'temporal-polyfill/full/implementation'

// 1. withPlainTime() in a repeated hour should use 'compatible' (the earlier offset).
const after = Temporal.ZonedDateTime.from(
  '2026-11-01T01:30:00-05:00[America/New_York]',
) // second 01:30 (EST)
console.log(
  'withPlainTime 01:15 from the EST receiver:',
  after.withPlainTime('01:15').toString(),
)
console.log(
  'expected (compatible = earlier):          ',
  Temporal.PlainDateTime.from('2026-11-01T01:15')
    .toZonedDateTime('America/New_York', { disambiguation: 'compatible' })
    .toString(),
)

// 2. Short DST suspensions are missed: Morocco, Ramadan 2019 (+01:00 suspended to +00:00, May 5 – June 9).
const z = Temporal.ZonedDateTime.from('2019-05-20T12:00[Africa/Casablanca]')
console.log('Casablanca 2019-05-20 offset:', z.offset, '(expected +00:00)')
const t = Temporal.ZonedDateTime.from(
  '2019-04-01T00:00[Africa/Casablanca]',
).getTimeZoneTransition('next')
console.log(
  'next transition after 2019-04-01:',
  t?.toString(),
  '(expected 2019-05-05T02:00:00+00:00)',
)
