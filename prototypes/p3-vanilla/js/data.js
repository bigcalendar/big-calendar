// Fixture data. Display zone: America/New_York. "Today" is fixed so every
// screen-reader run sees the same calendar.
export const TODAY = '2026-10-28'
export const SLOT_MINUTES = 30

// DST days in the display zone (T-14). Spring forward skips 2:00-3:00;
// fall back repeats 1:00-2:00.
export const DST = {
  '2026-03-08': { kind: 'gap', from: 120, to: 180 },
  '2026-11-01': {
    kind: 'repeat',
    from: 60,
    to: 120,
    first: 'EDT',
    second: 'EST',
  },
}

// Events. All-day events use `end` as an exclusive date (T-3).
// Timed events use wall-clock minutes; `endDate` marks multi-day timed events.
export const EVENTS = [
  {
    id: 'conf',
    title: 'Accessibility conference',
    start: '2026-10-27',
    end: '2026-10-30',
    allDay: true,
  },
  {
    id: 'ooo',
    title: 'Out of office',
    start: '2026-10-23',
    end: '2026-10-24',
    allDay: true,
  },
  {
    id: 'standup',
    title: 'Standup',
    start: '2026-10-28',
    startMin: 540,
    endMin: 555,
    recurring: true,
  },
  {
    id: 'review',
    title: 'Design review',
    start: '2026-10-28',
    startMin: 600,
    endMin: 690,
    resources: ['Room A'],
  },
  {
    id: 'lunch',
    title: 'Lunch with Sam',
    start: '2026-10-28',
    startMin: 720,
    endMin: 780,
  },
  {
    id: 'oneone',
    title: 'One-on-one',
    start: '2026-10-28',
    startMin: 840,
    endMin: 870,
  },
  {
    id: 'planning',
    title: 'Sprint planning',
    start: '2026-10-28',
    startMin: 900,
    endMin: 960,
    tentative: true,
  },
  {
    id: 'retro',
    title: 'Retro',
    start: '2026-10-28',
    startMin: 960,
    endMin: 1020,
  },
  {
    id: 'shift',
    title: 'Overnight shift',
    start: '2026-10-29',
    startMin: 1320,
    endDate: '2026-10-30',
    endMin: 360,
  },
  {
    id: 'allhands',
    title: 'Company all-hands',
    start: '2026-10-30',
    startMin: 780,
    endMin: 840,
    readOnly: true,
  },
  {
    id: 'dentist',
    title: 'Dentist',
    start: '2026-10-26',
    startMin: 600,
    endMin: 660,
    tooltip: 'Bring the insurance card',
  },
  {
    id: 'handover',
    title: 'Shift handover',
    start: '2026-11-01',
    startMin: 90,
    endMin: 120,
    offset: 'EDT',
  },
  {
    id: 'patch',
    title: 'Server patch',
    start: '2026-11-01',
    startMin: 90,
    endMin: 150,
    offset: 'EST',
  },
  {
    id: 'run',
    title: 'Early run',
    start: '2026-03-08',
    startMin: 210,
    endMin: 270,
  },
  {
    id: 'holiday',
    title: 'Christmas Day',
    start: '2026-12-25',
    end: '2026-12-26',
    allDay: true,
  },
]

// Background events (D-39): inert, described on the slots they cover.
export const BACKGROUND = [
  {
    id: 'offsite',
    title: 'Team offsite',
    start: '2026-10-30',
    startMin: 540,
    endMin: 720,
  },
]

// A live constraint (D-76): nothing may be moved or created on a weekend.
export function validate({ date }) {
  const day = new Date(date + 'T00:00:00Z').getUTCDay()
  return day === 0 || day === 6 ? 'on a weekend' : null
}
