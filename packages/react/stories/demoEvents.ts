/**
 * Extended demo event shape used across all stories.
 *
 * `resourceId` is optional — plain-grid calendars ignore it; resource calendars
 * route events to the matching room via the default `resource` accessor
 * (`event.resourceId`). Room IDs match the `rooms` roster in
 * TimeGridView.stories.tsx.
 */
export interface DemoEvent {
  id: number
  title: string
  start: string
  end: string
  allDay?: boolean
  /** Room ID. Matches the `rooms` array in TimeGridView.stories.tsx. */
  resourceId?: string
  /** Present and `true` on ~2/3 of events; absent on the remaining third (= not draggable). */
  draggable?: boolean
  /** Present and `true` on ~2/3 of events; absent on the remaining third (= not resizable). */
  resizable?: boolean
}

/**
 * Demo events centred on the Storybook focus date (2026-06-15, a Monday).
 * Covers April–July 2026 as the main body, plus two DST-boundary weeks and
 * overlapping-timeslot clusters.
 *
 * DST weeks (navigate to these to validate timezone rendering):
 *   • Week of Mar 9 2026 — US spring forward was Mar 8 (02:00 EST → 03:00 EDT)
 *   • Week of Nov 2 2026 — US fall back was Nov 1 (02:00 EDT → 01:00 EST)
 *   Switch the Storybook timezone global to "America/New_York" to see DST effects.
 *
 * Overlapping-timeslot clusters are on Jun 15–18 (focus week). Navigate to
 * any of those days in the Day view to see the side-by-side overlap layout.
 *
 * Events with a `resourceId` route to a specific room in resource views.
 * Events without one appear in plain-grid, month, and agenda views only.
 */
const _base: DemoEvent[] = [
  // ── April all-day blocks ────────────────────────────────────────────────────
  { id: 1, title: 'Q2 Planning Kickoff', allDay: true, start: '2026-04-01T00:00:00.000Z', end: '2026-04-03T00:00:00.000Z' },

  // ── Week of Apr 6 (Mon–Fri) ─────────────────────────────────────────────────
  { id: 2,  title: 'Standup',              start: '2026-04-06T09:30:00.000Z', end: '2026-04-06T09:45:00.000Z', resourceId: 'mtg3' },
  { id: 3,  title: 'Team sync',            start: '2026-04-06T10:00:00.000Z', end: '2026-04-06T11:00:00.000Z', resourceId: 'board' },
  { id: 4,  title: 'Sprint 18 planning',   start: '2026-04-06T13:00:00.000Z', end: '2026-04-06T16:00:00.000Z', resourceId: 'board' },
  { id: 5,  title: 'Standup',              start: '2026-04-07T09:30:00.000Z', end: '2026-04-07T09:45:00.000Z', resourceId: 'mtg3' },
  { id: 6,  title: 'Product roadmap review', start: '2026-04-07T14:00:00.000Z', end: '2026-04-07T15:30:00.000Z', resourceId: 'exec' },
  { id: 7,  title: 'Standup',              start: '2026-04-08T09:30:00.000Z', end: '2026-04-08T09:45:00.000Z', resourceId: 'mtg3' },
  { id: 8,  title: '1:1 with Morgan',      start: '2026-04-08T14:00:00.000Z', end: '2026-04-08T14:30:00.000Z', resourceId: 'mtg1' },
  { id: 9,  title: 'Standup',              start: '2026-04-09T09:30:00.000Z', end: '2026-04-09T09:45:00.000Z', resourceId: 'mtg3' },
  { id: 10, title: 'Design review',        start: '2026-04-09T11:00:00.000Z', end: '2026-04-09T12:30:00.000Z', resourceId: 'training' },
  { id: 11, title: 'Standup',              start: '2026-04-10T09:30:00.000Z', end: '2026-04-10T09:45:00.000Z', resourceId: 'mtg3' },
  { id: 12, title: 'Sprint 18 demo',       start: '2026-04-10T15:00:00.000Z', end: '2026-04-10T16:00:00.000Z', resourceId: 'annex' },

  // ── Week of Apr 13 ──────────────────────────────────────────────────────────
  { id: 13, title: 'Standup',              start: '2026-04-13T09:30:00.000Z', end: '2026-04-13T09:45:00.000Z', resourceId: 'mtg3' },
  { id: 14, title: 'Team sync',            start: '2026-04-13T10:00:00.000Z', end: '2026-04-13T11:00:00.000Z', resourceId: 'board' },
  { id: 15, title: 'Standup',              start: '2026-04-14T09:30:00.000Z', end: '2026-04-14T09:45:00.000Z', resourceId: 'mtg3' },
  { id: 16, title: 'Vendor onboarding',    start: '2026-04-14T11:00:00.000Z', end: '2026-04-14T12:00:00.000Z', resourceId: 'mtg2' },
  { id: 17, title: 'Standup',              start: '2026-04-15T09:30:00.000Z', end: '2026-04-15T09:45:00.000Z', resourceId: 'mtg3' },
  { id: 18, title: '1:1 with Morgan',      start: '2026-04-15T14:00:00.000Z', end: '2026-04-15T14:30:00.000Z', resourceId: 'mtg1' },
  { id: 19, title: 'Standup',              start: '2026-04-16T09:30:00.000Z', end: '2026-04-16T09:45:00.000Z', resourceId: 'mtg3' },
  { id: 20, title: 'Architecture review',  start: '2026-04-16T13:00:00.000Z', end: '2026-04-16T14:30:00.000Z', resourceId: 'training' },
  { id: 21, title: 'Standup',              start: '2026-04-17T09:30:00.000Z', end: '2026-04-17T09:45:00.000Z', resourceId: 'mtg3' },
  { id: 22, title: 'Sprint 18 retro',      start: '2026-04-17T14:00:00.000Z', end: '2026-04-17T15:00:00.000Z', resourceId: 'mtg4' },

  // ── Week of Apr 20 ──────────────────────────────────────────────────────────
  { id: 23, title: 'Standup',              start: '2026-04-20T09:30:00.000Z', end: '2026-04-20T09:45:00.000Z', resourceId: 'mtg3' },
  { id: 24, title: 'Team sync',            start: '2026-04-20T10:00:00.000Z', end: '2026-04-20T11:00:00.000Z', resourceId: 'board' },
  { id: 25, title: 'Sprint 19 planning',   start: '2026-04-20T13:00:00.000Z', end: '2026-04-20T16:00:00.000Z', resourceId: 'board' },
  { id: 26, title: 'Standup',              start: '2026-04-21T09:30:00.000Z', end: '2026-04-21T09:45:00.000Z', resourceId: 'mtg3' },
  { id: 27, title: 'UX walkthrough',       start: '2026-04-21T10:00:00.000Z', end: '2026-04-21T11:30:00.000Z', resourceId: 'training' },
  { id: 28, title: 'Standup',              start: '2026-04-22T09:30:00.000Z', end: '2026-04-22T09:45:00.000Z', resourceId: 'mtg3' },
  { id: 29, title: '1:1 with Morgan',      start: '2026-04-22T14:00:00.000Z', end: '2026-04-22T14:30:00.000Z', resourceId: 'mtg1' },
  { id: 30, title: 'Standup',              start: '2026-04-23T09:30:00.000Z', end: '2026-04-23T09:45:00.000Z', resourceId: 'mtg3' },
  { id: 31, title: 'Design review',        start: '2026-04-23T11:00:00.000Z', end: '2026-04-23T12:30:00.000Z', resourceId: 'training' },
  { id: 32, title: 'Standup',              start: '2026-04-24T09:30:00.000Z', end: '2026-04-24T09:45:00.000Z', resourceId: 'mtg3' },

  // ── Week of Apr 27 ──────────────────────────────────────────────────────────
  { id: 33, title: 'Standup',              start: '2026-04-27T09:30:00.000Z', end: '2026-04-27T09:45:00.000Z', resourceId: 'mtg3' },
  { id: 34, title: 'Team sync',            start: '2026-04-27T10:00:00.000Z', end: '2026-04-27T11:00:00.000Z', resourceId: 'board' },
  { id: 35, title: 'April all-hands',      start: '2026-04-27T16:00:00.000Z', end: '2026-04-27T17:30:00.000Z', resourceId: 'annex' },
  { id: 36, title: 'Standup',              start: '2026-04-28T09:30:00.000Z', end: '2026-04-28T09:45:00.000Z', resourceId: 'mtg3' },
  { id: 37, title: 'Customer interview',   start: '2026-04-28T13:00:00.000Z', end: '2026-04-28T14:00:00.000Z', resourceId: 'exec' },
  { id: 38, title: 'Standup',              start: '2026-04-29T09:30:00.000Z', end: '2026-04-29T09:45:00.000Z', resourceId: 'mtg3' },
  { id: 39, title: '1:1 with Morgan',      start: '2026-04-29T14:00:00.000Z', end: '2026-04-29T14:30:00.000Z', resourceId: 'mtg1' },
  { id: 40, title: 'Standup',              start: '2026-04-30T09:30:00.000Z', end: '2026-04-30T09:45:00.000Z', resourceId: 'mtg3' },

  // ── May 1 (Fri) ─────────────────────────────────────────────────────────────
  { id: 41, title: 'Standup',              start: '2026-05-01T09:30:00.000Z', end: '2026-05-01T09:45:00.000Z', resourceId: 'mtg3' },
  { id: 42, title: 'Sprint 19 retro',      start: '2026-05-01T14:00:00.000Z', end: '2026-05-01T15:30:00.000Z', resourceId: 'training' },

  // ── Week of May 4 ───────────────────────────────────────────────────────────
  { id: 43, title: 'Standup',              start: '2026-05-04T09:30:00.000Z', end: '2026-05-04T09:45:00.000Z', resourceId: 'mtg3' },
  { id: 44, title: 'Team sync',            start: '2026-05-04T10:00:00.000Z', end: '2026-05-04T11:00:00.000Z', resourceId: 'board' },
  { id: 45, title: 'Sprint 20 planning',   start: '2026-05-04T13:00:00.000Z', end: '2026-05-04T16:00:00.000Z', resourceId: 'board' },
  { id: 46, title: 'Standup',              start: '2026-05-05T09:30:00.000Z', end: '2026-05-05T09:45:00.000Z', resourceId: 'mtg3' },
  { id: 47, title: 'Security audit kickoff', start: '2026-05-05T10:00:00.000Z', end: '2026-05-05T12:00:00.000Z', resourceId: 'exec' },
  { id: 48, title: 'Standup',              start: '2026-05-06T09:30:00.000Z', end: '2026-05-06T09:45:00.000Z', resourceId: 'mtg3' },
  { id: 49, title: '1:1 with Morgan',      start: '2026-05-06T14:00:00.000Z', end: '2026-05-06T14:30:00.000Z', resourceId: 'mtg1' },
  { id: 50, title: 'Standup',              start: '2026-05-07T09:30:00.000Z', end: '2026-05-07T09:45:00.000Z', resourceId: 'mtg3' },
  { id: 51, title: 'Design review',        start: '2026-05-07T11:00:00.000Z', end: '2026-05-07T12:30:00.000Z', resourceId: 'training' },
  { id: 52, title: 'Standup',              start: '2026-05-08T09:30:00.000Z', end: '2026-05-08T09:45:00.000Z', resourceId: 'mtg3' },
  { id: 53, title: 'Lunch & learn: GraphQL', start: '2026-05-08T12:00:00.000Z', end: '2026-05-08T13:00:00.000Z', resourceId: 'lab' },

  // ── Week of May 11 ──────────────────────────────────────────────────────────
  { id: 54, title: 'Standup',              start: '2026-05-11T09:30:00.000Z', end: '2026-05-11T09:45:00.000Z', resourceId: 'mtg3' },
  { id: 55, title: 'Team sync',            start: '2026-05-11T10:00:00.000Z', end: '2026-05-11T11:00:00.000Z', resourceId: 'board' },
  { id: 56, title: 'Standup',              start: '2026-05-12T09:30:00.000Z', end: '2026-05-12T09:45:00.000Z', resourceId: 'mtg3' },
  { id: 57, title: 'Analytics quarterly review', start: '2026-05-12T14:00:00.000Z', end: '2026-05-12T15:30:00.000Z', resourceId: 'exec' },
  { id: 58, title: 'Standup',              start: '2026-05-13T09:30:00.000Z', end: '2026-05-13T09:45:00.000Z', resourceId: 'mtg3' },
  { id: 59, title: '1:1 with Morgan',      start: '2026-05-13T14:00:00.000Z', end: '2026-05-13T14:30:00.000Z', resourceId: 'mtg1' },
  { id: 60, title: 'Standup',              start: '2026-05-14T09:30:00.000Z', end: '2026-05-14T09:45:00.000Z', resourceId: 'mtg3' },
  { id: 61, title: 'Vendor eval: Datadog', start: '2026-05-14T13:00:00.000Z', end: '2026-05-14T14:00:00.000Z', resourceId: 'mtg2' },
  { id: 62, title: 'Standup',              start: '2026-05-15T09:30:00.000Z', end: '2026-05-15T09:45:00.000Z', resourceId: 'mtg3' },
  { id: 63, title: 'Recording session',    start: '2026-05-15T15:00:00.000Z', end: '2026-05-15T17:00:00.000Z', resourceId: 'studio' },

  // ── Week of May 18 ──────────────────────────────────────────────────────────
  { id: 64, title: 'Standup',              start: '2026-05-18T09:30:00.000Z', end: '2026-05-18T09:45:00.000Z', resourceId: 'mtg3' },
  { id: 65, title: 'Team sync',            start: '2026-05-18T10:00:00.000Z', end: '2026-05-18T11:00:00.000Z', resourceId: 'board' },
  { id: 66, title: 'Standup',              start: '2026-05-19T09:30:00.000Z', end: '2026-05-19T09:45:00.000Z', resourceId: 'mtg3' },
  { id: 67, title: 'Sprint 20 demo',       start: '2026-05-19T15:00:00.000Z', end: '2026-05-19T16:00:00.000Z', resourceId: 'annex' },
  { id: 68, title: 'Standup',              start: '2026-05-20T09:30:00.000Z', end: '2026-05-20T09:45:00.000Z', resourceId: 'mtg3' },
  { id: 69, title: '1:1 with Morgan',      start: '2026-05-20T14:00:00.000Z', end: '2026-05-20T14:30:00.000Z', resourceId: 'mtg1' },
  { id: 70, title: 'Standup',              start: '2026-05-21T09:30:00.000Z', end: '2026-05-21T09:45:00.000Z', resourceId: 'mtg3' },
  { id: 71, title: 'Design review',        start: '2026-05-21T11:00:00.000Z', end: '2026-05-21T12:30:00.000Z', resourceId: 'training' },
  { id: 72, title: 'Standup',              start: '2026-05-22T09:30:00.000Z', end: '2026-05-22T09:45:00.000Z', resourceId: 'mtg3' },
  { id: 73, title: 'Sprint 20 retro',      start: '2026-05-22T14:00:00.000Z', end: '2026-05-22T15:30:00.000Z', resourceId: 'training' },

  // ── Week of May 25 (Memorial Day = Mon May 25) ──────────────────────────────
  { id: 74, title: 'Memorial Day', allDay: true, start: '2026-05-25T00:00:00.000Z', end: '2026-05-26T00:00:00.000Z' },
  { id: 75, title: 'Standup',              start: '2026-05-26T09:30:00.000Z', end: '2026-05-26T09:45:00.000Z', resourceId: 'mtg3' },
  { id: 76, title: 'Standup',              start: '2026-05-27T09:30:00.000Z', end: '2026-05-27T09:45:00.000Z', resourceId: 'mtg3' },
  { id: 77, title: '1:1 with Morgan',      start: '2026-05-27T14:00:00.000Z', end: '2026-05-27T14:30:00.000Z', resourceId: 'mtg1' },
  { id: 78, title: 'Standup',              start: '2026-05-28T09:30:00.000Z', end: '2026-05-28T09:45:00.000Z', resourceId: 'mtg3' },
  { id: 79, title: 'Sprint 21 planning',   start: '2026-05-28T13:00:00.000Z', end: '2026-05-28T16:00:00.000Z', resourceId: 'board' },
  { id: 80, title: 'Standup',              start: '2026-05-29T09:30:00.000Z', end: '2026-05-29T09:45:00.000Z', resourceId: 'mtg3' },
  { id: 81, title: 'May all-hands',        start: '2026-05-29T16:00:00.000Z', end: '2026-05-29T17:30:00.000Z', resourceId: 'annex' },

  // ── Week of Jun 1 ───────────────────────────────────────────────────────────
  { id: 82, title: 'Standup',              start: '2026-06-01T09:30:00.000Z', end: '2026-06-01T09:45:00.000Z', resourceId: 'mtg3' },
  { id: 83, title: 'Team sync',            start: '2026-06-01T10:00:00.000Z', end: '2026-06-01T11:00:00.000Z', resourceId: 'board' },
  { id: 84, title: 'Standup',              start: '2026-06-02T09:30:00.000Z', end: '2026-06-02T09:45:00.000Z', resourceId: 'mtg3' },
  { id: 85, title: 'Infrastructure review', start: '2026-06-02T11:00:00.000Z', end: '2026-06-02T12:00:00.000Z', resourceId: 'exec' },
  { id: 86, title: 'Standup',              start: '2026-06-03T09:30:00.000Z', end: '2026-06-03T09:45:00.000Z', resourceId: 'mtg3' },
  { id: 87, title: '1:1 with Morgan',      start: '2026-06-03T14:00:00.000Z', end: '2026-06-03T14:30:00.000Z', resourceId: 'mtg1' },
  { id: 88, title: 'Standup',              start: '2026-06-04T09:30:00.000Z', end: '2026-06-04T09:45:00.000Z', resourceId: 'mtg3' },
  { id: 89, title: 'Design review',        start: '2026-06-04T11:00:00.000Z', end: '2026-06-04T12:30:00.000Z', resourceId: 'training' },
  { id: 90, title: 'Standup',              start: '2026-06-05T09:30:00.000Z', end: '2026-06-05T09:45:00.000Z', resourceId: 'mtg3' },
  { id: 91, title: 'Hiring debrief',       start: '2026-06-05T14:00:00.000Z', end: '2026-06-05T15:00:00.000Z', resourceId: 'mtg4' },

  // ── Week of Jun 8 (team off-site Jun 8–10) ──────────────────────────────────
  { id: 92, title: 'Team off-site', allDay: true, start: '2026-06-08T00:00:00.000Z', end: '2026-06-11T00:00:00.000Z' },
  { id: 93, title: 'Standup',              start: '2026-06-11T09:30:00.000Z', end: '2026-06-11T09:45:00.000Z', resourceId: 'mtg3' },
  { id: 94, title: 'Post off-site sync',   start: '2026-06-11T10:00:00.000Z', end: '2026-06-11T11:00:00.000Z', resourceId: 'board' },
  { id: 95, title: 'Standup',              start: '2026-06-12T09:30:00.000Z', end: '2026-06-12T09:45:00.000Z', resourceId: 'mtg3' },
  { id: 96, title: 'Off-site debrief',     start: '2026-06-12T14:00:00.000Z', end: '2026-06-12T15:00:00.000Z', resourceId: 'training' },

  // ── Focus week: Jun 15–19 ───────────────────────────────────────────────────
  { id: 97,  title: 'Maintenance window', allDay: true, start: '2026-06-15T00:00:00.000Z', end: '2026-06-16T00:00:00.000Z', resourceId: 'board' },
  { id: 98,  title: 'Hack day',           allDay: true, start: '2026-06-15T00:00:00.000Z', end: '2026-06-16T00:00:00.000Z', resourceId: 'lab' },
  { id: 99,  title: 'Standup',              start: '2026-06-15T09:30:00.000Z', end: '2026-06-15T09:45:00.000Z', resourceId: 'mtg3' },
  { id: 100, title: 'Team sync',            start: '2026-06-15T10:00:00.000Z', end: '2026-06-15T11:00:00.000Z', resourceId: 'board' },
  { id: 101, title: '1:1 with Jordan',      start: '2026-06-15T15:00:00.000Z', end: '2026-06-15T15:30:00.000Z', resourceId: 'mtg1' },
  { id: 102, title: 'Standup',              start: '2026-06-16T09:30:00.000Z', end: '2026-06-16T09:45:00.000Z', resourceId: 'mtg3' },
  { id: 103, title: 'New-hire orientation', start: '2026-06-16T10:00:00.000Z', end: '2026-06-16T12:00:00.000Z', resourceId: 'training' },
  { id: 104, title: 'Vendor call: AWS',     start: '2026-06-16T14:00:00.000Z', end: '2026-06-16T15:00:00.000Z', resourceId: 'mtg2' },
  { id: 105, title: 'Standup',              start: '2026-06-17T09:30:00.000Z', end: '2026-06-17T09:45:00.000Z', resourceId: 'mtg3' },
  { id: 106, title: '1:1 with Morgan',      start: '2026-06-17T14:00:00.000Z', end: '2026-06-17T14:30:00.000Z', resourceId: 'mtg1' },
  { id: 107, title: 'Mix session',          start: '2026-06-17T16:00:00.000Z', end: '2026-06-17T18:00:00.000Z', resourceId: 'studio' },
  { id: 108, title: 'Standup',              start: '2026-06-18T09:30:00.000Z', end: '2026-06-18T09:45:00.000Z', resourceId: 'mtg3' },
  { id: 109, title: 'Design review',        start: '2026-06-18T11:00:00.000Z', end: '2026-06-18T12:30:00.000Z', resourceId: 'training' },
  { id: 110, title: 'Roadmap planning',     start: '2026-06-18T14:00:00.000Z', end: '2026-06-18T15:30:00.000Z', resourceId: 'exec' },
  { id: 111, title: 'Standup',              start: '2026-06-19T09:30:00.000Z', end: '2026-06-19T09:45:00.000Z', resourceId: 'mtg3' },
  { id: 112, title: 'Sprint 21 demo',       start: '2026-06-19T15:00:00.000Z', end: '2026-06-19T16:00:00.000Z', resourceId: 'annex' },
  { id: 113, title: 'June all-hands',       start: '2026-06-19T16:30:00.000Z', end: '2026-06-19T18:00:00.000Z', resourceId: 'annex' },

  // ── Week of Jun 22 ──────────────────────────────────────────────────────────
  { id: 114, title: 'Standup',              start: '2026-06-22T09:30:00.000Z', end: '2026-06-22T09:45:00.000Z', resourceId: 'mtg3' },
  { id: 115, title: 'Team sync',            start: '2026-06-22T10:00:00.000Z', end: '2026-06-22T11:00:00.000Z', resourceId: 'board' },
  { id: 116, title: 'Standup',              start: '2026-06-23T09:30:00.000Z', end: '2026-06-23T09:45:00.000Z', resourceId: 'mtg3' },
  { id: 117, title: 'API design session',   start: '2026-06-23T11:00:00.000Z', end: '2026-06-23T13:00:00.000Z', resourceId: 'lab' },
  { id: 118, title: 'Standup',              start: '2026-06-24T09:30:00.000Z', end: '2026-06-24T09:45:00.000Z', resourceId: 'mtg3' },
  { id: 119, title: '1:1 with Morgan',      start: '2026-06-24T14:00:00.000Z', end: '2026-06-24T14:30:00.000Z', resourceId: 'mtg1' },
  { id: 120, title: 'Standup',              start: '2026-06-25T09:30:00.000Z', end: '2026-06-25T09:45:00.000Z', resourceId: 'mtg3' },
  { id: 121, title: 'Design review',        start: '2026-06-25T11:00:00.000Z', end: '2026-06-25T12:30:00.000Z', resourceId: 'training' },
  { id: 122, title: 'Standup',              start: '2026-06-26T09:30:00.000Z', end: '2026-06-26T09:45:00.000Z', resourceId: 'mtg3' },
  { id: 123, title: 'Sprint 21 retro',      start: '2026-06-26T14:00:00.000Z', end: '2026-06-26T15:30:00.000Z', resourceId: 'mtg4' },

  // ── Week of Jun 29 ──────────────────────────────────────────────────────────
  { id: 124, title: 'Standup',              start: '2026-06-29T09:30:00.000Z', end: '2026-06-29T09:45:00.000Z', resourceId: 'mtg3' },
  { id: 125, title: 'Team sync',            start: '2026-06-29T10:00:00.000Z', end: '2026-06-29T11:00:00.000Z', resourceId: 'board' },
  { id: 126, title: 'Sprint 22 planning',   start: '2026-06-29T13:00:00.000Z', end: '2026-06-29T16:00:00.000Z', resourceId: 'board' },
  { id: 127, title: 'Standup',              start: '2026-06-30T09:30:00.000Z', end: '2026-06-30T09:45:00.000Z', resourceId: 'mtg3' },
  { id: 128, title: 'Accessibility audit',  start: '2026-06-30T11:00:00.000Z', end: '2026-06-30T12:30:00.000Z', resourceId: 'exec' },

  // ── Week of Jul 1 (Wed–Fri) ─────────────────────────────────────────────────
  { id: 129, title: 'Standup',              start: '2026-07-01T09:30:00.000Z', end: '2026-07-01T09:45:00.000Z', resourceId: 'mtg3' },
  { id: 130, title: '1:1 with Morgan',      start: '2026-07-01T14:00:00.000Z', end: '2026-07-01T14:30:00.000Z', resourceId: 'mtg1' },
  { id: 131, title: 'Standup',              start: '2026-07-02T09:30:00.000Z', end: '2026-07-02T09:45:00.000Z', resourceId: 'mtg3' },
  { id: 132, title: 'Pre-holiday sync',     start: '2026-07-02T10:00:00.000Z', end: '2026-07-02T11:00:00.000Z', resourceId: 'board' },
  { id: 133, title: 'Independence Day', allDay: true, start: '2026-07-04T00:00:00.000Z', end: '2026-07-05T00:00:00.000Z' },

  // ── Week of Jul 6 ───────────────────────────────────────────────────────────
  { id: 134, title: 'Standup',              start: '2026-07-06T09:30:00.000Z', end: '2026-07-06T09:45:00.000Z', resourceId: 'mtg3' },
  { id: 135, title: 'Team sync',            start: '2026-07-06T10:00:00.000Z', end: '2026-07-06T11:00:00.000Z', resourceId: 'board' },
  { id: 136, title: 'Standup',              start: '2026-07-07T09:30:00.000Z', end: '2026-07-07T09:45:00.000Z', resourceId: 'mtg3' },
  { id: 137, title: 'Performance reviews',  start: '2026-07-07T14:00:00.000Z', end: '2026-07-07T16:00:00.000Z', resourceId: 'exec' },
  { id: 138, title: 'Standup',              start: '2026-07-08T09:30:00.000Z', end: '2026-07-08T09:45:00.000Z', resourceId: 'mtg3' },
  { id: 139, title: '1:1 with Morgan',      start: '2026-07-08T14:00:00.000Z', end: '2026-07-08T14:30:00.000Z', resourceId: 'mtg1' },
  { id: 140, title: 'Standup',              start: '2026-07-09T09:30:00.000Z', end: '2026-07-09T09:45:00.000Z', resourceId: 'mtg3' },
  { id: 141, title: 'Design review',        start: '2026-07-09T11:00:00.000Z', end: '2026-07-09T12:30:00.000Z', resourceId: 'training' },
  { id: 142, title: 'Standup',              start: '2026-07-10T09:30:00.000Z', end: '2026-07-10T09:45:00.000Z', resourceId: 'mtg3' },
  { id: 143, title: 'Hiring panel',         start: '2026-07-10T14:00:00.000Z', end: '2026-07-10T16:00:00.000Z', resourceId: 'mtg4' },

  // ── Week of Jul 13 (ReactConf Jul 14–16) ────────────────────────────────────
  { id: 144, title: 'Standup',              start: '2026-07-13T09:30:00.000Z', end: '2026-07-13T09:45:00.000Z', resourceId: 'mtg3' },
  { id: 145, title: 'Team sync',            start: '2026-07-13T10:00:00.000Z', end: '2026-07-13T11:00:00.000Z', resourceId: 'board' },
  { id: 146, title: 'ReactConf 2026', allDay: true, start: '2026-07-14T00:00:00.000Z', end: '2026-07-17T00:00:00.000Z' },
  { id: 147, title: 'Standup',              start: '2026-07-17T09:30:00.000Z', end: '2026-07-17T09:45:00.000Z', resourceId: 'mtg3' },
  { id: 148, title: 'Conference debrief',   start: '2026-07-17T14:00:00.000Z', end: '2026-07-17T15:30:00.000Z', resourceId: 'training' },

  // ── Week of Jul 20 ──────────────────────────────────────────────────────────
  { id: 149, title: 'Standup',              start: '2026-07-20T09:30:00.000Z', end: '2026-07-20T09:45:00.000Z', resourceId: 'mtg3' },
  { id: 150, title: 'Team sync',            start: '2026-07-20T10:00:00.000Z', end: '2026-07-20T11:00:00.000Z', resourceId: 'board' },
  { id: 151, title: 'Sprint 22 demo',       start: '2026-07-20T15:00:00.000Z', end: '2026-07-20T16:00:00.000Z', resourceId: 'annex' },
  { id: 152, title: 'Standup',              start: '2026-07-21T09:30:00.000Z', end: '2026-07-21T09:45:00.000Z', resourceId: 'mtg3' },
  { id: 153, title: 'Q3 business review',   start: '2026-07-21T14:00:00.000Z', end: '2026-07-21T16:00:00.000Z', resourceId: 'exec' },
  { id: 154, title: 'Standup',              start: '2026-07-22T09:30:00.000Z', end: '2026-07-22T09:45:00.000Z', resourceId: 'mtg3' },
  { id: 155, title: '1:1 with Morgan',      start: '2026-07-22T14:00:00.000Z', end: '2026-07-22T14:30:00.000Z', resourceId: 'mtg1' },
  { id: 156, title: 'Standup',              start: '2026-07-23T09:30:00.000Z', end: '2026-07-23T09:45:00.000Z', resourceId: 'mtg3' },
  { id: 157, title: 'Design review',        start: '2026-07-23T11:00:00.000Z', end: '2026-07-23T12:30:00.000Z', resourceId: 'training' },
  { id: 158, title: 'Standup',              start: '2026-07-24T09:30:00.000Z', end: '2026-07-24T09:45:00.000Z', resourceId: 'mtg3' },
  { id: 159, title: 'Sprint 22 retro',      start: '2026-07-24T14:00:00.000Z', end: '2026-07-24T15:30:00.000Z', resourceId: 'mtg4' },

  // ── Week of Jul 27 ──────────────────────────────────────────────────────────
  { id: 160, title: 'Standup',              start: '2026-07-27T09:30:00.000Z', end: '2026-07-27T09:45:00.000Z', resourceId: 'mtg3' },
  { id: 161, title: 'Team sync',            start: '2026-07-27T10:00:00.000Z', end: '2026-07-27T11:00:00.000Z', resourceId: 'board' },
  { id: 162, title: 'Sprint 23 planning',   start: '2026-07-27T13:00:00.000Z', end: '2026-07-27T16:00:00.000Z', resourceId: 'board' },
  { id: 163, title: 'Standup',              start: '2026-07-28T09:30:00.000Z', end: '2026-07-28T09:45:00.000Z', resourceId: 'mtg3' },
  { id: 164, title: 'Roadmap brainstorm',   start: '2026-07-28T10:00:00.000Z', end: '2026-07-28T12:00:00.000Z', resourceId: 'lab' },
  { id: 165, title: 'Standup',              start: '2026-07-29T09:30:00.000Z', end: '2026-07-29T09:45:00.000Z', resourceId: 'mtg3' },
  { id: 166, title: '1:1 with Morgan',      start: '2026-07-29T14:00:00.000Z', end: '2026-07-29T14:30:00.000Z', resourceId: 'mtg1' },
  { id: 167, title: 'Standup',              start: '2026-07-30T09:30:00.000Z', end: '2026-07-30T09:45:00.000Z', resourceId: 'mtg3' },
  { id: 168, title: 'Vendor review',        start: '2026-07-30T11:00:00.000Z', end: '2026-07-30T12:00:00.000Z', resourceId: 'mtg2' },
  { id: 169, title: 'Standup',              start: '2026-07-31T09:30:00.000Z', end: '2026-07-31T09:45:00.000Z', resourceId: 'mtg3' },
  { id: 170, title: 'July all-hands',       start: '2026-07-31T16:00:00.000Z', end: '2026-07-31T17:30:00.000Z', resourceId: 'annex' },

  // ── Overlapping timeslot clusters (focus week Jun 15–18) ────────────────────
  // Jun 15: three events compete for 09:30–11:30 alongside the existing standup + team sync
  { id: 171, title: 'Sync with design',     start: '2026-06-15T09:30:00.000Z', end: '2026-06-15T10:45:00.000Z' },
  { id: 172, title: 'Budget walkthrough',   start: '2026-06-15T10:00:00.000Z', end: '2026-06-15T11:30:00.000Z' },
  // Jun 16: overlap with new-hire orientation (10:00–12:00)
  { id: 173, title: 'Tech screening',       start: '2026-06-16T10:00:00.000Z', end: '2026-06-16T11:00:00.000Z' },
  { id: 174, title: 'Platform review',      start: '2026-06-16T10:30:00.000Z', end: '2026-06-16T12:30:00.000Z' },
  // Jun 17: three-way afternoon overlap around the 1:1 with Morgan (14:00–14:30)
  { id: 175, title: 'Code review',          start: '2026-06-17T14:00:00.000Z', end: '2026-06-17T15:00:00.000Z' },
  { id: 176, title: 'Release prep',         start: '2026-06-17T14:15:00.000Z', end: '2026-06-17T15:30:00.000Z' },
  // Jun 18: overlap with design review (11:00–12:30) and roadmap planning (14:00–15:30)
  { id: 177, title: 'Incident post-mortem', start: '2026-06-18T11:00:00.000Z', end: '2026-06-18T12:30:00.000Z' },
  { id: 178, title: 'Lunch Q&A',            start: '2026-06-18T11:30:00.000Z', end: '2026-06-18T13:00:00.000Z' },
  { id: 179, title: 'Product standup',      start: '2026-06-18T14:00:00.000Z', end: '2026-06-18T14:45:00.000Z' },

  // ── DST: US spring forward Mar 8 2026 (02:00 EST → 03:00 EDT at 07:00 UTC) ─
  // Multi-day spanning the transition weekend
  { id: 180, title: 'Q1 wrap-up',           allDay: true, start: '2026-03-06T00:00:00.000Z', end: '2026-03-09T00:00:00.000Z' },
  // Spans the 07:00 UTC spring-forward moment: 01:30 EST → 03:30 EDT in New York
  { id: 181, title: 'Early release window', start: '2026-03-08T06:30:00.000Z', end: '2026-03-08T08:30:00.000Z' },
  // Workweek Mar 9–13 (all times in EDT = UTC-4; 09:30 EDT = 13:30 UTC)
  { id: 182, title: 'Standup',              start: '2026-03-09T13:30:00.000Z', end: '2026-03-09T13:45:00.000Z', resourceId: 'mtg3' },
  { id: 183, title: 'Q1 results review',    start: '2026-03-09T14:00:00.000Z', end: '2026-03-09T15:30:00.000Z', resourceId: 'board' },
  { id: 184, title: 'Design sync',          start: '2026-03-09T14:00:00.000Z', end: '2026-03-09T15:00:00.000Z' },
  { id: 185, title: 'Standup',              start: '2026-03-10T13:30:00.000Z', end: '2026-03-10T13:45:00.000Z', resourceId: 'mtg3' },
  { id: 186, title: '1:1 with Morgan',      start: '2026-03-10T18:00:00.000Z', end: '2026-03-10T18:30:00.000Z', resourceId: 'mtg1' },
  { id: 187, title: 'Standup',              start: '2026-03-11T13:30:00.000Z', end: '2026-03-11T13:45:00.000Z', resourceId: 'mtg3' },
  { id: 188, title: 'Sprint 16 planning',   start: '2026-03-11T17:00:00.000Z', end: '2026-03-11T20:00:00.000Z', resourceId: 'board' },
  { id: 189, title: 'Vendor call',          start: '2026-03-11T17:00:00.000Z', end: '2026-03-11T18:00:00.000Z' },
  { id: 190, title: 'Standup',              start: '2026-03-12T13:30:00.000Z', end: '2026-03-12T13:45:00.000Z', resourceId: 'mtg3' },
  { id: 191, title: 'Architecture review',  start: '2026-03-12T15:00:00.000Z', end: '2026-03-12T16:30:00.000Z', resourceId: 'training' },
  { id: 192, title: 'API design session',   start: '2026-03-12T15:30:00.000Z', end: '2026-03-12T17:00:00.000Z' },
  { id: 193, title: 'Standup',              start: '2026-03-13T13:30:00.000Z', end: '2026-03-13T13:45:00.000Z', resourceId: 'mtg3' },
  { id: 194, title: 'Sprint 16 demo',       start: '2026-03-13T19:00:00.000Z', end: '2026-03-13T20:00:00.000Z', resourceId: 'annex' },

  // ── DST: US fall back Nov 1 2026 (02:00 EDT → 01:00 EST at 06:00 UTC) ──────
  // Multi-day spanning the transition weekend
  { id: 195, title: 'JS World recap',       allDay: true, start: '2026-10-30T00:00:00.000Z', end: '2026-11-03T00:00:00.000Z' },
  // Two events at the same local clock time, 1 hour apart in UTC (the repeated 01:00–02:00 EDT/EST hour)
  { id: 196, title: 'Overnight deploy (EDT)', start: '2026-11-01T05:00:00.000Z', end: '2026-11-01T06:00:00.000Z' },
  { id: 197, title: 'Overnight deploy (EST)', start: '2026-11-01T06:00:00.000Z', end: '2026-11-01T07:00:00.000Z' },
  // Workweek Nov 2–6 (all times in EST = UTC-5; 09:30 EST = 14:30 UTC)
  { id: 198, title: 'Standup',              start: '2026-11-02T14:30:00.000Z', end: '2026-11-02T14:45:00.000Z', resourceId: 'mtg3' },
  { id: 199, title: 'Team sync',            start: '2026-11-02T15:00:00.000Z', end: '2026-11-02T16:00:00.000Z', resourceId: 'board' },
  { id: 200, title: 'Q4 kickoff',           start: '2026-11-02T15:00:00.000Z', end: '2026-11-02T16:30:00.000Z' },
  { id: 201, title: 'Standup',              start: '2026-11-03T14:30:00.000Z', end: '2026-11-03T14:45:00.000Z', resourceId: 'mtg3' },
  { id: 202, title: '1:1 with Morgan',      start: '2026-11-03T19:00:00.000Z', end: '2026-11-03T19:30:00.000Z', resourceId: 'mtg1' },
  { id: 203, title: 'Standup',              start: '2026-11-04T14:30:00.000Z', end: '2026-11-04T14:45:00.000Z', resourceId: 'mtg3' },
  { id: 204, title: 'Sprint 27 planning',   start: '2026-11-04T18:00:00.000Z', end: '2026-11-04T21:00:00.000Z', resourceId: 'board' },
  { id: 205, title: 'Roadmap review',       start: '2026-11-04T18:00:00.000Z', end: '2026-11-04T19:30:00.000Z' },
  { id: 206, title: 'Standup',              start: '2026-11-05T14:30:00.000Z', end: '2026-11-05T14:45:00.000Z', resourceId: 'mtg3' },
  { id: 207, title: 'Tech debt review',     start: '2026-11-05T16:00:00.000Z', end: '2026-11-05T17:30:00.000Z', resourceId: 'training' },
  { id: 208, title: 'Platform planning',    start: '2026-11-05T16:30:00.000Z', end: '2026-11-05T18:00:00.000Z' },
  { id: 209, title: 'Standup',              start: '2026-11-06T14:30:00.000Z', end: '2026-11-06T14:45:00.000Z', resourceId: 'mtg3' },
  { id: 210, title: 'Sprint 27 demo',       start: '2026-11-06T20:00:00.000Z', end: '2026-11-06T21:00:00.000Z', resourceId: 'annex' },
]

/**
 * Events with `draggable: true` and `resizable: true` stamped on roughly two-thirds
 * of the set (those whose `id` is not a multiple of 3). The remaining third have
 * neither field, demonstrating the opt-in behaviour of the default `'draggable'` /
 * `'resizable'` string accessors: absent field → accessor returns `null` → false.
 */
export const demoEvents: DemoEvent[] = _base.map((e) =>
  e.id % 3 === 0 ? e : { ...e, draggable: true, resizable: true },
)
